import { Email } from '../types';
import FolderBadge from './FolderBadge';

interface Props {
  email: Email;
}

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return email;
  const masked = local.length > 6
    ? local.slice(0, 4) + '****'
    : local.slice(0, 2) + '**';
  const domainParts = domain.split('.');
  const maskedDomain = domainParts[0].slice(0, 4) + '****.' + (domainParts[1] || 'com');
  return `${masked}@${maskedDomain}`;
}

export default function EmailRow({ email }: Props) {
  return (
    <div className="grid grid-cols-[1fr_1fr_auto_auto] gap-2 items-center py-2 px-3 border-b border-white/5 hover:bg-white/5 transition-colors text-xs group">
      {/* From */}
      <div className="min-w-0">
        <div className="text-slate-200 font-medium truncate group-hover:text-white transition-colors">
          {email.fromName || 'Unknown'}
        </div>
        <div className="text-slate-500 truncate text-[10px]">
          {maskEmail(email.from)}
        </div>
      </div>

      {/* Subject */}
      <div className="text-slate-300 truncate text-[11px]">
        {email.subject}
      </div>

      {/* Badge */}
      <div className="flex flex-col gap-0.5 items-end">
        <FolderBadge folder={email.folder} />
      </div>

      {/* Time */}
      <div className="text-slate-500 text-[10px] whitespace-nowrap text-right">
        {timeAgo(email.date)}
      </div>
    </div>
  );
}
