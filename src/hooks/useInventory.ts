import { useState, useEffect, useMemo } from 'react';
import { InventoryItem, DashboardStats } from '../types';
import { STORAGE_KEY, INITIAL_DATA } from '../constants';

export const useInventory = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setItems(JSON.parse(saved));
    } else {
      setItems(INITIAL_DATA);
    }
    setTimeout(() => setLoading(false), 800);
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (!loading) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }
  }, [items, loading]);

  // Derived state - categories
  const existingCategories = useMemo(() => 
    Array.from(new Set(items.map(i => i.category))).sort()
  , [items]);

  // Derived state - stats
  const stats: DashboardStats = useMemo(() => {
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
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value);
    
    const topItems = [...items]
      .sort((a, b) => (b.price * b.quantity) - (a.price * a.quantity))
      .slice(0, 5)
      .map(i => ({ name: i.name, value: i.price * i.quantity }));

    return { totalItems, totalValue, lowStockCount, outOfStockCount, categoryData, topItems };
  }, [items]);

  // Actions
  const addItem = (item: InventoryItem) => {
    setItems(prev => [...prev, item]);
  };

  const updateItem = (id: string, updates: Partial<InventoryItem>) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...updates, updatedAt: new Date().toISOString() } : i));
  };

  const deleteItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const resetToDefaults = () => {
    localStorage.removeItem(STORAGE_KEY);
    setItems(INITIAL_DATA);
  };

  return {
    items,
    loading,
    stats,
    existingCategories,
    addItem,
    updateItem,
    deleteItem,
    resetToDefaults
  };
};
