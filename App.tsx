
import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  AlertTriangle, 
  Plus, 
  Search, 
  Menu, 
  X,
  TrendingUp,
  DollarSign,
  Layers,
  Trash2,
  Edit2
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { InventoryItem, ViewType, DashboardStats } from './types';

// Initial Mock Data
const INITIAL_DATA: InventoryItem[] = [
  { id: '1', name: 'Premium Coffee Beans', category: 'Groceries', quantity: 45, price: 18.50, description: 'Dark roast arabica beans', minStockLevel: 10, updatedAt: new Date().toISOString() },
  { id: '2', name: 'Almond Milk (1L)', category: 'Groceries', quantity: 8, price: 4.20, description: 'Unsweetened dairy-free milk', minStockLevel: 12, updatedAt: new Date().toISOString() },
  { id: '3', name: 'Paper Towels (6pk)', category: 'Essentials', quantity: 25, price: 12.99, description: 'Ultra absorbent 2-ply', minStockLevel: 5, updatedAt: new Date().toISOString() },
  { id: '4', name: 'Dish Soap', category: 'Essentials', quantity: 3, price: 3.50, description: 'Grease-cutting formula', minStockLevel: 5, updatedAt: new Date().toISOString() },
  { id: '5', name: 'Eco Batteries AA', category: 'Electronics', quantity: 150, price: 0.85, description: 'Rechargeable AA batteries', minStockLevel: 20, updatedAt: new Date().toISOString() },
  { id: '6', name: 'LED Bulbs', category: 'Electronics', quantity: 0, price: 5.00, description: '60W equivalent warm white', minStockLevel: 10, updatedAt: new Date().toISOString() },
];

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

const App: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>(() => {
    const saved = localStorage.getItem('stockmaster_items');
    return saved ? JSON.parse(saved) : INITIAL_DATA;
  });
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('stockmaster_items', JSON.stringify(items));
  }, [items]);

  const stats: DashboardStats = useMemo(() => {
    return {
      totalItems: items.length,
      totalValue: items.reduce((acc, item) => acc + (item.price * item.quantity), 0),
      lowStockCount: items.filter(i => i.quantity > 0 && i.quantity <= i.minStockLevel).length,
      outOfStockCount: items.filter(i => i.quantity === 0).length,
    };
  }, [items]);

  const chartData = useMemo(() => {
    const categories: Record<string, number> = {};
    items.forEach(item => {
      categories[item.category] = (categories[item.category] || 0) + 1;
    });
    return Object.entries(categories).map(([name, value]) => ({ name, value }));
  }, [items]);

  const valueData = useMemo(() => {
    return items.slice(0, 5).sort((a, b) => (b.price * b.quantity) - (a.price * a.quantity)).map(i => ({
      name: i.name,
      value: i.price * i.quantity
    }));
  }, [items]);

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStockItems = items.filter(i => i.quantity <= i.minStockLevel);

  const handleSaveItem = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newItem: InventoryItem = {
      id: editingItem?.id || Math.random().toString(36).substr(2, 9),
      name: formData.get('name') as string,
      category: formData.get('category') as string,
      quantity: Number(formData.get('quantity')),
      price: Number(formData.get('price')),
      minStockLevel: Number(formData.get('minStockLevel')),
      description: formData.get('description') as string,
      updatedAt: new Date().toISOString(),
    };

    if (editingItem) {
      setItems(items.map(i => i.id === editingItem.id ? newItem : i));
    } else {
      setItems([...items, newItem]);
    }
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const deleteItem = (id: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      setItems(items.filter(i => i.id !== id));
    }
  };

  const NavItem = ({ view, icon: Icon, label, badge }: { view: ViewType, icon: any, label: string, badge?: number }) => (
    <button
      onClick={() => { setActiveView(view); setIsSidebarOpen(false); }}
      className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
        activeView === view ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
      }`}
    >
      <div className="flex items-center space-x-3">
        <Icon size={20} />
        <span className="font-medium">{label}</span>
      </div>
      {badge ? (
        <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
          activeView === view ? 'bg-white text-blue-600' : 'bg-red-100 text-red-600'
        }`}>
          {badge}
        </span>
      ) : null}
    </button>
  );

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar - Desktop */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-full flex flex-col p-6">
          <div className="flex items-center space-x-3 mb-10 px-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Package className="text-white" size={24} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900">StockMaster<span className="text-blue-600">Pro</span></h1>
          </div>
          
          <nav className="flex-1 space-y-2">
            <NavItem view="dashboard" icon={LayoutDashboard} label="Dashboard" />
            <NavItem view="inventory" icon={Package} label="Inventory" />
            <NavItem view="alerts" icon={AlertTriangle} label="Low Stock" badge={stats.lowStockCount} />
          </nav>

          <div className="mt-auto pt-6 border-t border-gray-100">
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Total Value</p>
              <p className="text-lg font-bold text-gray-900">${stats.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 transition-all duration-300">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-4 lg:px-8">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
            >
              <Menu size={24} />
            </button>
            
            <div className="flex-1 max-w-xl mx-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Search inventory..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <button 
              onClick={() => { setEditingItem(null); setIsModalOpen(true); }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center space-x-2 font-medium transition-all shadow-sm active:scale-95"
            >
              <Plus size={20} />
              <span className="hidden sm:inline">Add Item</span>
            </button>
          </div>
        </header>

        <div className="p-4 lg:p-8 max-w-7xl mx-auto">
          {activeView === 'dashboard' && (
            <div className="space-y-8">
              {/* Stat Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Total Items', val: stats.totalItems, icon: Layers, color: 'blue' },
                  { label: 'Inventory Value', val: `$${stats.totalValue.toLocaleString()}`, icon: DollarSign, color: 'emerald' },
                  { label: 'Low Stock', val: stats.lowStockCount, icon: AlertTriangle, color: 'amber' },
                  { label: 'Out of Stock', val: stats.outOfStockCount, icon: Package, color: 'rose' }
                ].map((stat, idx) => (
                  <div key={idx} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">{stat.label}</p>
                      <h3 className="text-2xl font-bold text-gray-900">{stat.val}</h3>
                    </div>
                    <div className={`p-3 bg-${stat.color}-50 text-${stat.color}-600 rounded-xl`}>
                      <stat.icon size={24} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Category Distribution</h3>
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Top Value Items</h3>
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={valueData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" width={100} fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip />
                        <Bar dataKey="value" fill="#3B82F6" radius={[0, 4, 4, 0]} barSize={20} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Recent Activity / Low Stock Table */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Critical Alerts</h3>
                  <button onClick={() => setActiveView('alerts')} className="text-blue-600 text-sm font-medium hover:underline">View All</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-500 text-xs font-semibold uppercase tracking-wider">
                      <tr>
                        <th className="px-6 py-3">Item</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3">Stock</th>
                        <th className="px-6 py-3">Threshold</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {lowStockItems.slice(0, 5).map(item => (
                        <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 font-medium text-gray-900">{item.name}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                              item.quantity === 0 ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
                            }`}>
                              {item.quantity === 0 ? 'Out of Stock' : 'Low Stock'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-600">{item.quantity}</td>
                          <td className="px-6 py-4 text-gray-600">{item.minStockLevel}</td>
                        </tr>
                      ))}
                      {lowStockItems.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-6 py-10 text-center text-gray-400">All items are sufficiently stocked.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeView === 'inventory' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-2xl font-bold text-gray-900">Inventory Items</h2>
                <div className="text-sm text-gray-500">Showing {filteredItems.length} items</div>
              </div>
              
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-500 text-xs font-semibold uppercase tracking-wider">
                      <tr>
                        <th className="px-6 py-4">Product Name</th>
                        <th className="px-6 py-4">Category</th>
                        <th className="px-6 py-4 text-center">Stock Level</th>
                        <th className="px-6 py-4">Price</th>
                        <th className="px-6 py-4">Total Value</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredItems.map(item => (
                        <tr key={item.id} className="hover:bg-gray-50 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="font-semibold text-gray-900">{item.name}</span>
                              <span className="text-xs text-gray-400 truncate max-w-[150px]">{item.description}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="bg-blue-50 text-blue-600 px-2.5 py-1 rounded-lg text-xs font-medium">
                              {item.category}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col items-center">
                              <span className={`text-sm font-bold ${
                                item.quantity <= item.minStockLevel ? 'text-red-500' : 'text-gray-900'
                              }`}>
                                {item.quantity}
                              </span>
                              <div className="w-16 h-1.5 bg-gray-100 rounded-full mt-1.5 overflow-hidden">
                                <div 
                                  className={`h-full rounded-full ${
                                    item.quantity === 0 ? 'bg-red-500 w-0' :
                                    item.quantity <= item.minStockLevel ? 'bg-amber-500' : 'bg-blue-500'
                                  }`}
                                  style={{ width: `${Math.min((item.quantity / (item.minStockLevel * 2)) * 100, 100)}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">${item.price.toFixed(2)}</td>
                          <td className="px-6 py-4 text-sm font-semibold text-gray-900">${(item.price * item.quantity).toFixed(2)}</td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => { setEditingItem(item); setIsModalOpen(true); }}
                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              >
                                <Edit2 size={18} />
                              </button>
                              <button 
                                onClick={() => deleteItem(item.id)}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredItems.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-6 py-20 text-center text-gray-400">
                            No items found matching your search.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeView === 'alerts' && (
            <div className="space-y-6">
               <div className="flex items-center space-x-3 mb-6">
                <div className="p-3 bg-red-100 text-red-600 rounded-2xl">
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Critical Stock Alerts</h2>
                  <p className="text-gray-500">Items below or at minimum stock levels</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {lowStockItems.map(item => (
                  <div key={item.id} className="bg-white p-6 rounded-2xl border-2 border-amber-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4">
                       <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                          item.quantity === 0 ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
                        }`}>
                          {item.quantity === 0 ? 'Out of Stock' : 'Low Stock'}
                        </span>
                    </div>
                    <h4 className="text-lg font-bold text-gray-900 mb-1">{item.name}</h4>
                    <p className="text-sm text-gray-500 mb-4">{item.category}</p>
                    
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Current Stock</p>
                        <p className={`text-3xl font-black ${item.quantity === 0 ? 'text-red-600' : 'text-amber-600'}`}>{item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Threshold</p>
                        <p className="text-lg font-bold text-gray-600">{item.minStockLevel}</p>
                      </div>
                    </div>

                    <div className="mt-6 flex space-x-3">
                       <button 
                        onClick={() => { setEditingItem(item); setIsModalOpen(true); }}
                        className="flex-1 bg-gray-900 text-white py-2 rounded-xl text-sm font-semibold hover:bg-gray-800 transition-colors"
                       >
                        Replenish
                       </button>
                    </div>
                  </div>
                ))}
                {lowStockItems.length === 0 && (
                  <div className="col-span-full py-20 bg-emerald-50 rounded-3xl border-2 border-emerald-100 text-center">
                    <Package className="mx-auto text-emerald-400 mb-4" size={48} />
                    <h3 className="text-xl font-bold text-emerald-800">All Stocks Healthy</h3>
                    <p className="text-emerald-600">No items currently require attention.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modal - Add/Edit Item */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">{editingItem ? 'Edit Item' : 'Add New Item'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSaveItem} className="p-8 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Item Name</label>
                  <input required name="name" defaultValue={editingItem?.name} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="e.g. Wireless Mouse" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
                    <input required name="category" defaultValue={editingItem?.category} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="e.g. Electronics" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Price ($)</label>
                    <input required name="price" type="number" step="0.01" defaultValue={editingItem?.price} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="0.00" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Stock Quantity</label>
                    <input required name="quantity" type="number" defaultValue={editingItem?.quantity} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="0" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Alert Threshold</label>
                    <input required name="minStockLevel" type="number" defaultValue={editingItem?.minStockLevel} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="5" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                  <textarea name="description" defaultValue={editingItem?.description} rows={3} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none" placeholder="Brief item details..."></textarea>
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 font-semibold rounded-xl hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 shadow-sm shadow-blue-200 transition-all active:scale-95">
                  {editingItem ? 'Save Changes' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sidebar Overlay - Mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-900/40 backdrop-blur-sm lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default App;
