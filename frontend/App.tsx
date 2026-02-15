
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  AlertTriangle, 
  Plus, 
  Search, 
  Menu, 
  X,
  Trash2,
  Edit2,
  ChevronRight,
  Loader2,
  DollarSign,
  Layers,
  ArrowUpRight,
  Box,
  SearchX,
  Command,
  TrendingUp,
  History,
  ShieldCheck,
  ChevronDown,
  PlusCircle,
  PieChart as PieIcon,
  Activity
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';

// --- Types ---
interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  quantity: number;
  price: number;
  description: string;
  minStockLevel: number;
  updatedAt: string;
}

type ViewType = 'dashboard' | 'inventory' | 'alerts';

// --- Theme Config ---
const GOLD = '#D4AF37';
const GOLD_LIGHT = '#F5E1A4';
const GOLD_DARK = '#B8860B';
const COLORS = [
  '#D4AF37', // Gold
  '#F5E1A4', // Gold Light
  '#8B7355', // Muted Bronze
  '#C5A028', // Deep Gold
  '#E5C76B', // Soft Brass
  '#A67C00', // Dark Gold
];

const STORAGE_KEY = 'invizio_vault_data';

const INITIAL_DATA: InventoryItem[] = [
  { id: '1', sku: 'IV-772', name: 'Titanium Core Server', category: 'Infrastructure', quantity: 12, price: 4500, description: 'High-availability core processing unit', minStockLevel: 5, updatedAt: new Date().toISOString() },
  { id: '2', sku: 'IV-104', name: 'Neural Link Module', category: 'Interfaces', quantity: 84, price: 299, description: 'Low-latency neural interface', minStockLevel: 20, updatedAt: new Date().toISOString() },
  { id: '3', sku: 'IV-909', name: 'Quantum Storage Array', category: 'Storage', quantity: 3, price: 12500, description: 'Petabyte-scale quantum persistence', minStockLevel: 5, updatedAt: new Date().toISOString() },
  { id: '4', sku: 'IV-002', name: 'Biometric Scanner', category: 'Security', quantity: 0, price: 850, description: 'Iris and vein authentication hardware', minStockLevel: 10, updatedAt: new Date().toISOString() },
];

const App: React.FC = () => {
  // --- Local State ---
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [modalCategory, setModalCategory] = useState('');
  const [isNewCategoryMode, setIsNewCategoryMode] = useState(false);
  
  const searchRef = useRef<HTMLDivElement>(null);

  // --- Persistence Logic ---
  useEffect(() => {
    const loadData = () => {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setItems(JSON.parse(saved));
      } else {
        setItems(INITIAL_DATA);
      }
      setTimeout(() => setLoading(false), 800);
    };
    loadData();
  }, []);

  useEffect(() => {
    if (!loading) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }
  }, [items, loading]);

  const existingCategories = useMemo(() => Array.from(new Set(items.map(i => i.category))).sort(), [items]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredItems = useMemo(() => 
    items.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase())
    ), [items, searchTerm]);

  const stats = useMemo(() => {
    const totalItems = items.length;
    const totalValue = items.reduce((acc, i) => acc + (i.price * i.quantity), 0);
    const lowStockCount = items.filter(i => i.quantity > 0 && i.quantity <= i.minStockLevel).length;
    const outOfStockCount = items.filter(i => i.quantity === 0).length;
    
    const categories: Record<string, number> = {};
    items.forEach(i => {
      const val = i.price * i.quantity;
      categories[i.category] = (categories[i.category] || 0) + val;
    });
    
    const categoryData = Object.entries(categories)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
    
    const topItems = [...items]
      .sort((a, b) => (b.price * b.quantity) - (a.price * a.quantity))
      .slice(0, 5)
      .map(i => ({ name: i.name, value: i.price * i.quantity }));

    return { totalItems, totalValue, lowStockCount, outOfStockCount, categoryData, topItems };
  }, [items]);

  const openModal = (item: InventoryItem | null = null) => {
    setEditingItem(item);
    if (item) {
      setModalCategory(item.category);
      setIsNewCategoryMode(false);
    } else {
      setModalCategory('');
      setIsNewCategoryMode(false);
    }
    setIsModalOpen(true);
  };

  const handleSaveItem = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const category = isNewCategoryMode ? (formData.get('newCategory') as string) : modalCategory;
    const quantity = Number(formData.get('quantity'));
    const price = Number(formData.get('price'));
    const minStockLevel = Number(formData.get('minStockLevel'));

    if (editingItem) {
      setItems(items.map(i => i.id === editingItem.id ? {
        ...i,
        name,
        category,
        quantity,
        price,
        minStockLevel,
        updatedAt: new Date().toISOString()
      } : i));
    } else {
      const newItem: InventoryItem = {
        id: Math.random().toString(36).substr(2, 9),
        sku: `IV-${Math.floor(100 + Math.random() * 899)}`,
        name,
        category,
        quantity,
        price,
        minStockLevel,
        description: '',
        updatedAt: new Date().toISOString(),
      };
      setItems([...items, newItem]);
    }

    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('Permanently wipe this record from the local vault?')) {
      setItems(items.filter(i => i.id !== id));
    }
  };

  const NavItem = ({ view, icon: Icon, label, badge }: { view: ViewType, icon: any, label: string, badge?: number }) => (
    <button
      onClick={() => { setActiveView(view); setIsSidebarOpen(false); }}
      className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl transition-all duration-300 group relative overflow-hidden active:scale-95 touch-manipulation ${
        activeView === view 
          ? 'bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-black shadow-[0_10px_30px_rgba(212,175,55,0.2)]' 
          : 'text-zinc-500 hover:text-white hover:bg-zinc-900/50'
      }`}
    >
      <div className="flex items-center space-x-4 relative z-10">
        <Icon size={18} className={activeView === view ? 'text-black' : 'group-hover:text-[#D4AF37] transition-colors'} />
        <span className="font-bold tracking-widest text-[11px] uppercase">{label}</span>
      </div>
      {badge ? (
        <span className={`px-2 py-0.5 text-[9px] font-black rounded-lg relative z-10 ${
          activeView === view ? 'bg-black text-[#D4AF37]' : 'bg-red-500/10 text-red-500 border border-red-500/20'
        }`}>
          {badge}
        </span>
      ) : null}
    </button>
  );

  const renderPieLabel = ({ percent }: any) => `${(percent * 100).toFixed(0)}%`;

  return (
    <div className="min-h-screen flex bg-black font-sans text-white selection:bg-[#D4AF37] selection:text-black overflow-x-hidden">
      {/* Sidebar Overlay */}
      <div 
        className={`fixed inset-0 bg-black/90 backdrop-blur-lg z-[60] lg:hidden transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
        onClick={() => setIsSidebarOpen(false)} 
      />

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-[70] w-72 lg:w-80 bg-black border-r border-zinc-900/50 transform transition-transform duration-500 ease-out lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-full flex flex-col p-6 lg:p-8 bg-gradient-to-b from-black via-[#050505] to-black">
          <div className="flex items-center justify-between mb-12 lg:mb-16 px-2">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-br from-[#D4AF37] via-[#F5E1A4] to-[#B8860B] p-2 rounded-xl lg:p-2.5 lg:rounded-2xl">
                {/* Fix: Removed invalid lg:size prop and set size to 24 */}
                <ShieldCheck className="text-black" size={24} strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="text-xl lg:text-2xl font-black tracking-tighter uppercase leading-none">INVIZIO</h1>
                <p className="text-[8px] lg:text-[9px] font-black text-zinc-600 tracking-[0.3em] uppercase mt-1">Encrypted Ledger</p>
              </div>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 text-zinc-600 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>
          
          <nav className="flex-1 space-y-2 lg:space-y-3">
            <NavItem view="dashboard" icon={LayoutDashboard} label="Vault Overview" />
            <NavItem view="inventory" icon={Package} label="Asset Ledger" />
            <NavItem view="alerts" icon={AlertTriangle} label="Status Alerts" badge={stats.lowStockCount} />
          </nav>

          <div className="mt-8 group">
            <div className="p-6 lg:p-8 bg-zinc-900/30 rounded-[2rem] lg:rounded-[2.5rem] border border-zinc-800/50 relative overflow-hidden transition-all hover:border-[#D4AF37]/30">
              <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1 lg:mb-2">Valuation</p>
              <p className="text-2xl lg:text-3xl font-black text-[#D4AF37] tracking-tighter truncate">${stats.totalValue.toLocaleString()}</p>
              <div className="flex items-center mt-3 lg:mt-4 text-[9px] font-bold text-emerald-500 space-x-1">
                <ArrowUpRight size={12} />
                <span>Encrypted Vault Active</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-80 transition-all duration-500 min-h-screen flex flex-col relative overflow-x-hidden">
        {/* Background Visual Effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] lg:w-[1000px] h-[400px] lg:h-[600px] bg-[#D4AF37]/[0.03] blur-[100px] lg:blur-[150px] rounded-full pointer-events-none" />

        <header className="sticky top-0 z-50 bg-black/60 backdrop-blur-2xl border-b border-zinc-900/50 px-4 py-4 lg:px-12 lg:py-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 lg:gap-8">
            <button 
              onClick={() => setIsSidebarOpen(true)} 
              className="lg:hidden p-2.5 bg-zinc-900/50 rounded-xl text-[#D4AF37] border border-zinc-800 active:scale-95 touch-manipulation"
            >
              <Menu size={20} />
            </button>
            
            <div className="flex-1 max-w-2xl relative" ref={searchRef}>
              <div className="relative group">
                {/* Fix: Removed invalid lg:size prop and set size to 18 */}
                <Search className={`absolute left-4 lg:left-5 top-1/2 -translate-y-1/2 transition-all duration-300 ${searchTerm ? 'text-[#D4AF37]' : 'text-zinc-600'}`} size={18} />
                <input 
                  type="text" 
                  placeholder="Scan records..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 lg:pl-14 lg:pr-12 lg:py-4 bg-zinc-900/30 border border-zinc-800/50 rounded-xl lg:rounded-[1.5rem] focus:bg-black focus:border-[#D4AF37]/40 outline-none font-bold text-xs lg:text-sm tracking-wide text-white placeholder-zinc-700 transition-all shadow-inner"
                />
              </div>
            </div>

            <button 
              onClick={() => openModal()}
              className="bg-gradient-to-br from-[#D4AF37] to-[#B8860B] text-black p-3 lg:px-7 lg:py-4 rounded-xl lg:rounded-2xl flex items-center justify-center lg:space-x-3 font-black transition-all active:scale-95 border border-[#F5E1A4]/40 touch-manipulation shadow-lg"
            >
              <Plus size={20} strokeWidth={3} />
              <span className="hidden sm:inline uppercase text-[10px] font-black tracking-widest">Register</span>
            </button>
          </div>
        </header>

        <div className="p-4 lg:p-12 max-w-7xl mx-auto w-full flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 lg:py-48">
              <div className="w-12 h-12 lg:w-16 lg:h-16 border-4 border-[#D4AF37]/10 border-t-[#D4AF37] rounded-full animate-spin" />
              <p className="text-zinc-600 font-black uppercase tracking-[0.4em] text-[10px] mt-8 animate-pulse text-center">Decrypting Ledger...</p>
            </div>
          ) : (
            <>
              {activeView === 'dashboard' && (
                <div className="space-y-12 lg:space-y-16 animate-in fade-in slide-in-from-bottom-6 duration-700">
                  {/* Top Stats Cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
                    {[
                      { label: 'Asset Count', val: stats.totalItems, icon: Layers, color: 'text-[#D4AF37]', bg: 'bg-[#D4AF37]/5', action: () => setActiveView('inventory') },
                      { label: 'Vault Value', val: `$${stats.totalValue.toLocaleString()}`, icon: DollarSign, color: 'text-[#D4AF37]', bg: 'bg-[#D4AF37]/5', action: () => setActiveView('inventory') },
                      { label: 'Low Stocks', val: stats.lowStockCount, icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/5', action: () => setActiveView('alerts') },
                      { label: 'Deficits', val: stats.outOfStockCount, icon: Package, color: 'text-rose-500', bg: 'bg-rose-500/5', action: () => setActiveView('alerts') }
                    ].map((stat, idx) => (
                      <button 
                        key={idx} 
                        onClick={stat.action}
                        className="bg-zinc-900/20 text-left backdrop-blur-sm p-5 lg:p-8 rounded-2xl lg:rounded-[3rem] border border-zinc-800/50 hover:border-[#D4AF37]/60 transition-all group shadow-xl active:scale-[0.98] touch-manipulation"
                      >
                        <div className="flex items-center justify-between mb-4 lg:mb-8">
                          <div className={`p-2.5 lg:p-4 ${stat.bg} ${stat.color} rounded-lg lg:rounded-2xl transition-all duration-500`}>
                            {/* Fix: Removed invalid lg:size prop and set size to 26 */}
                            <stat.icon size={26} strokeWidth={1.5} />
                          </div>
                          <ArrowUpRight size={14} className="text-zinc-700 group-hover:text-[#D4AF37] transition-colors" />
                        </div>
                        <p className="text-[8px] lg:text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] lg:tracking-[0.25em]">{stat.label}</p>
                        <h3 className="text-sm lg:text-3xl font-black text-white mt-1 lg:mt-2 tracking-tighter truncate">{stat.val}</h3>
                      </button>
                    ))}
                  </div>

                  {/* Charts Section */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10">
                    {/* Portfolio Mix Chart */}
                    <div className="lg:col-span-7 bg-zinc-900/10 backdrop-blur-sm p-6 lg:p-12 rounded-[2.5rem] lg:rounded-[4rem] border border-zinc-800/50 shadow-2xl">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 lg:mb-12 gap-4">
                        <div>
                          <h3 className="text-[10px] lg:text-xs font-black text-white flex items-center space-x-3 lg:space-x-4 uppercase tracking-[0.3em] mb-1">
                             <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 bg-[#D4AF37] rounded-full animate-pulse" />
                             <span>Allocation</span>
                          </h3>
                          <p className="text-[8px] lg:text-[9px] text-zinc-600 font-bold uppercase tracking-widest">Market Distribution</p>
                        </div>
                        <div className="hidden sm:flex items-center space-x-3 px-4 py-2 bg-black/40 rounded-xl border border-zinc-800">
                          <Activity size={12} className="text-[#D4AF37]" />
                          <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Live Scan</span>
                        </div>
                      </div>

                      <div className="flex flex-col md:flex-row gap-8 lg:gap-12 items-center">
                        <div className="h-[200px] lg:h-[300px] w-full relative">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              {/* Fix: Removed invalid lg:innerRadius and lg:outerRadius props */}
                              <Pie 
                                data={stats.categoryData} 
                                cx="50%" cy="50%" innerRadius={75} outerRadius={115} paddingAngle={8} dataKey="value"
                                cornerRadius={12} stroke="none" labelLine={false} label={renderPieLabel}
                              >
                                {stats.categoryData.map((_, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip 
                                contentStyle={{ backgroundColor: '#000', borderRadius: '16px', border: '1px solid #333' }}
                                itemStyle={{ color: '#D4AF37', fontWeight: 900, fontSize: '9px' }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            {/* Fix: Removed invalid lg:size prop and set size to 20 */}
                            <PieIcon size={20} className="text-[#D4AF37] mb-1" />
                            <span className="text-[8px] lg:text-[9px] font-black text-zinc-600 uppercase tracking-widest">Vault</span>
                          </div>
                        </div>

                        <div className="w-full space-y-2 max-h-[200px] overflow-y-auto lg:max-h-none scrollbar-hide">
                          {stats.categoryData.map((entry, index) => {
                            const percentage = ((entry.value / stats.totalValue) * 100).toFixed(0);
                            return (
                              <div key={entry.name} className="flex items-center justify-between p-3 lg:p-4 bg-black/40 rounded-2xl border border-zinc-800/30">
                                <div className="flex items-center space-x-3 lg:space-x-4">
                                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                  <div className="flex flex-col">
                                    <span className="text-[9px] lg:text-[10px] font-black uppercase text-white tracking-widest mb-0.5">{entry.name}</span>
                                    <span className="text-[8px] lg:text-[9px] font-bold text-zinc-600 uppercase tracking-widest">${entry.value.toLocaleString()}</span>
                                  </div>
                                </div>
                                <span className="text-[10px] lg:text-xs font-black text-[#D4AF37]">{percentage}%</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Valuation Hierarchy Chart */}
                    <div className="lg:col-span-5 bg-zinc-900/10 backdrop-blur-sm p-6 lg:p-12 rounded-[2.5rem] lg:rounded-[4rem] border border-zinc-800/50 shadow-2xl">
                      <div className="flex items-center justify-between mb-8 lg:mb-12">
                        <h3 className="text-[10px] lg:text-xs font-black text-white flex items-center space-x-3 lg:space-x-4 uppercase tracking-[0.3em]">
                           <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 bg-emerald-500 rounded-full" />
                           <span>Hierarchy</span>
                        </h3>
                        <TrendingUp size={16} className="text-zinc-700" />
                      </div>
                      <div className="h-[250px] lg:h-[360px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={stats.topItems} layout="vertical" margin={{ left: -10 }}>
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" width={80} fontSize={8} fontWeight={900} axisLine={false} tickLine={false} stroke="#555" />
                            <Tooltip cursor={{ fill: 'rgba(212,175,55,0.03)' }} contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '12px' }} />
                            <Bar dataKey="value" fill={GOLD} radius={[0, 10, 10, 0]} barSize={16} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeView === 'inventory' && (
                <div className="space-y-6 lg:space-y-8 animate-in fade-in duration-700">
                  <div className="flex flex-col gap-2 mb-4">
                    <h2 className="text-2xl lg:text-4xl font-black text-white tracking-tighter uppercase">Status Ledger</h2>
                    <p className="text-zinc-600 text-[9px] lg:text-[10px] font-black uppercase tracking-[0.3em]">Verified Offline Data • {filteredItems.length} Entities</p>
                  </div>

                  <div className="bg-zinc-900/10 backdrop-blur-md rounded-[1.5rem] lg:rounded-[3rem] border border-zinc-800/50 shadow-2xl overflow-hidden">
                    <div className="overflow-x-auto scrollbar-hide">
                      {filteredItems.length > 0 ? (
                        <table className="w-full text-left min-w-[600px]">
                          <thead className="bg-black/40 text-zinc-600 text-[8px] lg:text-[9px] font-black uppercase tracking-[0.3em]">
                            <tr>
                              <th className="px-6 lg:px-10 py-5 lg:py-6 border-b border-zinc-800/50">Asset</th>
                              <th className="px-6 lg:px-10 py-5 lg:py-6 border-b border-zinc-800/50 text-center">Status</th>
                              <th className="px-6 lg:px-10 py-5 lg:py-6 border-b border-zinc-800/50 text-center">Units</th>
                              <th className="px-6 lg:px-10 py-5 lg:py-6 border-b border-zinc-800/50 text-right">Value</th>
                              <th className="px-6 lg:px-10 py-5 lg:py-6 border-b border-zinc-800/50 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-900/30">
                            {filteredItems.map(item => (
                              <tr key={item.id} className="group hover:bg-[#D4AF37]/[0.02] transition-colors">
                                <td className="px-6 lg:px-10 py-6 lg:py-8">
                                  <div className="flex flex-col">
                                    <span className="text-[8px] lg:text-[10px] font-black text-[#D4AF37] mb-1">{item.sku}</span>
                                    <span className="font-black text-white text-sm lg:text-lg tracking-tight group-hover:text-[#D4AF37] transition-colors truncate max-w-[150px] lg:max-w-none">{item.name}</span>
                                    <span className="text-[8px] text-zinc-600 font-bold uppercase tracking-widest mt-1">{item.category}</span>
                                  </div>
                                </td>
                                <td className="px-6 lg:px-10 py-6 lg:py-8 text-center">
                                  <div className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-full border ${
                                    item.quantity === 0 ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                                    item.quantity <= item.minStockLevel ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                    'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                  }`}>
                                    <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                                    <span className="text-[8px] lg:text-[9px] font-black uppercase tracking-widest">
                                      {item.quantity === 0 ? 'Depleted' : item.quantity <= item.minStockLevel ? 'Risk' : 'OK'}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-6 lg:px-10 py-6 lg:py-8">
                                  <div className="flex flex-col items-center">
                                    <span className="text-xs lg:text-base font-black text-white">{item.quantity}</span>
                                    <div className="h-1 w-12 lg:w-20 bg-zinc-900 rounded-full mt-2 overflow-hidden">
                                      <div 
                                        className={`h-full transition-all duration-1000 ${
                                          item.quantity === 0 ? 'bg-rose-600' : 
                                          item.quantity <= item.minStockLevel ? 'bg-amber-600' : 'bg-[#D4AF37]'
                                        }`}
                                        style={{ width: `${Math.min((item.quantity / (item.minStockLevel * 2.5)) * 100, 100)}%` }}
                                      />
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 lg:px-10 py-6 lg:py-8 text-right">
                                  <span className="font-black text-[#D4AF37] text-xs lg:text-xl tracking-tighter">${item.price.toLocaleString(undefined, { minimumFractionDigits: 1 })}</span>
                                </td>
                                <td className="px-6 lg:px-10 py-6 lg:py-8 text-right">
                                  <div className="flex items-center justify-end space-x-2 lg:space-x-4">
                                    {/* Fix: Removed invalid lg:size prop and set size to 16 */}
                                    <button onClick={() => openModal(item)} className="p-2 lg:p-3 text-zinc-500 hover:text-[#D4AF37] transition-all active:scale-90"><Edit2 size={16} /></button>
                                    {/* Fix: Removed invalid lg:size prop and set size to 16 */}
                                    <button onClick={() => handleDelete(item.id)} className="p-2 lg:p-3 text-zinc-500 hover:text-rose-500 transition-all active:scale-90"><Trash2 size={16} /></button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <div className="py-32 flex flex-col items-center text-center px-6">
                          <SearchX size={60} className="text-zinc-800 mb-6" />
                          <h3 className="text-xl lg:text-2xl font-black text-white uppercase tracking-tighter">Null Result</h3>
                          <p className="text-zinc-600 font-bold text-[9px] uppercase tracking-widest mt-2">Check scan parameters</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeView === 'alerts' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-10 animate-in slide-in-from-bottom-6 duration-700">
                  {items.filter(i => i.quantity <= i.minStockLevel).map(item => (
                    <div key={item.id} className="bg-zinc-900/20 backdrop-blur-xl p-8 lg:p-12 rounded-[2rem] lg:rounded-[4rem] border border-amber-500/10 flex flex-col justify-between group relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/[0.03] blur-2xl rounded-full -mr-16 -mt-16" />
                      <div>
                        <div className="flex items-center justify-between mb-8 lg:mb-12">
                           <span className="text-[8px] font-black text-amber-500 bg-amber-500/10 px-4 py-2 rounded-xl uppercase tracking-widest border border-amber-500/20">Depletion</span>
                           <AlertTriangle size={24} className="text-amber-500 animate-pulse" />
                        </div>
                        <h4 className="text-xl lg:text-3xl font-black text-white mb-2 lg:mb-3 tracking-tighter uppercase">{item.name}</h4>
                        <p className="text-[9px] text-zinc-600 font-black uppercase tracking-[0.2em] mb-10">{item.sku} • {item.category}</p>
                        
                        <div className="flex justify-between items-center p-6 lg:p-8 bg-black/50 rounded-[1.5rem] lg:rounded-[2.5rem] border border-zinc-800 mb-10">
                          <span className="text-zinc-600 font-black uppercase tracking-widest text-[8px] lg:text-[9px]">Units</span>
                          <span className={`font-black text-2xl lg:text-4xl tracking-tighter ${item.quantity === 0 ? 'text-rose-500' : 'text-amber-500'}`}>{item.quantity}</span>
                        </div>
                      </div>
                      <button onClick={() => openModal(item)} className="w-full bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-black py-5 lg:py-6 rounded-2xl lg:rounded-[2.5rem] font-black text-[10px] uppercase tracking-[0.2em] transition-all active:scale-95 flex items-center justify-center space-x-2 shadow-xl">
                        <span>Restock Protocol</span>
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  ))}
                  {items.filter(i => i.quantity <= i.minStockLevel).length === 0 && (
                    <div className="col-span-full py-32 lg:py-56 flex flex-col items-center justify-center bg-emerald-500/[0.02] rounded-[2rem] lg:rounded-[5rem] border border-emerald-500/10 text-center">
                       {/* Fix: Removed invalid lg:size prop and set size to 80 */}
                       <Box size={80} className="text-emerald-500/20 mb-8 lg:mb-12" />
                       <h3 className="text-2xl lg:text-4xl font-black text-white uppercase tracking-tighter">Healthy Stasis</h3>
                       <p className="text-emerald-500/50 font-black uppercase tracking-[0.2em] lg:tracking-[0.4em] text-[8px] lg:text-[10px] mt-4 lg:mt-6">Asset Volumes Optimized</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Registry Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-xl animate-in fade-in duration-500" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-[#0A0A0A] w-full max-w-2xl rounded-t-[2.5rem] sm:rounded-[3rem] lg:rounded-[4rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-500 border border-zinc-800/50 max-h-[90vh] flex flex-col">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#D4AF37] via-[#F5E1A4] to-[#B8860B]" />
            <div className="px-8 py-6 sm:px-12 sm:py-10 border-b border-zinc-900/50 flex items-center justify-between bg-zinc-900/10">
              <div>
                <h3 className="text-xl lg:text-3xl font-black text-white leading-none uppercase tracking-tighter">{editingItem ? 'Edit Protocol' : 'New Entry'}</h3>
                <p className="text-zinc-600 text-[8px] lg:text-[9px] font-black uppercase tracking-[0.3em] mt-3">Registry Module</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-3 bg-zinc-900 rounded-xl text-zinc-600 hover:text-white transition-all active:scale-90"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSaveItem} className="p-8 sm:p-12 overflow-y-auto space-y-8 sm:space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                <div className="col-span-full">
                  <label className="text-[9px] font-black text-zinc-700 uppercase tracking-widest ml-4 mb-3 block">Asset Name</label>
                  <input required name="name" defaultValue={editingItem?.name} className="w-full px-6 py-4 bg-zinc-900/40 border border-zinc-800/50 rounded-2xl focus:bg-black focus:border-[#D4AF37]/40 outline-none transition-all font-black text-white text-base lg:text-lg tracking-tight" placeholder="ID-ALPHA PROTOCOL" />
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
                            setIsNewCategoryMode(true);
                            setModalCategory('');
                          } else {
                            setModalCategory(e.target.value);
                          }
                        }}
                        className="w-full px-6 py-4 bg-zinc-900/40 border border-zinc-800/50 rounded-2xl focus:bg-black focus:border-[#D4AF37]/40 outline-none transition-all font-black text-white appearance-none cursor-pointer text-xs uppercase tracking-widest"
                      >
                        <option value="" disabled className="bg-zinc-900">Select Classification</option>
                        {existingCategories.map(cat => (
                          <option key={cat} value={cat} className="bg-zinc-900">{cat}</option>
                        ))}
                        <option value="__NEW__" className="bg-zinc-900 text-[#D4AF37]">+ Add New...</option>
                      </select>
                      <ChevronDown size={16} className="absolute right-5 top-1/2 -translate-y-1/2 text-[#D4AF37] pointer-events-none" />
                    </div>
                  ) : (
                    <div className="flex items-center space-x-3 animate-in slide-in-from-right-4">
                      <div className="relative flex-1">
                        <input required name="newCategory" autoFocus className="w-full px-6 py-4 bg-zinc-900/40 border border-[#D4AF37]/40 rounded-2xl focus:bg-black focus:border-[#D4AF37] outline-none transition-all font-black text-white text-xs uppercase tracking-widest" placeholder="New sector name..." />
                        <PlusCircle size={16} className="absolute right-5 top-1/2 -translate-y-1/2 text-[#D4AF37]" />
                      </div>
                      <button type="button" onClick={() => setIsNewCategoryMode(false)} className="p-3 text-zinc-600 hover:text-white"><X size={18} /></button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-[9px] font-black text-zinc-700 uppercase tracking-widest ml-4 mb-3 block">Unit Value (USD)</label>
                  <input required name="price" type="number" step="0.01" defaultValue={editingItem?.price} className="w-full px-6 py-4 bg-zinc-900/40 border border-zinc-800/50 rounded-2xl focus:bg-black focus:border-[#D4AF37]/40 outline-none transition-all font-black text-white text-xs" placeholder="0.00" />
                </div>
                <div>
                  <label className="text-[9px] font-black text-zinc-700 uppercase tracking-widest ml-4 mb-3 block">Quantity</label>
                  <input required name="quantity" type="number" defaultValue={editingItem?.quantity} className="w-full px-6 py-4 bg-zinc-900/40 border border-zinc-800/50 rounded-2xl focus:bg-black focus:border-[#D4AF37]/40 outline-none transition-all font-black text-white text-xs" placeholder="0" />
                </div>
                <div className="col-span-full md:col-span-1">
                  <label className="text-[9px] font-black text-zinc-700 uppercase tracking-widest ml-4 mb-3 block">Threshold</label>
                  <input required name="minStockLevel" type="number" defaultValue={editingItem?.minStockLevel} className="w-full px-6 py-4 bg-zinc-900/40 border border-zinc-800/50 rounded-2xl focus:bg-black focus:border-[#D4AF37]/40 outline-none transition-all font-black text-white text-xs" placeholder="10" />
                </div>
              </div>
              <button type="submit" className="w-full py-5 lg:py-7 bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-black font-black rounded-2xl lg:rounded-[3rem] shadow-xl hover:shadow-[#D4AF37]/20 transition-all active:scale-95 text-[10px] lg:text-[11px] uppercase tracking-widest mb-4">
                {editingItem ? 'Update Registry' : 'Commit to Vault'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
