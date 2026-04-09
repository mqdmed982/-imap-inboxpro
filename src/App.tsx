import { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Copy, RefreshCw, Mail, Wifi, WifiOff } from 'lucide-react';
import { Account, ProviderStat, ConnectFormData } from './types';
import { connectAccount, getAccounts, deleteAccount, refreshAccount, getStats } from './api';
import ConnectModal from './components/ConnectModal';
import AccountCard from './components/AccountCard';
import StatCard from './components/StatCard';

const DEFAULT_STATS: ProviderStat[] = [
  { name: 'GMAIL', count: 0, percentage: 0 },
  { name: 'Outlook / Hotmail', count: 0, percentage: 0 },
  { name: 'At&t / Yahoo', count: 0, percentage: 0 },
  { name: 'Others', count: 0, percentage: 0 },
];

export default function App() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [stats, setStats] = useState<ProviderStat[]>(DEFAULT_STATS);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [refreshingIds, setRefreshingIds] = useState<Set<string>>(new Set());
  const [serverOnline, setServerOnline] = useState<boolean | null>(null);
  const [copiedRecipients, setCopiedRecipients] = useState(false);
  const [globalRefreshing, setGlobalRefreshing] = useState(false);

  // Check if server is reachable
  const checkServer = useCallback(async () => {
    try {
      const res = await fetch('/api/stats');
      setServerOnline(res.ok);
    } catch {
      setServerOnline(false);
    }
  }, []);

  const loadAccounts = useCallback(async () => {
    try {
      const data = await getAccounts();
      setAccounts(data.accounts);
    } catch (err) {
      console.error('Failed to load accounts:', err);
    }
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const data = await getStats();
      // Merge with default stat names
      const merged = DEFAULT_STATS.map(def => {
        const found = data.stats.find(s =>
          s.name.toLowerCase() === def.name.toLowerCase()
        );
        return found ? { ...def, ...found } : def;
      });
      setStats(merged);
    } catch {
      setStats(DEFAULT_STATS);
    }
  }, []);

  useEffect(() => {
    checkServer();
    loadAccounts();
    loadStats();
    // Auto-refresh every 30 seconds as fallback
    const interval = setInterval(() => {
      loadAccounts();
      loadStats();
    }, 30000);
    return () => clearInterval(interval);
  }, [checkServer, loadAccounts, loadStats]);

  // Real-time updates via SSE (Server-Sent Events)
  useEffect(() => {
    const API_BASE = import.meta.env.VITE_API_URL || '';
    const es = new EventSource(`${API_BASE}/api/events`);

    es.addEventListener('account-updated', (e) => {
      const { account } = JSON.parse(e.data);
      setAccounts(prev => prev.map(a => a.id === account.id ? account : a));
      loadStats();
    });

    es.onerror = () => {
      // SSE will auto-reconnect, no action needed
    };

    return () => es.close();
  }, [loadStats]);

  const handleConnect = async (formData: ConnectFormData) => {
    setIsConnecting(true);
    setConnectError(null);
    try {
      const payload: {
        email: string;
        password: string;
        name?: string;
        imapHost?: string;
        imapPort?: number;
        useTls?: boolean;
      } = {
        email: formData.email,
        password: formData.password,
        name: formData.name || undefined,
        useTls: formData.useTls,
      };
      if (!formData.autoDetect && formData.imapHost) {
        payload.imapHost = formData.imapHost;
        payload.imapPort = parseInt(formData.imapPort) || 993;
      }
      const result = await connectAccount(payload);
      setAccounts(prev => [...prev, result.account]);
      await loadStats();
      setShowModal(false);
    } catch (err) {
      setConnectError(err instanceof Error ? err.message : 'Connection failed');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleRefresh = async (id: string) => {
    setRefreshingIds(prev => new Set([...prev, id]));
    try {
      const result = await refreshAccount(id);
      setAccounts(prev => prev.map(a => a.id === id ? result.account : a));
      await loadStats();
    } catch (err) {
      console.error('Refresh failed:', err);
    } finally {
      setRefreshingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleDelete = async (id: string) => {
    await deleteAccount(id);
    setAccounts(prev => prev.filter(a => a.id !== id));
    await loadStats();
  };

  const handleGlobalRefresh = async () => {
    setGlobalRefreshing(true);
    try {
      await Promise.all(accounts.map(a => handleRefresh(a.id)));
    } finally {
      setGlobalRefreshing(false);
    }
  };

  const handleCopyRecipients = () => {
    const emails = accounts.map(a => a.email).join(', ');
    if (emails) {
      navigator.clipboard.writeText(emails);
      setCopiedRecipients(true);
      setTimeout(() => setCopiedRecipients(false), 2000);
    }
  };

  const filteredAccounts = accounts.filter(acc => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      acc.email.toLowerCase().includes(q) ||
      acc.name.toLowerCase().includes(q) ||
      acc.emails.some(e =>
        e.subject.toLowerCase().includes(q) ||
        e.fromName.toLowerCase().includes(q) ||
        e.from.toLowerCase().includes(q)
      )
    );
  });

  return (
    <div className="min-h-screen bg-[#0d1b2a] text-white">
      {/* ── NAVBAR ── */}
      <header className="sticky top-0 z-40 bg-[#0d1b2a]/95 backdrop-blur border-b border-white/5 px-4 py-3">
        <div className="max-w-screen-2xl mx-auto flex items-center gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2 mr-4 shrink-0">
            <div className="w-8 h-8 bg-green-500/20 border border-green-500/30 rounded-lg flex items-center justify-center">
              <Mail className="w-4 h-4 text-green-400" />
            </div>
            <span className="text-white font-bold text-lg tracking-tight">Inboxious</span>
          </div>

          {/* Search */}
          <div className="flex-1 relative max-w-2xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Enter keyword to search your mails..."
              className="w-full bg-[#1a2535] border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-green-500/50 text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopyRecipients}
              title="Copy all email addresses"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                copiedRecipients
                  ? 'bg-green-500/20 border-green-500/50 text-green-400'
                  : 'bg-[#1a2535] border-white/10 text-slate-300 hover:border-white/20'
              }`}
            >
              <Copy className="w-4 h-4" />
              {copiedRecipients ? 'Copied!' : 'Copy Recipients'}
            </button>

            <button
              onClick={handleGlobalRefresh}
              disabled={globalRefreshing || accounts.length === 0}
              title="Refresh all accounts"
              className="w-9 h-9 bg-[#1a2535] border border-white/10 rounded-lg flex items-center justify-center hover:border-white/20 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 text-slate-300 ${globalRefreshing ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={() => { setShowModal(true); setConnectError(null); }}
              className="flex items-center gap-2 px-3 py-2 bg-green-500 hover:bg-green-400 text-white rounded-lg text-sm font-semibold transition-colors shadow-lg shadow-green-500/20"
            >
              <Plus className="w-4 h-4" />
              Add Account
            </button>

            {/* Server status */}
            <div
              title={serverOnline === null ? 'Checking server...' : serverOnline ? 'Server online' : 'Server offline – backend not running'}
              className={`w-9 h-9 rounded-lg border flex items-center justify-center transition-colors ${
                serverOnline === null
                  ? 'border-slate-600 bg-[#1a2535]'
                  : serverOnline
                  ? 'border-green-500/30 bg-green-500/10'
                  : 'border-red-500/30 bg-red-500/10'
              }`}
            >
              {serverOnline
                ? <Wifi className="w-4 h-4 text-green-400" />
                : <WifiOff className="w-4 h-4 text-red-400" />
              }
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-screen-2xl mx-auto px-4 py-6 space-y-6">
        {/* ── STATS + HOW-TO ── */}
        <div className="flex flex-wrap gap-4 items-start">
          {/* Stat cards */}
          <div className="flex gap-3 flex-wrap">
            {stats.map(stat => (
              <StatCard key={stat.name} stat={stat} />
            ))}
          </div>

          {/* How-to panel */}
          <div className="flex-1 min-w-64 bg-[#1a2535] rounded-xl border border-white/5 p-5">
            <h3 className="text-slate-200 font-semibold mb-3 text-sm">How to test your emails?</h3>
            <ol className="space-y-2 text-slate-400 text-sm">
              <li className="flex gap-2">
                <span className="text-green-400 font-bold shrink-0">1.</span>
                Copy recipients by clicking{' '}
                <button
                  onClick={handleCopyRecipients}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#0d1b2a] border border-white/10 rounded text-slate-300 text-xs hover:border-green-500/50 transition-colors"
                >
                  Copy recipients
                </button>
              </li>
              <li className="flex gap-2">
                <span className="text-green-400 font-bold shrink-0">2.</span>
                Send your test mail to the copied email addresses.
              </li>
              <li className="flex gap-2">
                <span className="text-green-400 font-bold shrink-0">3.</span>
                Search for the 'Subject line' or 'Sender's name' to see the stats.
              </li>
            </ol>

            {serverOnline === false && (
              <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <p className="text-amber-400 text-xs font-medium">⚠️ Backend server not detected</p>
                <p className="text-amber-400/70 text-xs mt-1">
                  Run <code className="bg-black/30 px-1 rounded">node server/index.js</code> locally,
                  or deploy to Render.com for full IMAP functionality.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── ACCOUNT GRID ── */}
        {accounts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <div className="w-20 h-20 bg-[#1a2535] rounded-2xl border border-white/10 flex items-center justify-center">
              <Mail className="w-10 h-10 text-slate-600" />
            </div>
            <div>
              <h2 className="text-slate-300 text-xl font-semibold mb-2">No accounts connected</h2>
              <p className="text-slate-500 text-sm max-w-sm">
                Click <span className="text-green-400">"Add Account"</span> to connect your first IMAP email account
                and start monitoring your inbox in real-time.
              </p>
            </div>
            <button
              onClick={() => { setShowModal(true); setConnectError(null); }}
              className="flex items-center gap-2 px-5 py-2.5 bg-green-500 hover:bg-green-400 text-white rounded-lg font-semibold transition-colors shadow-lg shadow-green-500/20"
            >
              <Plus className="w-5 h-5" />
              Connect First Account
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4">
            {filteredAccounts.map(account => (
              <AccountCard
                key={account.id}
                account={account}
                searchQuery={searchQuery}
                onRefresh={handleRefresh}
                onDelete={handleDelete}
                isRefreshing={refreshingIds.has(account.id)}
              />
            ))}
          </div>
        )}

        {accounts.length > 0 && filteredAccounts.length === 0 && (
          <div className="text-center py-16 text-slate-500">
            <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No accounts or emails match "<span className="text-slate-400">{searchQuery}</span>"</p>
          </div>
        )}
      </main>

      {/* ── CONNECT MODAL ── */}
      {showModal && (
        <ConnectModal
          onClose={() => setShowModal(false)}
          onConnect={handleConnect}
          isLoading={isConnecting}
          error={connectError}
        />
      )}
    </div>
  );
}
