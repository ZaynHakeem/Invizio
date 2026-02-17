import React, { useState } from 'react';
import { Layers, DollarSign, AlertTriangle, Package, ArrowUpRight, TrendingUp, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { DashboardStats, ViewType } from '../types';
import { GOLD, COLORS } from '../constants';

interface DashboardProps {
  stats: DashboardStats;
  setActiveView: (view: ViewType) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ stats, setActiveView }) => {
  const [pieActiveIndex, setPieActiveIndex] = useState<number | undefined>(undefined);

  return (
    <div className="space-y-12 lg:space-y-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {[
          { label: 'Entities', val: stats.totalItems, icon: Layers, color: 'text-[#D4AF37]', bg: 'bg-[#D4AF37]/5', action: () => setActiveView('inventory') },
          { label: 'Market Value', val: `$${stats.totalValue.toLocaleString()}`, icon: DollarSign, color: 'text-[#D4AF37]', bg: 'bg-[#D4AF37]/5', action: () => setActiveView('inventory') },
          { label: 'Low Stock', val: stats.lowStockCount, icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/5', action: () => setActiveView('alerts') },
          { label: 'Deficits', val: stats.outOfStockCount, icon: Package, color: 'text-rose-500', bg: 'bg-rose-500/5', action: () => setActiveView('alerts') }
        ].map((stat, idx) => (
          <button 
            key={idx} 
            onClick={stat.action}
            className="bg-zinc-900/20 text-left p-6 lg:p-8 rounded-[2.5rem] border border-zinc-800/50 hover:border-[#D4AF37]/60 transition-all group shadow-xl active:scale-[0.98]"
          >
            <div className="flex items-center justify-between mb-6 lg:mb-8">
              <div className={`p-3 lg:p-4 ${stat.bg} ${stat.color} rounded-2xl`}>
                <stat.icon size={26} strokeWidth={1.5} />
              </div>
              <ArrowUpRight size={14} className="text-zinc-700 group-hover:text-[#D4AF37]" />
            </div>
            <p className="text-[8px] lg:text-[10px] font-black text-zinc-500 uppercase tracking-[0.25em]">{stat.label}</p>
            <h3 className="text-lg lg:text-2xl xl:text-3xl font-black text-white mt-1 lg:mt-2 tracking-tighter truncate">{stat.val}</h3>
          </button>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
        {/* Pie Chart */}
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
                    onMouseEnter={(_, index) => setPieActiveIndex(index)}
                    onMouseLeave={() => setPieActiveIndex(undefined)}
                  >
                    {stats.categoryData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              
              {/* Center Text UI */}
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
                    onMouseEnter={() => setPieActiveIndex(index)}
                    onMouseLeave={() => setPieActiveIndex(undefined)}
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

        {/* Bar Chart */}
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
      </div>
    </div>
  );
};
