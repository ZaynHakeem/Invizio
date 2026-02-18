import React from 'react';
import { AlertTriangle, ChevronRight } from 'lucide-react';
import type { InventoryItem } from '../types';

export interface AlertCardProps {
  item: InventoryItem;
  onRestock: (item: InventoryItem) => void;
}

export const AlertCard: React.FC<AlertCardProps> = ({ item, onRestock }) => (
  <div className="bg-zinc-900/20 p-10 rounded-[3rem] border border-amber-500/10 flex flex-col justify-between group relative overflow-hidden">
    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/[0.03] blur-3xl rounded-full -mr-16 -mt-16" />
    <div>
      <div className="flex items-center justify-between mb-10">
        <span className="text-[9px] font-black text-amber-500 bg-amber-500/10 px-4 py-2 rounded-xl uppercase tracking-widest border border-amber-500/20">Depletion Risk</span>
        <AlertTriangle size={24} className="text-amber-500 animate-pulse" />
      </div>
      <h4 className="text-2xl font-black text-white mb-2 tracking-tighter uppercase">{item.name}</h4>
      <p className="text-[9px] text-zinc-600 font-black uppercase tracking-[0.2em] mb-12">{item.sku} • {item.category}</p>

      <div className="flex justify-between items-center p-6 bg-black/50 rounded-[2rem] border border-zinc-800 mb-10">
        <span className="text-zinc-600 font-black uppercase tracking-widest text-[9px]">Live Volume</span>
        <span className={`font-black text-3xl tracking-tighter ${item.quantity === 0 ? 'text-rose-500' : 'text-amber-500'}`}>{item.quantity}</span>
      </div>
    </div>
    <button onClick={() => onRestock(item)} className="w-full bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-black py-5 rounded-3xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center space-x-2 shadow-xl">
      <span>Restock Protocol</span>
      <ChevronRight size={16} />
    </button>
  </div>
);
