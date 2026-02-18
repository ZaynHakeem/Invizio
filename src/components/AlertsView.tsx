import React from 'react';
import { Box } from 'lucide-react';
import { AlertCard } from './AlertCard';
import type { InventoryItem } from '../types';

export interface AlertsViewProps {
  lowStockItems: InventoryItem[];
  onRestock: (item: InventoryItem) => void;
}

export const AlertsView: React.FC<AlertsViewProps> = ({ lowStockItems, onRestock }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in slide-in-from-bottom-6 duration-700">
    {lowStockItems.map(item => (
      <AlertCard key={item.id} item={item} onRestock={onRestock} />
    ))}
    {lowStockItems.length === 0 && (
      <div className="col-span-full py-48 flex flex-col items-center justify-center bg-emerald-500/[0.01] rounded-[4rem] border border-emerald-500/10 text-center">
        <Box size={80} className="text-emerald-500/20 mb-10" />
        <h3 className="text-3xl font-black text-white uppercase tracking-tighter">System Equilibrium</h3>
        <p className="text-emerald-500/50 font-black uppercase tracking-[0.3em] text-[10px] mt-6">All Sector Volumes are Optimal</p>
      </div>
    )}
  </div>
);
