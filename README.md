# 📬 Inboxious – IMAP Email Monitor

A real-time email inbox monitoring dashboard that connects to multiple IMAP accounts and displays emails in a beautiful dark-themed UI.

## Features

- 🔌 **IMAP connection** – Connect Gmail, Outlook, Yahoo, and any IMAP server
- 📊 **Provider stats** – Visual donut charts per email provider
- 🔍 **Real-time search** – Search across all accounts and emails
- 🔄 **Auto-refresh** – Emails update every 30 seconds
- 📋 **Copy recipients** – Copy all connected emails to clipboard
- 🏷️ **Folder detection** – Inbox, Spam, Forums, Personal badges
- 🌐 **Render.com ready** – One-click deploy

## Setup

### Local Development

```bash
# Install dependencies
npm install

# Build frontend
npm run build

# Start backend server
node server/index.js
```

Then open http://localhost:3001

### Render.com Deployment

1. Push this repo to GitHub
2. Go to [Render.com](https://render.com) → New Web Service
3. Connect your repo
4. Set:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `node server/index.js`
   - **Environment**: Node
5. Add environment variable: `PORT=3001`
6. Deploy!

## IMAP Setup

### Gmail
1. Enable IMAP in Gmail Settings → See All Settings → Forwarding and POP/IMAP
2. Enable 2FA on your Google account
3. Create an [App Password](https://myaccount.google.com/apppasswords)
4. Use your Gmail address + the App Password (not your account password)

### Outlook / Hotmail
- Use your full email + account password
- IMAP Host: `outlook.office365.com` (auto-detected)

### Yahoo
- Create an [App Password](https://login.yahoo.com/myaccount/security/) in your account
- IMAP Host: `imap.mail.yahoo.com` (auto-detected)

## Stack

- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Express.js + ImapFlow
- **Hosting**: Render.com
