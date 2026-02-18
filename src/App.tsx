import React, { useState, useMemo, useRef } from 'react';
import type { InventoryItem, ViewType } from './types';
import { useInventory } from './hooks/useInventory';
import { useClickOutside } from './hooks/useClickOutside';
import { computeInventoryStats, filterItemsBySearch, createNewInventoryItem } from './utils/inventoryUtils';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { LoadingScreen } from './components/LoadingScreen';
import { DashboardView } from './components/DashboardView';
import { InventoryView } from './components/InventoryView';
import { AlertsView } from './components/AlertsView';
import { RegistryModal } from './components/RegistryModal';

const App: React.FC = () => {
  const { items, setItems, loading, resetToDefaults } = useInventory();

  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalCategory, setModalCategory] = useState('');
  const [isNewCategoryMode, setIsNewCategoryMode] = useState(false);
  const [pieActiveIndex, setPieActiveIndex] = useState<number | undefined>(undefined);

  const searchRef = useRef<HTMLDivElement>(null);
  useClickOutside(searchRef, () => setShowSuggestions(false));

  const existingCategories = useMemo(
    () => Array.from(new Set(items.map(i => i.category))).sort(),
    [items]
  );

  const stats = useMemo(() => computeInventoryStats(items), [items]);
  const filteredItems = useMemo(() => filterItemsBySearch(items, searchTerm), [items, searchTerm]);
  const lowStockItems = useMemo(
    () => filteredItems.filter(i => i.quantity <= i.minStockLevel),
    [filteredItems]
  );

  const openModal = (item: InventoryItem | null = null) => {
    setEditingItem(item);
    setModalCategory(item ? item.category : '');
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
      setItems(prev =>
        prev.map(i =>
          i.id === editingItem.id
            ? { ...i, name, category, quantity, price, minStockLevel, updatedAt: new Date().toISOString() }
            : i
        )
      );
    } else {
      const newItem = createNewInventoryItem({ name, category, quantity, price, minStockLevel });
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

  const handleSuggestionClick = (id: string) => {
    const item = items.find(i => i.id === id);
    if (item) {
      setSearchTerm(item.name);
      setActiveView('inventory');
      setShowSuggestions(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-black font-sans text-white selection:bg-[#D4AF37] selection:text-black overflow-x-hidden">
      <Sidebar
        activeView={activeView}
        onSelectView={(view) => {
          setActiveView(view);
          setIsSidebarOpen(false);
        }}
        onCloseSidebar={() => setIsSidebarOpen(false)}
        totalValue={stats.totalValue}
        lowStockCount={stats.lowStockCount}
        onResetToDefaults={resetToDefaults}
        isSidebarOpen={isSidebarOpen}
      />

      <main className="flex-1 lg:ml-80 transition-all duration-500 min-h-screen flex flex-col relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-[#D4AF37]/[0.03] blur-[150px] rounded-full pointer-events-none" />

        <Header
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          showSuggestions={showSuggestions}
          onFocusSearch={() => setShowSuggestions(true)}
          searchRef={searchRef}
          filteredItems={filteredItems}
          onSuggestionClick={handleSuggestionClick}
          onOpenRegister={() => openModal()}
          onOpenSidebar={() => setIsSidebarOpen(true)}
        />

        <div className="p-4 lg:p-12 max-w-7xl mx-auto w-full flex-1">
          {loading ? (
            <LoadingScreen />
          ) : (
            <>
              {activeView === 'dashboard' && (
                <DashboardView
                  stats={stats}
                  onSelectView={setActiveView}
                  pieActiveIndex={pieActiveIndex}
                  onPieActiveIndexChange={setPieActiveIndex}
                />
              )}
              {activeView === 'inventory' && (
                <InventoryView
                  filteredItems={filteredItems}
                  onEditItem={openModal}
                  onDeleteItem={handleDelete}
                  onClearSearch={() => setSearchTerm('')}
                />
              )}
              {activeView === 'alerts' && (
                <AlertsView lowStockItems={lowStockItems} onRestock={openModal} />
              )}
            </>
          )}
        </div>
      </main>

      <RegistryModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        editingItem={editingItem}
        modalCategory={modalCategory}
        isNewCategoryMode={isNewCategoryMode}
        existingCategories={existingCategories}
        onCategoryChange={setModalCategory}
        onNewCategoryModeChange={setIsNewCategoryMode}
        onSave={handleSaveItem}
      />
    </div>
  );
};

export default App;
