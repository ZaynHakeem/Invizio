
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
  DollarSign,
  Layers,
  ArrowUpRight,
  Box,
  SearchX,
  TrendingUp,
  ShieldCheck,
  SquareLibrary,
  ChevronDown,
  PlusCircle,
  PieChart as PieIcon,
  Activity
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, Sector 
} from 'recharts';

// --- Types ---
export interface InventoryItem {
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

export type ViewType = 'dashboard' | 'inventory' | 'alerts';

// --- Constants ---
const STORAGE_KEY = 'invizio_vault_data_v2';
const GOLD = '#D4AF37';
const COLORS = [
  '#D4AF37', // Gold
  '#F5E1A4', // Gold Light
  '#8B7355', // Muted Bronze
  '#C5A028', // Deep Gold
  '#E5C76B', // Soft Brass
  '#A67C00', // Dark Gold
  '#CD853F', // Peru
  '#DAA520', // Goldenrod
  '#B8956A', // Tan
  '#C9AE5D', // Vegas Gold
  '#F0E68C', // Khaki
  '#BDB76B', // Dark Khaki
];

const INITIAL_DATA: InventoryItem[] = [
  { id: '1', sku: 'IV-772', name: 'Wireless Mouse', category: 'Electronics', quantity: 12, price: 45.00, description: 'Ergonomic 2.4GHz wireless mouse with precision optical tracking', minStockLevel: 5, updatedAt: new Date().toISOString() },
  { id: '2', sku: 'IV-104', name: 'Pasta', category: 'Groceries', quantity: 84, price: 2.99, description: 'Premium Italian durum wheat pasta, 500g package', minStockLevel: 20, updatedAt: new Date().toISOString() },
  { id: '3', sku: 'IV-909', name: 'Trash Bags', category: 'Home & Kitchen', quantity: 3, price: 12.50, description: 'Heavy-duty tear-resistant garbage bags, 50-count box', minStockLevel: 5, updatedAt: new Date().toISOString() },
  { id: '4', sku: 'IV-002', name: 'Denim Jeans', category: 'Clothing', quantity: 0, price: 85.00, description: 'Classic fit blue denim jeans, size 32x32', minStockLevel: 10, updatedAt: new Date().toISOString() },
];

const App: React.FC = () => {
  // --- State ---
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
  const [pieActiveIndex, setPieActiveIndex] = useState<number | undefined>(undefined);
  
  const searchRef = useRef<HTMLDivElement>(null);

  // --- Persistence ---
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setItems(JSON.parse(saved));
    } else {
      setItems(INITIAL_DATA);
    }
    setTimeout(() => setLoading(false), 800);
  }, []);

  useEffect(() => {
    if (!loading) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }
  }, [items, loading]);

  // Click outside to close search suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // --- Derived State ---
  const existingCategories = useMemo(() => 
    Array.from(new Set(items.map(i => i.category))).sort()
  , [items]);

  const stats = useMemo(() => {
    const totalItems = items.length;
    const totalValue = items.reduce((acc, i) => acc + (i.price * i.quantity), 0);
    const lowStockCount = items.filter(i => i.quantity > 0 && i.quantity <= i.minStockLevel).length;
    const outOfStockCount = items.filter(i => i.quantity === 0).length;
    
    const categoryValues: Record<string, number> = {};
    items.forEach(i => {
      const val = i.price * i.quantity;
      categoryValues[i.category] = (categoryValues[i.category] || 0) + val;
    });
    
    const categoryData = Object.entries(categoryValues)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
    
    const topItems = [...items]
      .sort((a, b) => (b.price * b.quantity) - (a.price * a.quantity))
      .slice(0, 5)
      .map(i => ({ name: i.name, value: i.price * i.quantity }));

    return { totalItems, totalValue, lowStockCount, outOfStockCount, categoryData, topItems };
  }, [items]);

  const filteredItems = useMemo(() => 
    items.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase())
    ), [items, searchTerm]);

  // --- Handlers ---
  const openModal = (item: InventoryItem | null = null) => {
    setEditingItem(item);
    if (item) {
      setModalCategory(item.category);
    } else {
      setModalCategory('');
    }
    setIsNewCategoryMode(false);
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
      setItems(prev => prev.map(i => i.id === editingItem.id ? {
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
      setItems(prev => [...prev, newItem]);
    }

    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('Permanently wipe this record from the local vault?')) {
      setItems(prev => prev.filter(i => i.id !== id));
    }
  };

  const resetToDefaults = () => {
    if (confirm('⚠️ Reset vault to factory defaults? All custom data will be permanently erased.')) {
      localStorage.removeItem(STORAGE_KEY);
      setItems(INITIAL_DATA);
    }
  };

  const handleSuggestionClick = (id: string) => {
    const item = items.find(i => i.id === id);
    if (item) {
      setSearchTerm(item.name);
      setActiveView('inventory');
      setShowSuggestions(false);
    }
  };

  // --- Custom Recharts Shapes ---
  const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, value } = props;
    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 8}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          cornerRadius={14}
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 12}
          outerRadius={outerRadius + 15}
          fill={fill}
          cornerRadius={4}
        />
      </g>
    );
  };

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
    <div className="min-h-screen flex bg-black font-sans text-white selection:bg-[#D4AF37] selection:text-black overflow-x-hidden">
      {/* Mobile Sidebar Overlay */}
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
            <NavItem view="alerts" icon={AlertTriangle} label="Status Alerts" badge={stats.lowStockCount} />
          </nav>

          <div className="mt-auto space-y-4">
            {/* Valuation Card */}
            <div className="group">
              <div className="p-6 lg:p-8 bg-zinc-900/30 rounded-[2.5rem] border border-zinc-800/50 relative overflow-hidden transition-all hover:border-[#D4AF37]/30">
                <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-2">Vault Valuation</p>
                <p className="text-2xl lg:text-3xl font-black text-[#D4AF37] tracking-tighter truncate">${stats.totalValue.toLocaleString()}</p>
                <div className="flex items-center mt-4 text-[9px] font-bold text-emerald-500 space-x-1">
                  <Activity size={12} />
                  <span>Live Update</span>
                </div>
              </div>
            </div>

            {/* Reset Button */}
            <button
              onClick={resetToDefaults}
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

      {/* Main Content */}
      <main className="flex-1 lg:ml-80 transition-all duration-500 min-h-screen flex flex-col relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-[#D4AF37]/[0.03] blur-[150px] rounded-full pointer-events-none" />

        <header className="sticky top-0 z-50 bg-black/60 backdrop-blur-2xl border-b border-zinc-900/50 px-4 py-4 lg:px-12 lg:py-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 lg:gap-8">
            <button 
              onClick={() => setIsSidebarOpen(true)} 
              className="lg:hidden p-2.5 bg-zinc-900/50 rounded-xl text-[#D4AF37] border border-zinc-800"
            >
              <Menu size={20} />
            </button>
            
            <div className="flex-1 max-w-2xl relative" ref={searchRef}>
              <div className="relative group">
                <Search className={`absolute left-4 lg:left-5 top-1/2 -translate-y-1/2 transition-all duration-300 ${searchTerm ? 'text-[#D4AF37]' : 'text-zinc-600'}`} size={18} />
                <input 
                  type="text" 
                  placeholder="Scan records..."
                  value={searchTerm}
                  onFocus={() => setShowSuggestions(true)}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setShowSuggestions(true);
                  }}
                  className="w-full pl-10 pr-4 py-3 lg:pl-14 lg:pr-12 lg:py-4 bg-zinc-900/30 border border-zinc-800/50 rounded-xl lg:rounded-[1.5rem] focus:bg-black focus:border-[#D4AF37]/40 outline-none font-bold text-xs lg:text-sm text-white transition-all shadow-inner"
                />
              </div>

              {/* Search Suggestions Dropdown */}
              {showSuggestions && searchTerm.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-[#0A0A0A] border border-zinc-800 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden z-[100] animate-in slide-in-from-top-2 duration-200">
                  <div className="max-h-[400px] overflow-y-auto p-2">
                    {filteredItems.length > 0 ? (
                      filteredItems.slice(0, 8).map(item => (
                        <button
                          key={item.id}
                          onClick={() => handleSuggestionClick(item.id)}
                          className="w-full flex items-center justify-between p-4 hover:bg-zinc-900/50 rounded-2xl transition-all group text-left"
                        >
                          <div className="flex items-center space-x-4">
                            <div className={`w-2 h-2 rounded-full ${item.quantity === 0 ? 'bg-rose-500' : item.quantity <= item.minStockLevel ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                            <div>
                              <p className="text-xs font-black text-white group-hover:text-[#D4AF37] transition-colors uppercase">{item.name}</p>
                              <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest">{item.sku} • {item.category}</p>
                            </div>
                          </div>
                          <ChevronRight size={14} className="text-zinc-800 group-hover:text-[#D4AF37] transition-colors" />
                        </button>
                      ))
                    ) : (
                      <div className="p-8 text-center">
                        <SearchX size={32} className="mx-auto text-zinc-800 mb-3" />
                        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">No vault records match your scan</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <button 
              onClick={() => openModal()}
              className="bg-gradient-to-br from-[#D4AF37] to-[#B8860B] text-black p-3 lg:px-7 lg:py-4 rounded-xl lg:rounded-2xl flex items-center justify-center lg:space-x-3 font-black transition-all active:scale-95 shadow-lg"
            >
              <Plus size={20} strokeWidth={3} />
              <span className="hidden sm:inline uppercase text-[10px] tracking-widest">Register</span>
            </button>
          </div>
        </header>

        <div className="p-4 lg:p-12 max-w-7xl mx-auto w-full flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-48">
              <div className="w-16 h-16 border-4 border-[#D4AF37]/10 border-t-[#D4AF37] rounded-full animate-spin" />
              <p className="text-zinc-600 font-black uppercase tracking-[0.4em] text-[10px] mt-10">Decrypting Ledger...</p>
            </div>
          ) : (
            <>
              {activeView === 'dashboard' && (
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
                              {/* Fix: Removed non-existent activeIndex and activeShape properties to satisfy TypeScript error in root App.tsx */}
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
              )}

              {activeView === 'inventory' && (
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
                                    <button onClick={() => openModal(item)} className="p-3 text-zinc-500 hover:text-[#D4AF37] transition-all rounded-xl active:scale-90"><Edit2 size={16} /></button>
                                    <button onClick={() => handleDelete(item.id)} className="p-3 text-zinc-500 hover:text-rose-500 transition-all rounded-xl active:scale-90"><Trash2 size={16} /></button>
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
                          <button onClick={() => setSearchTerm('')} className="mt-8 px-10 py-4 bg-zinc-900 border border-zinc-800 text-[#D4AF37] rounded-2xl font-black text-[10px] uppercase tracking-widest">Clear Scan</button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeView === 'alerts' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in slide-in-from-bottom-6 duration-700">
                  {filteredItems.filter(i => i.quantity <= i.minStockLevel).map(item => (
                    <div key={item.id} className="bg-zinc-900/20 p-10 rounded-[3rem] border border-amber-500/10 flex flex-col justify-between group relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/[0.03] blur-3xl rounded-full -mr-16 -mt-16" />
                      <div>
                        <div className="flex items-center justify-between mb-10">
                           <span className="text-[9px] font-black text-amber-500 bg-amber-500/10 px-4 py-2 rounded-xl uppercase tracking-widest border border-amber-500/20">Depletion Risk</span>
                           <AlertTriangle size={24} className="text-amber-500 animate-pulse" />
                        </div>
                        <h4 className="text-2xl font-black text-white mb-2 tracking-tighter uppercase">{item.name}</h4>
                        <p className="text-[9px] text-zinc-600 font-black uppercase tracking-[0.2em] mb-12">{item.sku} • {item.category}</p>
                        
                        <div className="flex justify-between items-center p-6 bg-black/50 rounded-[2rem] border border-zinc-800 mb-10">
                          <span className="text-zinc-600 font-black uppercase tracking-widest text-[9px]">Live Volume</span>
                          <span className={`font-black text-3xl tracking-tighter ${item.quantity === 0 ? 'text-rose-500' : 'text-amber-500'}`}>{item.quantity}</span>
                        </div>
                      </div>
                      <button onClick={() => openModal(item)} className="w-full bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-black py-5 rounded-3xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center space-x-2 shadow-xl">
                        <span>Restock Protocol</span>
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  ))}
                  {filteredItems.filter(i => i.quantity <= i.minStockLevel).length === 0 && (
                    <div className="col-span-full py-48 flex flex-col items-center justify-center bg-emerald-500/[0.01] rounded-[4rem] border border-emerald-500/10 text-center">
                       <Box size={80} className="text-emerald-500/20 mb-10" />
                       <h3 className="text-3xl font-black text-white uppercase tracking-tighter">System Equilibrium</h3>
                       <p className="text-emerald-500/50 font-black uppercase tracking-[0.3em] text-[10px] mt-6">All Sector Volumes are Optimal</p>
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
          <div className="relative bg-[#0A0A0A] w-full max-w-2xl rounded-t-[2.5rem] sm:rounded-[4rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-500 border border-zinc-800/50 max-h-[90vh] flex flex-col">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#D4AF37] to-[#B8860B]" />
            <div className="px-8 py-8 sm:px-12 sm:py-10 border-b border-zinc-900/50 flex items-center justify-between">
              <div>
                <h3 className="text-2xl lg:text-3xl font-black text-white leading-none uppercase tracking-tighter">{editingItem ? 'Update Protocol' : 'New Entry'}</h3>
                <p className="text-zinc-600 text-[9px] font-black uppercase tracking-[0.3em] mt-3">Registry Module</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-3 bg-zinc-900 rounded-xl text-zinc-600 hover:text-white transition-all"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSaveItem} className="p-8 sm:p-12 overflow-y-auto space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                <div className="col-span-full">
                  <label className="text-[9px] font-black text-zinc-700 uppercase tracking-widest ml-4 mb-3 block">Entity Name</label>
                  <input required name="name" defaultValue={editingItem?.name} className="w-full px-6 py-4 bg-zinc-900/40 border border-zinc-800/50 rounded-2xl focus:bg-black focus:border-[#D4AF37]/40 outline-none transition-all font-black text-white text-lg tracking-tight" placeholder="ID-ALPHA ENTITY" />
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
                      <button type="button" onClick={() => setIsNewCategoryMode(false)} className="p-3 text-zinc-600 hover:text-white transition-colors"><X size={18} /></button>
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
              <button type="submit" className="w-full py-6 bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-black font-black rounded-[2rem] shadow-xl transition-all active:scale-95 text-[10px] uppercase tracking-widest mt-6">
                {editingItem ? 'Confirm Updates' : 'Authorize Entry'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
