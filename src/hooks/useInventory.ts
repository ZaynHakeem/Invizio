import { useState, useEffect, useCallback } from 'react';
import type { InventoryItem } from '../types';

/** API base URL. Set VITE_API_URL in production (e.g. Vercel env) to your deployed API. */
const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export function useInventory(): {
  items: InventoryItem[];
  loading: boolean;
  resetToDefaults: () => Promise<void>;
  createItem: (partial: { name: string; category: string; quantity: number; price: number; minStockLevel: number; description?: string }) => Promise<void>;
  updateItem: (id: string, partial: { name: string; category: string; quantity: number; price: number; minStockLevel: number; description?: string }) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
} {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = useCallback(async () => {
    const res = await fetch(`${API_BASE}/api/items`);
    if (!res.ok) throw new Error('Failed to fetch items');
    const data = await res.json();
    setItems(Array.isArray(data) ? data : []);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const start = Date.now();
    fetchItems()
      .then(() => {
        if (cancelled) return;
        const elapsed = Date.now() - start;
        const delay = Math.max(0, 800 - elapsed);
        setTimeout(() => setLoading(false), delay);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [fetchItems]);

  const createItem = useCallback(async (partial: { name: string; category: string; quantity: number; price: number; minStockLevel: number; description?: string }) => {
    const res = await fetch(`${API_BASE}/api/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(partial),
    });
    if (!res.ok) throw new Error('Failed to create item');
    await fetchItems();
  }, [fetchItems]);

  const updateItem = useCallback(async (id: string, partial: { name: string; category: string; quantity: number; price: number; minStockLevel: number; description?: string }) => {
    const res = await fetch(`${API_BASE}/api/items/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(partial),
    });
    if (!res.ok) throw new Error('Failed to update item');
    await fetchItems();
  }, [fetchItems]);

  const deleteItem = useCallback(async (id: string) => {
    const res = await fetch(`${API_BASE}/api/items/${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete item');
    await fetchItems();
  }, [fetchItems]);

  const resetToDefaults = useCallback(async () => {
    if (!confirm('⚠️ Reset vault to factory defaults? All custom data will be permanently erased.')) return;
    const res = await fetch(`${API_BASE}/api/items/seed`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to reset');
    await fetchItems();
  }, [fetchItems]);

  return { items, loading, resetToDefaults, createItem, updateItem, deleteItem };
}
