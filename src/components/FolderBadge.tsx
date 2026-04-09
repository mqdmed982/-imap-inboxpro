interface Props {
  folder: string;
}

const colors: Record<string, string> = {
  INBOX: 'bg-green-500 text-white',
  SPAM: 'bg-red-500 text-white',
  FORUMS: 'bg-amber-500 text-white',
  PERSONAL: 'bg-blue-500 text-white',
  UPDATES: 'bg-purple-500 text-white',
  PROMOTIONS: 'bg-pink-500 text-white',
};

export default function FolderBadge({ folder }: Props) {
  const cls = colors[folder] || 'bg-slate-500 text-white';
  return (
    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${cls} whitespace-nowrap`}>
      {folder}
    </span>
  );
}
