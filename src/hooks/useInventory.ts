import { useState, useEffect, useCallback } from 'react';
import type { InventoryItem } from '../types';

/** API base URL. Set VITE_API_URL in production (e.g. Vercel env) to your deployed API. */
const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export function useInventory(): {
  items: InventoryItem[];
  loading: boolean;
  error: string | null;
  clearError: () => void;
  resetToDefaults: () => Promise<void>;
  createItem: (partial: { name: string; category: string; quantity: number; price: number; minStockLevel: number; description?: string }) => Promise<void>;
  updateItem: (id: string, partial: { name: string; category: string; quantity: number; price: number; minStockLevel: number; description?: string }) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
} {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const fetchItems = useCallback(async () => {
    setError(null);
    const res = await fetch(`${API_BASE}/api/items`);
    if (!res.ok) throw new Error('Failed to load items. Please check your connection and try again.');
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
      .catch((err) => {
        if (!cancelled) {
          setLoading(false);
          setError(err instanceof Error ? err.message : 'Failed to load items.');
        }
      });
    return () => { cancelled = true; };
  }, [fetchItems]);

  const createItem = useCallback(async (partial: { name: string; category: string; quantity: number; price: number; minStockLevel: number; description?: string }) => {
    setError(null);
    const res = await fetch(`${API_BASE}/api/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(partial),
    });
    if (!res.ok) throw new Error('Failed to create item. Please try again.');
    await fetchItems();
  }, [fetchItems]);

  const updateItem = useCallback(async (id: string, partial: { name: string; category: string; quantity: number; price: number; minStockLevel: number; description?: string }) => {
    setError(null);
    const res = await fetch(`${API_BASE}/api/items/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(partial),
    });
    if (!res.ok) throw new Error('Failed to update item. Please try again.');
    await fetchItems();
  }, [fetchItems]);

  const deleteItem = useCallback(async (id: string) => {
    setError(null);
    const res = await fetch(`${API_BASE}/api/items/${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete item. Please try again.');
    await fetchItems();
  }, [fetchItems]);

  const resetToDefaults = useCallback(async () => {
    if (!confirm('⚠️ Reset vault to factory defaults? All custom data will be permanently erased.')) return;
    setError(null);
    const res = await fetch(`${API_BASE}/api/items/seed`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to reset. Please try again.');
    await fetchItems();
  }, [fetchItems]);

  return { items, loading, error, clearError, resetToDefaults, createItem, updateItem, deleteItem };
}
