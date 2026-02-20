import React from 'react';
import { LayoutDashboard, Package, AlertTriangle, X, SquareLibrary, Activity } from 'lucide-react';
import { NavItem } from './NavItem';
import type { ViewType } from '../types';

export interface SidebarProps {
  activeView: ViewType;
  onSelectView: (view: ViewType) => void;
  onCloseSidebar: () => void;
  totalValue: number;
  lowStockCount: number;
  onResetToDefaults: () => void | Promise<void>;
  isResetting?: boolean;
  isSidebarOpen: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onSelectView,
  onCloseSidebar,
  totalValue,
  lowStockCount,
  onResetToDefaults,
  isResetting = false,
  isSidebarOpen,
}) => (
  <>
    <div
      className={`fixed inset-0 bg-black/95 backdrop-blur-md z-[60] lg:hidden transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      onClick={onCloseSidebar}
    />
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
          <button onClick={onCloseSidebar} className="lg:hidden p-2 text-zinc-600 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-3">
          <NavItem view="dashboard" icon={LayoutDashboard} label="Overview" activeView={activeView} onSelect={onSelectView} />
          <NavItem view="inventory" icon={Package} label="Ledger" activeView={activeView} onSelect={onSelectView} />
          <NavItem view="alerts" icon={AlertTriangle} label="Status Alerts" badge={lowStockCount} activeView={activeView} onSelect={onSelectView} />
        </nav>

        <div className="mt-auto space-y-4">
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

          <button
            type="button"
            onClick={onResetToDefaults}
            disabled={isResetting}
            className="w-full px-6 py-4 bg-zinc-900/30 hover:bg-rose-500/10 border border-zinc-800/50 hover:border-rose-500/30 rounded-2xl transition-all group text-left disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:bg-zinc-900/30 disabled:hover:border-zinc-800/50"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] font-black text-zinc-600 group-hover:text-rose-500 uppercase tracking-widest transition-colors">
                  {isResetting ? 'Resetting...' : 'Factory Reset'}
                </p>
                <p className="text-[10px] font-bold text-zinc-700 group-hover:text-rose-400 mt-1 transition-colors">
                  {isResetting ? 'Please wait' : 'Restore Defaults'}
                </p>
              </div>
              <div className="w-8 h-8 bg-zinc-900/50 group-hover:bg-rose-500/20 rounded-lg flex items-center justify-center transition-all shrink-0">
                {isResetting ? (
                  <span className="w-4 h-4 border-2 border-zinc-600 border-t-rose-500 rounded-full animate-spin" />
                ) : (
                  <X size={14} className="text-zinc-600 group-hover:text-rose-500 transition-colors" />
                )}
              </div>
            </div>
          </button>
        </div>
      </div>
    </aside>
  </>
);
