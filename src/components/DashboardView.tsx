import React from 'react';
import { Layers, DollarSign, AlertTriangle, Package } from 'lucide-react';
import { StatsCard } from './StatsCard';
import { CategoryPieChart } from './CategoryPieChart';
import { TopItemsBarChart } from './TopItemsBarChart';
import type { ViewType } from '../types';
import type { InventoryStats } from '../utils/inventoryUtils';

export interface DashboardViewProps {
  stats: InventoryStats;
  onSelectView: (view: ViewType) => void;
  pieActiveIndex: number | undefined;
  onPieActiveIndexChange: (index: number | undefined) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  onSelectView,
  pieActiveIndex,
  onPieActiveIndexChange,
}) => (
  <div className="space-y-12 lg:space-y-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
      <StatsCard
        label="Entities"
        val={stats.totalItems}
        icon={Layers}
        color="text-[#D4AF37]"
        bg="bg-[#D4AF37]/5"
        onClick={() => onSelectView('inventory')}
      />
      <StatsCard
        label="Market Value"
        val={`$${stats.totalValue.toLocaleString()}`}
        icon={DollarSign}
        color="text-[#D4AF37]"
        bg="bg-[#D4AF37]/5"
        onClick={() => onSelectView('inventory')}
      />
      <StatsCard
        label="Low Stock"
        val={stats.lowStockCount}
        icon={AlertTriangle}
        color="text-amber-500"
        bg="bg-amber-500/5"
        onClick={() => onSelectView('alerts')}
      />
      <StatsCard
        label="Deficits"
        val={stats.outOfStockCount}
        icon={Package}
        color="text-rose-500"
        bg="bg-rose-500/5"
        onClick={() => onSelectView('alerts')}
      />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
      <CategoryPieChart
        stats={stats}
        pieActiveIndex={pieActiveIndex}
        onPieActiveIndexChange={onPieActiveIndexChange}
      />
      <TopItemsBarChart stats={stats} />
    </div>
  </div>
);
