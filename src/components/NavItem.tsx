import React from 'react';
import type { ViewType } from '../types';
import type { LucideIcon } from 'lucide-react';

export interface NavItemProps {
  view: ViewType;
  icon: LucideIcon;
  label: string;
  badge?: number;
  activeView: ViewType;
  onSelect: (view: ViewType) => void;
}

export const NavItem: React.FC<NavItemProps> = ({
  view,
  icon: Icon,
  label,
  badge,
  activeView,
  onSelect,
}) => (
  <button
    onClick={() => onSelect(view)}
    className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl transition-all duration-300 group active:scale-95 touch-manipulation ${
      activeView === view
        ? 'bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-black shadow-lg'
        : 'text-zinc-500 hover:text-white hover:bg-zinc-900/50'
    }`}
  >
    <div className="flex items-center space-x-4">
      <Icon size={18} className={activeView === view ? 'text-black' : 'group-hover:text-[#D4AF37] transition-colors'} />
      <span className="font-bold tracking-widest text-[11px] uppercase">{label}</span>
    </div>
    {badge !== undefined && badge > 0 ? (
      <span className={`px-2 py-0.5 text-[9px] font-black rounded-lg ${
        activeView === view ? 'bg-black text-[#D4AF37]' : 'bg-red-500/10 text-red-500 border border-red-500/20'
      }`}>
        {badge}
      </span>
    ) : null}
  </button>
);
