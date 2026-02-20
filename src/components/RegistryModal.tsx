import React from 'react';
import { X, ChevronDown, PlusCircle } from 'lucide-react';
import type { InventoryItem } from '../types';

export interface RegistryModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingItem: InventoryItem | null;
  modalCategory: string;
  isNewCategoryMode: boolean;
  existingCategories: string[];
  onCategoryChange: (value: string) => void;
  onNewCategoryModeChange: (value: boolean) => void;
  onSave: (e: React.FormEvent<HTMLFormElement>) => void;
}

export const RegistryModal: React.FC<RegistryModalProps> = ({
  isOpen,
  onClose,
  editingItem,
  modalCategory,
  isNewCategoryMode,
  existingCategories,
  onCategoryChange,
  onNewCategoryModeChange,
  onSave,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/95 backdrop-blur-xl animate-in fade-in duration-500" onClick={onClose} />
      <div className="relative bg-[#0A0A0A] w-full max-w-2xl rounded-t-[2.5rem] sm:rounded-[4rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-500 border border-zinc-800/50 max-h-[90vh] flex flex-col">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#D4AF37] to-[#B8860B]" />
        <div className="px-8 py-8 sm:px-12 sm:py-10 border-b border-zinc-900/50 flex items-center justify-between">
          <div>
            <h3 className="text-2xl lg:text-3xl font-black text-white leading-none uppercase tracking-tighter">{editingItem ? 'Update Protocol' : 'New Entry'}</h3>
            <p className="text-zinc-600 text-[9px] font-black uppercase tracking-[0.3em] mt-3">Registry Module</p>
          </div>
          <button onClick={onClose} className="p-3 bg-zinc-900 rounded-xl text-zinc-600 hover:text-white transition-all"><X size={20} /></button>
        </div>

        <form onSubmit={onSave} className="p-8 sm:p-12 overflow-y-auto space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            <div className="col-span-full">
              <label className="text-[9px] font-black text-zinc-700 uppercase tracking-widest ml-4 mb-3 block">Entity Name</label>
              <input required name="name" defaultValue={editingItem?.name} className="w-full px-6 py-4 bg-zinc-900/40 border border-zinc-800/50 rounded-2xl focus:bg-black focus:border-[#D4AF37]/40 outline-none transition-all font-black text-white text-lg tracking-tight" placeholder="ASSET NAME" />
            </div>

            <div className="col-span-full">
              <label className="text-[9px] font-black text-zinc-700 uppercase tracking-widest ml-4 mb-3 block">Classification Sector</label>
              {!isNewCategoryMode ? (
                <div className="relative">
                  <select
                    required
                    value={modalCategory}
                    onChange={(e) => {
                      if (e.target.value === '__NEW__') {
                        onNewCategoryModeChange(true);
                        onCategoryChange('');
                      } else {
                        onCategoryChange(e.target.value);
                      }
                    }}
                    className="w-full px-6 py-4 bg-zinc-900/40 border border-zinc-800/50 rounded-2xl focus:bg-black focus:border-[#D4AF37]/40 outline-none transition-all font-black text-white appearance-none cursor-pointer text-xs uppercase tracking-widest"
                  >
                    <option value="" disabled>Select Classification</option>
                    {existingCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                    <option value="__NEW__" className="text-[#D4AF37]">+ Create New Sector...</option>
                  </select>
                  <ChevronDown size={16} className="absolute right-5 top-1/2 -translate-y-1/2 text-[#D4AF37] pointer-events-none" />
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <div className="relative flex-1">
                    <input required name="newCategory" autoFocus className="w-full px-6 py-4 bg-zinc-900/40 border border-[#D4AF37]/40 rounded-2xl focus:bg-black focus:border-[#D4AF37] outline-none transition-all font-black text-white text-xs uppercase tracking-widest" placeholder="New sector name..." />
                    <PlusCircle size={16} className="absolute right-5 top-1/2 -translate-y-1/2 text-[#D4AF37]" />
                  </div>
                  <button type="button" onClick={() => onNewCategoryModeChange(false)} className="p-3 text-zinc-600 hover:text-white transition-colors"><X size={18} /></button>
                </div>
              )}
            </div>

            <div>
              <label className="text-[9px] font-black text-zinc-700 uppercase tracking-widest ml-4 mb-3 block">Asset Value (USD)</label>
              <input required name="price" type="number" step="0.01" defaultValue={editingItem?.price} className="w-full px-6 py-4 bg-zinc-900/40 border border-zinc-800/50 rounded-2xl focus:bg-black focus:border-[#D4AF37]/40 outline-none transition-all font-black text-white text-xs" placeholder="0.00" />
            </div>
            <div>
              <label className="text-[9px] font-black text-zinc-700 uppercase tracking-widest ml-4 mb-3 block">Quantity</label>
              <input required name="quantity" type="number" defaultValue={editingItem?.quantity} className="w-full px-6 py-4 bg-zinc-900/40 border border-zinc-800/50 rounded-2xl focus:bg-black focus:border-[#D4AF37]/40 outline-none transition-all font-black text-white text-xs" placeholder="0" />
            </div>
            <div className="col-span-full md:col-span-1">
              <label className="text-[9px] font-black text-zinc-700 uppercase tracking-widest ml-4 mb-3 block">Min. Stock Level</label>
              <input required name="minStockLevel" type="number" defaultValue={editingItem?.minStockLevel} className="w-full px-6 py-4 bg-zinc-900/40 border border-zinc-800/50 rounded-2xl focus:bg-black focus:border-[#D4AF37]/40 outline-none transition-all font-black text-white text-xs" placeholder="10" />
            </div>
          </div>
          <button type="submit" className="w-full py-6 bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-black font-black rounded-[2rem] shadow-xl transition-all active:scale-95 text-[10px] uppercase tracking-widest mt-6">
            {editingItem ? 'Confirm Updates' : 'Authorize Entry'}
          </button>
        </form>
      </div>
    </div>
  );
};
