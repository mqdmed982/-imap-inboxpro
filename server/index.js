import express from 'express';
import cors from 'cors';
import { ImapFlow } from 'imapflow';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../dist')));

// In-memory stores
const emailsCache = new Map();   // accountId -> accountData
const idleClients = new Map();   // accountId -> ImapFlow (persistent IDLE connection)
const sseClients = new Set();    // Set of SSE response objects

// ── SSE broadcast ─────────────────────────────────────────────────────────────
function broadcast(event, data) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const res of sseClients) {
    try { res.write(payload); } catch {}
  }
}

// ── IMAP helpers ──────────────────────────────────────────────────────────────
function getImapConfig(host, port, email, password, tls = true) {
  return {
    host,
    port: parseInt(port) || 993,
    secure: tls,
    auth: { user: email, pass: password },
    logger: false,
    tls: { rejectUnauthorized: false },
  };
}

function detectProvider(email) {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return 'Others';
  if (domain.includes('gmail.com')) return 'Gmail';
  if (domain.includes('outlook.com') || domain.includes('hotmail.com') || domain.includes('live.com')) return 'Outlook / Hotmail';
  if (domain.includes('yahoo.com') || domain.includes('att.net') || domain.includes('sbcglobal.net')) return 'At&t / Yahoo';
  return 'Others';
}

function getProviderImapSettings(email) {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return { host: 'imap.gmail.com', port: 993 };
  if (domain.includes('gmail.com')) return { host: 'imap.gmail.com', port: 993 };
  if (domain.includes('outlook.com') || domain.includes('hotmail.com') || domain.includes('live.com')) return { host: 'outlook.office365.com', port: 993 };
  if (domain.includes('yahoo.com')) return { host: 'imap.mail.yahoo.com', port: 993 };
  if (domain.includes('att.net') || domain.includes('sbcglobal.net')) return { host: 'imap.mail.att.net', port: 993 };
  return { host: `imap.${domain}`, port: 993 };
}

// ── Fetch latest emails (one-shot connection) ─────────────────────────────────
async function fetchLatestEmails(config) {
  const client = new ImapFlow(config);
  await client.connect();

  const emails = [];
  const mailboxNames = ['INBOX', '[Gmail]/Spam', 'Spam', 'Junk', 'Junk Email'];

  for (const mbName of mailboxNames) {
    let lock;
    try {
      lock = await client.getMailboxLock(mbName);
      const folder = mbName.toLowerCase().includes('spam') || mbName.toLowerCase().includes('junk')
        ? 'SPAM'
        : mbName.toLowerCase().includes('forum') ? 'FORUMS' : 'INBOX';

      const messages = [];
      const mbStatus = await client.status(mbName, { messages: true });
      const total = mbStatus.messages || 0;
      if (total > 0) {
        const start = Math.max(1, total - 49);
        for await (const msg of client.fetch(`${start}:*`, {
          envelope: true,
          flags: true,
          internalDate: true,
        })) {
          messages.push({
            uid: msg.uid,
            subject: msg.envelope?.subject || '(No Subject)',
            from: msg.envelope?.from?.[0]?.address || '',
            fromName: msg.envelope?.from?.[0]?.name || msg.envelope?.from?.[0]?.address || '',
            date: msg.internalDate,
            folder,
            flags: msg.flags ? Array.from(msg.flags) : [],
          });
        }
      }
      messages.sort((a, b) => new Date(b.date) - new Date(a.date));
      emails.push(...messages.slice(0, 20));
    } catch {
      // Mailbox might not exist, skip
    } finally {
      if (lock) lock.release();
    }
  }

  await client.logout();
  return emails.sort((a, b) => new Date(b.date) - new Date(a.date));
}

// ── IMAP IDLE: persistent connection that listens for new mail ────────────────
async function startIdleWatcher(accountId) {
  const accountData = emailsCache.get(accountId);
  if (!accountData) return;

  stopIdleWatcher(accountId);

  const config = getImapConfig(
    accountData.imapHost,
    accountData.imapPort,
    accountData.email,
    accountData.password
  );

  const idleClient = new ImapFlow({ ...config, logger: false });

  try {
    await idleClient.connect();
    await idleClient.getMailboxLock('INBOX');
    idleClients.set(accountId, idleClient);
    console.log(`IDLE watcher started for ${accountData.email}`);

    // Fired when new messages arrive in INBOX
    idleClient.on('exists', async () => {
      console.log(`New mail for ${accountData.email}`);
      try {
        const freshConfig = getImapConfig(
          accountData.imapHost,
          accountData.imapPort,
          accountData.email,
          accountData.password
        );
        const emails = await fetchLatestEmails(freshConfig);
        accountData.emails = emails;
        accountData.connectedAt = new Date().toISOString();
        emailsCache.set(accountId, accountData);

        // Push to all connected browsers instantly
        broadcast('account-updated', {
          account: { ...accountData, password: undefined },
        });
      } catch (err) {
        console.error(`Refresh after IDLE failed: ${err.message}`);
      }
    });

    // Blocks here keeping IDLE alive
    await idleClient.idle();

  } catch (err) {
    console.error(`IDLE error for ${accountData?.email}: ${err.message}`);
    idleClients.delete(accountId);

    // Auto-reconnect after 30s
    setTimeout(() => {
      if (emailsCache.has(accountId)) startIdleWatcher(accountId);
    }, 30000);
  }
}

function stopIdleWatcher(accountId) {
  const existing = idleClients.get(accountId);
  if (existing) {
    try { existing.logout(); } catch {}
    idleClients.delete(accountId);
  }
}

// ── GET /api/events — SSE stream ──────────────────────────────────────────────
app.get('/api/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // needed for Render/nginx proxies
  res.flushHeaders();

  // Heartbeat every 25s to keep connection alive through proxies
  const heartbeat = setInterval(() => {
    try { res.write(': heartbeat\n\n'); } catch {}
  }, 25000);

  sseClients.add(res);
  console.log(`SSE client connected (total: ${sseClients.size})`);

  req.on('close', () => {
    clearInterval(heartbeat);
    sseClients.delete(res);
  });
});

// ── POST /api/accounts/connect ────────────────────────────────────────────────
app.post('/api/accounts/connect', async (req, res) => {
  const { email, password, imapHost, imapPort, name, useTls } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const settings = imapHost
    ? { host: imapHost, port: imapPort || 993 }
    : getProviderImapSettings(email);

  const config = getImapConfig(settings.host, settings.port, email, password, useTls !== false);
  const provider = detectProvider(email);

  try {
    const emails = await fetchLatestEmails(config);

    const accountId = `${email}_${Date.now()}`;
    const accountData = {
      id: accountId,
      email,
      name: name || email.split('@')[0],
      provider,
      imapHost: settings.host,
      imapPort: settings.port,
      password,
      emails,
      connectedAt: new Date().toISOString(),
      status: 'connected',
    };

    emailsCache.set(accountId, accountData);

    // Start IDLE watcher (non-blocking)
    startIdleWatcher(accountId);

    return res.json({
      success: true,
      account: { ...accountData, password: undefined },
    });
  } catch (err) {
    console.error('IMAP connect error:', err.message);
    return res.status(500).json({
      error: `Connection failed: ${err.message}`,
      details: err.responseText || '',
    });
  }
});

// ── GET /api/accounts ─────────────────────────────────────────────────────────
app.get('/api/accounts', (req, res) => {
  const accounts = [];
  for (const [, data] of emailsCache.entries()) {
    accounts.push({ ...data, password: undefined });
  }
  res.json({ accounts });
});

// ── DELETE /api/accounts/:id ──────────────────────────────────────────────────
app.delete('/api/accounts/:id', (req, res) => {
  const { id } = req.params;
  if (emailsCache.has(id)) {
    stopIdleWatcher(id);
    emailsCache.delete(id);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Account not found' });
  }
});

// ── POST /api/accounts/:id/refresh ───────────────────────────────────────────
app.post('/api/accounts/:id/refresh', async (req, res) => {
  const { id } = req.params;
  const accountData = emailsCache.get(id);
  if (!accountData) return res.status(404).json({ error: 'Account not found' });

  const config = getImapConfig(accountData.imapHost, accountData.imapPort, accountData.email, accountData.password);
  try {
    const emails = await fetchLatestEmails(config);
    accountData.emails = emails;
    accountData.connectedAt = new Date().toISOString();
    emailsCache.set(id, accountData);
    res.json({ success: true, account: { ...accountData, password: undefined } });
  } catch (err) {
    res.status(500).json({ error: `Refresh failed: ${err.message}` });
  }
});

// ── GET /api/stats ────────────────────────────────────────────────────────────
app.get('/api/stats', (req, res) => {
  const stats = { Gmail: 0, 'Outlook / Hotmail': 0, 'At&t / Yahoo': 0, Others: 0 };
  let total = 0;

  for (const [, data] of emailsCache.entries()) {
    const inboxCount = data.emails.filter(e => e.folder === 'INBOX').length;
    stats[data.provider] = (stats[data.provider] || 0) + inboxCount;
    total += inboxCount;
  }

  const result = Object.entries(stats).map(([name, count]) => ({
    name,
    count,
    percentage: total > 0 ? Math.round((count / total) * 100) : 0,
  }));

  res.json({ stats: result, total });
});

// ── Catch-all ─────────────────────────────────────────────────────────────────
app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`Inboxious server running on port ${PORT}`);
});
