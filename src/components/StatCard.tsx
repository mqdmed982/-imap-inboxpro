import { ProviderStat } from '../types';

interface Props {
  stat: ProviderStat;
}

export default function StatCard({ stat }: Props) {
  const pct = Math.min(stat.percentage, 100);
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (pct / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-between bg-[#1a2535] rounded-xl p-5 border border-white/5 hover:border-white/10 transition-all min-w-[130px]">
      <div className="relative w-24 h-24">
        <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
          {/* Background circle */}
          <circle
            cx="48"
            cy="48"
            r={radius}
            fill="none"
            stroke="#1e3a5a"
            strokeWidth="8"
          />
          {/* Progress circle */}
          <circle
            cx="48"
            cy="48"
            r={radius}
            fill="none"
            stroke={pct > 0 ? '#22c55e' : '#2d4a6e'}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-700"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-white font-bold text-lg">{pct}%</span>
        </div>
      </div>
      <span className="text-slate-300 text-sm text-center mt-3 font-medium">{stat.name}</span>
      {stat.count > 0 && (
        <span className="text-slate-500 text-xs mt-1">{stat.count} emails</span>
      )}
    </div>
  );
}
