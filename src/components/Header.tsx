import React from 'react';
import { Plus, Search, Menu } from 'lucide-react';
import { SearchSuggestions } from './SearchSuggestions';

export interface HeaderProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  showSuggestions: boolean;
  onFocusSearch: () => void;
  searchRef: React.RefObject<HTMLDivElement | null>;
  filteredItems: { id: string; name: string; sku: string; category: string; quantity: number; minStockLevel: number }[];
  onSuggestionClick: (id: string) => void;
  onOpenRegister: () => void;
  onOpenSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchTerm,
  onSearchChange,
  showSuggestions,
  onFocusSearch,
  searchRef,
  filteredItems,
  onSuggestionClick,
  onOpenRegister,
  onOpenSidebar,
}) => (
  <header className="sticky top-0 z-50 bg-black/60 backdrop-blur-2xl border-b border-zinc-900/50 px-4 py-4 lg:px-12 lg:py-6">
    <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 lg:gap-8">
      <button
        onClick={onOpenSidebar}
        className="lg:hidden p-2.5 bg-zinc-900/50 rounded-xl text-[#D4AF37] border border-zinc-800"
      >
        <Menu size={20} />
      </button>

      <div className="flex-1 max-w-2xl relative" ref={searchRef}>
        <div className="relative group">
          <Search className={`absolute left-4 lg:left-5 top-1/2 -translate-y-1/2 transition-all duration-300 ${searchTerm ? 'text-[#D4AF37]' : 'text-zinc-600'}`} size={18} />
          <input
            type="text"
            placeholder="Scan records..."
            value={searchTerm}
            onFocus={onFocusSearch}
            onChange={(e) => {
              onSearchChange(e.target.value);
              onFocusSearch();
            }}
            className="w-full pl-10 pr-4 py-3 lg:pl-14 lg:pr-12 lg:py-4 bg-zinc-900/30 border border-zinc-800/50 rounded-xl lg:rounded-[1.5rem] focus:bg-black focus:border-[#D4AF37]/40 outline-none font-bold text-xs lg:text-sm text-white transition-all shadow-inner"
          />
        </div>

        {showSuggestions && searchTerm.length > 0 && (
          <SearchSuggestions items={filteredItems} onSuggestionClick={onSuggestionClick} />
        )}
      </div>

      <button
        onClick={onOpenRegister}
        className="bg-gradient-to-br from-[#D4AF37] to-[#B8860B] text-black p-3 lg:px-7 lg:py-4 rounded-xl lg:rounded-2xl flex items-center justify-center lg:space-x-3 font-black transition-all active:scale-95 shadow-lg"
      >
        <Plus size={20} strokeWidth={3} />
        <span className="hidden sm:inline uppercase text-[10px] tracking-widest">Register</span>
      </button>
    </div>
  </header>
);
