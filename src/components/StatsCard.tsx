import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface StatsCardProps {
  label: string;
  val: string | number;
  icon: LucideIcon;
  color: string;
  bg: string;
  onClick: () => void;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  label,
  val,
  icon: Icon,
  color,
  bg,
  onClick,
}) => (
  <button
    onClick={onClick}
    className="bg-zinc-900/20 text-left p-6 lg:p-8 rounded-[2.5rem] border border-zinc-800/50 hover:border-[#D4AF37]/60 transition-all group shadow-xl active:scale-[0.98]"
  >
    <div className="flex items-center justify-between mb-6 lg:mb-8">
      <div className={`p-3 lg:p-4 ${bg} ${color} rounded-2xl`}>
        <Icon size={26} strokeWidth={1.5} />
      </div>
      <ArrowUpRight size={14} className="text-zinc-700 group-hover:text-[#D4AF37]" />
    </div>
    <p className="text-[8px] lg:text-[10px] font-black text-zinc-500 uppercase tracking-[0.25em]">{label}</p>
    <h3 className="text-lg lg:text-2xl xl:text-3xl font-black text-white mt-1 lg:mt-2 tracking-tighter truncate">{val}</h3>
  </button>
);
