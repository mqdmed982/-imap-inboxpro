import { Account } from '../types';
import EmailRow from './EmailRow';
import { RefreshCw, Trash2, Loader2 } from 'lucide-react';

interface Props {
  account: Account;
  searchQuery: string;
  onRefresh: (id: string) => void;
  onDelete: (id: string) => void;
  isRefreshing: boolean;
}

// Provider icon components
function GmailIcon() {
  return (
    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
      <svg viewBox="0 0 24 24" className="w-5 h-5">
        <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" fill="#EA4335"/>
      </svg>
    </div>
  );
}

function OutlookIcon() {
  return (
    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center shadow-sm">
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="white">
        <path d="M7.88 12.04q0 .45-.11.87-.1.41-.33.74-.22.33-.58.52-.37.2-.87.2t-.85-.2q-.35-.21-.57-.55-.22-.33-.33-.75-.1-.42-.1-.86t.1-.87q.1-.43.34-.76.22-.34.59-.54.36-.2.87-.2t.86.2q.35.21.57.55.22.34.31.77.1.43.1.88zM24 12v9.38q0 .46-.33.8-.33.32-.8.32H7.13q-.46 0-.8-.33-.32-.33-.32-.8V18H1q-.41 0-.7-.3-.3-.29-.3-.7V7q0-.41.3-.7Q.58 6 1 6h6.5V2.55q0-.44.3-.75.3-.3.75-.3h12.9q.44 0 .75.3.3.3.3.75V12zm-7.88-4.09q-.63 0-1.22.3-.58.31-.98.83-.4.53-.62 1.22-.22.7-.22 1.51 0 .8.22 1.5.2.7.61 1.24.4.53.97.84.58.3 1.22.3.65 0 1.2-.3.57-.3.98-.82.4-.51.62-1.21.22-.7.22-1.52v-.15q-.02-.79-.23-1.47-.22-.68-.62-1.18-.4-.51-.97-.81-.56-.28-1.18-.28z"/>
      </svg>
    </div>
  );
}

function YahooIcon() {
  return (
    <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center shadow-sm">
      <span className="text-white font-bold text-sm">Y!</span>
    </div>
  );
}

function OtherIcon() {
  return (
    <div className="w-8 h-8 rounded-full bg-slate-500 flex items-center justify-center shadow-sm">
      <span className="text-white font-bold text-sm">@</span>
    </div>
  );
}

function ProviderIcon({ provider }: { provider: string }) {
  if (provider === 'Gmail') return <GmailIcon />;
  if (provider.includes('Outlook')) return <OutlookIcon />;
  if (provider.includes('Yahoo') || provider.includes('At&t')) return <YahooIcon />;
  return <OtherIcon />;
}

function providerHeaderColor(provider: string): string {
  if (provider === 'Gmail') return 'from-green-600 to-green-500';
  if (provider.includes('Outlook')) return 'from-blue-600 to-blue-500';
  if (provider.includes('Yahoo') || provider.includes('At&t')) return 'from-purple-600 to-purple-500';
  return 'from-slate-600 to-slate-500';
}

export default function AccountCard({ account, searchQuery, onRefresh, onDelete, isRefreshing }: Props) {
  const filteredEmails = searchQuery
    ? account.emails.filter(e =>
        e.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.fromName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : account.emails;

  const displayed = filteredEmails.slice(0, 30);

  return (
    <div className="bg-[#1a2332] rounded-xl border border-white/5 overflow-hidden flex flex-col shadow-xl">
      {/* Header */}
      <div className={`bg-gradient-to-r ${providerHeaderColor(account.provider)} px-4 py-3`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ProviderIcon provider={account.provider} />
            <span className="text-white font-bold text-base">{account.provider}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right">
              <div className="text-white font-semibold text-sm leading-tight">{account.name}</div>
              <div className="text-white/70 text-xs">{account.email}</div>
            </div>
            <div className="flex gap-1 ml-2">
              <button
                onClick={() => onRefresh(account.id)}
                disabled={isRefreshing}
                title="Refresh"
                className="w-7 h-7 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors disabled:opacity-50"
              >
                {isRefreshing
                  ? <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                  : <RefreshCw className="w-3.5 h-3.5 text-white" />
                }
              </button>
              <button
                onClick={() => onDelete(account.id)}
                title="Remove account"
                className="w-7 h-7 bg-white/10 hover:bg-red-500/50 rounded-full flex items-center justify-center transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-[1fr_1fr_auto_auto] gap-2 px-3 py-1.5 bg-[#0f1923] border-b border-white/5 text-[10px] text-slate-500 uppercase tracking-wider font-medium">
        <span>From</span>
        <span>Subject</span>
        <span>Folder</span>
        <span className="text-right">Time</span>
      </div>

      {/* Email list */}
      <div className="flex-1 overflow-y-auto max-h-72 scrollbar-thin">
        {displayed.length === 0 ? (
          <div className="flex items-center justify-center h-24 text-slate-500 text-sm">
            {searchQuery ? 'No emails match your search' : 'No emails found'}
          </div>
        ) : (
          displayed.map((email, idx) => (
            <EmailRow key={`${email.uid}-${idx}`} email={email} />
          ))
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-2 bg-[#0f1923] border-t border-white/5 flex items-center justify-between">
        <span className="text-slate-500 text-xs">
          {filteredEmails.length} emails
          {account.emails.length !== filteredEmails.length && ` (filtered from ${account.emails.length})`}
        </span>
        <div className="flex gap-2 text-[10px]">
          <span className="text-green-400">{account.emails.filter(e => e.folder === 'INBOX').length} inbox</span>
          <span className="text-red-400">{account.emails.filter(e => e.folder === 'SPAM').length} spam</span>
        </div>
      </div>
    </div>
  );
}
