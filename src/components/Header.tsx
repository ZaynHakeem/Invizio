import React, { useRef, useEffect } from 'react';
import { Search, Menu, Plus, ChevronRight, SearchX, X } from 'lucide-react';
import { InventoryItem, ViewType } from '../types';

interface HeaderProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  showSuggestions: boolean;
  setShowSuggestions: (show: boolean) => void;
  filteredItems: InventoryItem[];
  setIsSidebarOpen: (open: boolean) => void;
  onAddItem: () => void;
  onSuggestionClick: (id: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchTerm,
  setSearchTerm,
  showSuggestions,
  setShowSuggestions,
  filteredItems,
  setIsSidebarOpen,
  onAddItem,
  onSuggestionClick
}) => {
  const searchRef = useRef<HTMLDivElement>(null);

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setShowSuggestions]);

  return (
    <header className="sticky top-0 z-50 bg-black/60 backdrop-blur-2xl border-b border-zinc-900/50 px-4 py-4 lg:px-12 lg:py-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 lg:gap-8">
        <button 
          onClick={() => setIsSidebarOpen(true)} 
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
              onFocus={() => setShowSuggestions(true)}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowSuggestions(true);
              }}
              className="w-full pl-10 pr-4 py-3 lg:pl-14 lg:pr-12 lg:py-4 bg-zinc-900/30 border border-zinc-800/50 rounded-xl lg:rounded-[1.5rem] focus:bg-black focus:border-[#D4AF37]/40 outline-none font-bold text-xs lg:text-sm text-white transition-all shadow-inner"
            />
          </div>

          {/* Search Suggestions Dropdown */}
          {showSuggestions && searchTerm.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-[#0A0A0A] border border-zinc-800 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden z-[100] animate-in slide-in-from-top-2 duration-200">
              <div className="max-h-[400px] overflow-y-auto p-2">
                {filteredItems.length > 0 ? (
                  filteredItems.slice(0, 8).map(item => (
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
          )}
        </div>

        <button 
          onClick={onAddItem}
          className="bg-gradient-to-br from-[#D4AF37] to-[#B8860B] text-black p-3 lg:px-7 lg:py-4 rounded-xl lg:rounded-2xl flex items-center justify-center lg:space-x-3 font-black transition-all active:scale-95 shadow-lg"
        >
          <Plus size={20} strokeWidth={3} />
          <span className="hidden sm:inline uppercase text-[10px] tracking-widest">Register</span>
        </button>
      </div>
    </header>
  );
};
