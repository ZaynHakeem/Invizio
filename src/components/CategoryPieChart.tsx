import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Activity } from 'lucide-react';
import { COLORS } from '../constants';
import type { InventoryStats } from '../utils/inventoryUtils';

export interface CategoryPieChartProps {
  stats: InventoryStats;
  pieActiveIndex: number | undefined;
  onPieActiveIndexChange: (index: number | undefined) => void;
}

export const CategoryPieChart: React.FC<CategoryPieChartProps> = ({
  stats,
  pieActiveIndex,
  onPieActiveIndexChange,
}) => (
  <div className="lg:col-span-7 bg-zinc-900/10 p-8 lg:p-12 rounded-[3rem] lg:rounded-[4rem] border border-zinc-800/50 shadow-2xl overflow-hidden group">
    <div className="flex items-center justify-between mb-10">
      <div>
        <h3 className="text-[10px] lg:text-xs font-black text-white flex items-center space-x-4 uppercase tracking-[0.3em]">
          <div className="w-2 h-2 bg-[#D4AF37] rounded-full animate-pulse" />
          <span>Executive Donut</span>
        </h3>
        <p className="text-[9px] text-zinc-600 font-bold mt-2 uppercase tracking-widest leading-none">Asset Distribution</p>
      </div>
      <div className="flex items-center space-x-2 bg-black/50 px-3 py-1.5 rounded-full border border-zinc-800/50">
        <Activity size={12} className="text-[#D4AF37]" />
        <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Live Valuation</span>
      </div>
    </div>

    <div className="flex flex-col md:flex-row items-center gap-12">
      <div className="h-[300px] lg:h-[350px] w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={stats.categoryData}
              cx="50%"
              cy="50%"
              innerRadius={85}
              outerRadius={115}
              paddingAngle={3}
              dataKey="value"
              cornerRadius={6}
              stroke="none"
              minAngle={5}
              onMouseEnter={(_, index) => onPieActiveIndexChange(index)}
              onMouseLeave={() => onPieActiveIndexChange(undefined)}
            >
              {stats.categoryData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
          {pieActiveIndex !== undefined ? (
            <div className="animate-in fade-in zoom-in-90 duration-300">
              <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">
                {stats.categoryData[pieActiveIndex].name}
              </p>
              <p className="text-xl lg:text-2xl font-black text-white tracking-tighter">
                ${stats.categoryData[pieActiveIndex].value.toLocaleString()}
              </p>
              <p className="text-[10px] font-black text-[#D4AF37] mt-1">
                {((stats.categoryData[pieActiveIndex].value / (stats.totalValue || 1)) * 100).toFixed(1)}%
              </p>
            </div>
          ) : (
            <div className="animate-in fade-in zoom-in-95 duration-500">
              <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">Total Assets</p>
              <p className="text-2xl lg:text-3xl font-black text-[#D4AF37] tracking-tighter">
                ${stats.totalValue.toLocaleString()}
              </p>
              <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mt-2">{stats.totalItems} Records</p>
            </div>
          )}
        </div>
      </div>

      <div className="w-full space-y-2 lg:space-y-3 max-h-[300px] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-zinc-800">
        {stats.categoryData.map((entry, index) => {
          const pct = ((entry.value / (stats.totalValue || 1)) * 100).toFixed(1);
          const isActive = pieActiveIndex === index;
          return (
            <div
              key={entry.name}
              onMouseEnter={() => onPieActiveIndexChange(index)}
              onMouseLeave={() => onPieActiveIndexChange(undefined)}
              className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#D4AF37]/10 border-[#D4AF37]/50 shadow-[0_10px_20px_rgba(212,175,55,0.1)]'
                  : 'bg-black/20 border-zinc-800/30 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center space-x-4">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                <span className={`text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-white' : 'text-zinc-500'}`}>
                  {entry.name}
                </span>
              </div>
              <div className="text-right">
                <span className={`block text-[11px] font-black tracking-tight ${isActive ? 'text-[#D4AF37]' : 'text-white'}`}>
                  {pct}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  </div>
);
