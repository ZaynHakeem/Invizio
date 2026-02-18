import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { GOLD } from '../constants';
import type { InventoryStats } from '../utils/inventoryUtils';

export interface TopItemsBarChartProps {
  stats: InventoryStats;
}

export const TopItemsBarChart: React.FC<TopItemsBarChartProps> = ({ stats }) => (
  <div className="lg:col-span-5 bg-zinc-900/10 p-8 lg:p-12 rounded-[3rem] lg:rounded-[4rem] border border-zinc-800/50 shadow-2xl">
    <div className="flex items-center justify-between mb-10">
      <h3 className="text-[10px] lg:text-xs font-black text-white flex items-center space-x-4 uppercase tracking-[0.3em]">
        <div className="w-2 h-2 bg-emerald-500 rounded-full" />
        <span>Asset Hierarchy</span>
      </h3>
      <TrendingUp size={16} className="text-zinc-700" />
    </div>
    <div className="h-[300px] lg:h-[350px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={stats.topItems} layout="vertical" margin={{ left: -10 }}>
          <XAxis type="number" hide />
          <YAxis dataKey="name" type="category" width={90} fontSize={8} fontWeight={900} axisLine={false} tickLine={false} stroke="#555" />
          <Tooltip cursor={{ fill: 'rgba(212,175,55,0.03)' }} contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '12px' }} />
          <Bar dataKey="value" fill={GOLD} radius={[0, 10, 10, 0]} barSize={16} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>
);
