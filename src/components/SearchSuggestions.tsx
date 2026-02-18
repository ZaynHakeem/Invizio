import React from 'react';
import { ChevronRight, SearchX } from 'lucide-react';
import type { InventoryItem } from '../types';

export interface SearchSuggestionsProps {
  items: InventoryItem[];
  onSuggestionClick: (id: string) => void;
}

export const SearchSuggestions: React.FC<SearchSuggestionsProps> = ({ items, onSuggestionClick }) => (
  <div className="absolute top-full left-0 right-0 mt-2 bg-[#0A0A0A] border border-zinc-800 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden z-[100] animate-in slide-in-from-top-2 duration-200">
    <div className="max-h-[400px] overflow-y-auto p-2">
      {items.length > 0 ? (
        items.slice(0, 8).map(item => (
          <button
            key={item.id}
            onClick={() => onSuggestionClick(item.id)}
            className="w-full flex items-center justify-between p-4 hover:bg-zinc-900/50 rounded-2xl transition-all group text-left"
          >
            <div className="flex items-center space-x-4">
              <div className={`w-2 h-2 rounded-full ${item.quantity === 0 ? 'bg-rose-500' : item.quantity <= item.minStockLevel ? 'bg-amber-500' : 'bg-emerald-500'}`} />
              <div>
                <p className="text-xs font-black text-white group-hover:text-[#D4AF37] transition-colors uppercase">{item.name}</p>
                <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest">{item.sku} • {item.category}</p>
              </div>
            </div>
            <ChevronRight size={14} className="text-zinc-800 group-hover:text-[#D4AF37] transition-colors" />
          </button>
        ))
      ) : (
        <div className="p-8 text-center">
          <SearchX size={32} className="mx-auto text-zinc-800 mb-3" />
          <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">No vault records match your scan</p>
        </div>
      )}
    </div>
  </div>
);
