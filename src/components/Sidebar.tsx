import React from 'react';
import { LayoutDashboard, Package, AlertTriangle, X, Activity, SquareLibrary } from 'lucide-react';
import { ViewType } from '../types';

interface SidebarProps {
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  totalValue: number;
  lowStockCount: number;
  onReset: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  setActiveView,
  isSidebarOpen,
  setIsSidebarOpen,
  totalValue,
  lowStockCount,
  onReset
}) => {
  const NavItem = ({ view, icon: Icon, label, badge }: { view: ViewType, icon: any, label: string, badge?: number }) => (
    <button
      onClick={() => { setActiveView(view); setIsSidebarOpen(false); }}
      className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl transition-all duration-300 group active:scale-95 touch-manipulation ${
        activeView === view 
          ? 'bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-black shadow-lg' 
          : 'text-zinc-500 hover:text-white hover:bg-zinc-900/50'
      }`}
    >
      <div className="flex items-center space-x-4">
        <Icon size={18} className={activeView === view ? 'text-black' : 'group-hover:text-[#D4AF37] transition-colors'} />
        <span className="font-bold tracking-widest text-[11px] uppercase">{label}</span>
      </div>
      {badge ? (
        <span className={`px-2 py-0.5 text-[9px] font-black rounded-lg ${
          activeView === view ? 'bg-black text-[#D4AF37]' : 'bg-red-500/10 text-red-500 border border-red-500/20'
        }`}>
          {badge}
        </span>
      ) : null}
    </button>
  );

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={`fixed inset-0 bg-black/95 backdrop-blur-md z-[60] lg:hidden transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
        onClick={() => setIsSidebarOpen(false)} 
      />

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-[70] w-72 lg:w-80 bg-black border-r border-zinc-900/50 transform transition-transform duration-500 lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-full flex flex-col p-6 lg:p-8 bg-gradient-to-b from-black to-[#080808]">
          <div className="flex items-center justify-between mb-16 px-2">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-br from-[#D4AF37] to-[#B8860B] p-2.5 rounded-2xl">
                <SquareLibrary className="text-black" size={24} strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tighter uppercase leading-none">INVIZIO</h1>
                <p className="text-[9px] font-black text-zinc-600 tracking-[0.3em] uppercase mt-1">Local Ledger</p>
              </div>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 text-zinc-600 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>
          
          <nav className="flex-1 space-y-3">
            <NavItem view="dashboard" icon={LayoutDashboard} label="Overview" />
            <NavItem view="inventory" icon={Package} label="Ledger" />
            <NavItem view="alerts" icon={AlertTriangle} label="Status Alerts" badge={lowStockCount} />
          </nav>

          <div className="mt-auto space-y-4">
            {/* Valuation Card */}
            <div className="group">
              <div className="p-6 lg:p-8 bg-zinc-900/30 rounded-[2.5rem] border border-zinc-800/50 relative overflow-hidden transition-all hover:border-[#D4AF37]/30">
                <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-2">Vault Valuation</p>
                <p className="text-2xl lg:text-3xl font-black text-[#D4AF37] tracking-tighter truncate">${totalValue.toLocaleString()}</p>
                <div className="flex items-center mt-4 text-[9px] font-bold text-emerald-500 space-x-1">
                  <Activity size={12} />
                  <span>Live Update</span>
                </div>
              </div>
            </div>

            {/* Reset Button */}
            <button
              onClick={onReset}
              className="w-full px-6 py-4 bg-zinc-900/30 hover:bg-rose-500/10 border border-zinc-800/50 hover:border-rose-500/30 rounded-2xl transition-all group text-left"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-black text-zinc-600 group-hover:text-rose-500 uppercase tracking-widest transition-colors">Factory Reset</p>
                  <p className="text-[10px] font-bold text-zinc-700 group-hover:text-rose-400 mt-1 transition-colors">Restore Defaults</p>
                </div>
                <div className="w-8 h-8 bg-zinc-900/50 group-hover:bg-rose-500/20 rounded-lg flex items-center justify-center transition-all">
                  <X size={14} className="text-zinc-600 group-hover:text-rose-500 transition-colors" />
                </div>
              </div>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
