import { useState, useEffect } from 'react';
import type { InventoryItem } from '../types';
import { STORAGE_KEY, INITIAL_DATA } from '../constants';

export function useInventory(): {
  items: InventoryItem[];
  setItems: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  loading: boolean;
  resetToDefaults: () => void;
} {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

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

  const resetToDefaults = () => {
    if (confirm('⚠️ Reset vault to factory defaults? All custom data will be permanently erased.')) {
      localStorage.removeItem(STORAGE_KEY);
      setItems(INITIAL_DATA);
    }
  };

  return { items, setItems, loading, resetToDefaults };
}
