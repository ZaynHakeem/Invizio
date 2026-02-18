import React from 'react';
import { Edit2, Trash2, SearchX } from 'lucide-react';
import type { InventoryItem } from '../types';

export interface InventoryViewProps {
  filteredItems: InventoryItem[];
  onEditItem: (item: InventoryItem) => void;
  onDeleteItem: (id: string) => void;
  onClearSearch: () => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  filteredItems,
  onEditItem,
  onDeleteItem,
  onClearSearch,
}) => (
  <div className="space-y-8 animate-in fade-in duration-700">
    <div className="mb-4">
      <h2 className="text-3xl lg:text-4xl font-black text-white tracking-tighter uppercase">Asset Ledger</h2>
      <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.3em] mt-3">Verified Local Records • {filteredItems.length} Entities</p>
    </div>

    <div className="bg-zinc-900/10 rounded-[2.5rem] border border-zinc-800/50 shadow-2xl overflow-hidden">
      <div className="overflow-x-auto">
        {filteredItems.length > 0 ? (
          <table className="w-full text-left min-w-[800px]">
            <thead className="bg-black/40 text-zinc-600 text-[9px] font-black uppercase tracking-[0.3em]">
              <tr>
                <th className="px-10 py-6 border-b border-zinc-800/50">Entity Signature</th>
                <th className="px-10 py-6 border-b border-zinc-800/50">Status</th>
                <th className="px-10 py-6 border-b border-zinc-800/50 text-center">Volume</th>
                <th className="px-10 py-6 border-b border-zinc-800/50">Valuation</th>
                <th className="px-10 py-6 border-b border-zinc-800/50 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900/30">
              {filteredItems.map(item => (
                <tr key={item.id} className="group hover:bg-[#D4AF37]/[0.02] transition-colors">
                  <td className="px-10 py-8">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-[#D4AF37] mb-2 leading-none">{item.sku}</span>
                      <span className="font-black text-white text-lg tracking-tight group-hover:text-[#D4AF37] transition-colors truncate max-w-[240px]">{item.name}</span>
                      <span className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest mt-1">{item.category}</span>
                    </div>
                  </td>
                  <td className="px-10 py-8">
                    <div className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-full border ${
                      item.quantity === 0 ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                      item.quantity <= item.minStockLevel ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                      'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                    }`}>
                      <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                      <span className="text-[9px] font-black uppercase tracking-widest">
                        {item.quantity === 0 ? 'Depleted' : item.quantity <= item.minStockLevel ? 'Critical' : 'Operational'}
                      </span>
                    </div>
                  </td>
                  <td className="px-10 py-8 text-center">
                    <div className="flex flex-col items-center">
                      <span className="text-base font-black text-white">{item.quantity}</span>
                      <div className="h-1 w-24 bg-zinc-900 rounded-full mt-2 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-1000 ${
                            item.quantity === 0 ? 'bg-rose-600' : item.quantity <= item.minStockLevel ? 'bg-amber-600' : 'bg-[#D4AF37]'
                          }`}
                          style={{ width: `${Math.min((item.quantity / (item.minStockLevel * 2.5 + 1)) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-8">
                    <span className="font-black text-[#D4AF37] text-xl tracking-tighter">${item.price.toLocaleString(undefined, { minimumFractionDigits: 1 })}</span>
                  </td>
                  <td className="px-10 py-8 text-right">
                    <div className="flex items-center justify-end space-x-4">
                      <button onClick={() => onEditItem(item)} className="p-3 text-zinc-500 hover:text-[#D4AF37] transition-all rounded-xl active:scale-90"><Edit2 size={16} /></button>
                      <button onClick={() => onDeleteItem(item.id)} className="p-3 text-zinc-500 hover:text-rose-500 transition-all rounded-xl active:scale-90"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="py-48 flex flex-col items-center text-center">
            <SearchX size={80} className="text-zinc-800 mb-8" />
            <h3 className="text-3xl font-black text-white uppercase tracking-tighter">Null Result</h3>
            <button onClick={onClearSearch} className="mt-8 px-10 py-4 bg-zinc-900 border border-zinc-800 text-[#D4AF37] rounded-2xl font-black text-[10px] uppercase tracking-widest">Clear Scan</button>
          </div>
        )}
      </div>
    </div>
  </div>
);
