import type { InventoryItem } from '../types';

export interface InventoryStats {
  totalItems: number;
  totalValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  categoryData: { name: string; value: number }[];
  topItems: { name: string; value: number }[];
}

export function computeInventoryStats(items: InventoryItem[]): InventoryStats {
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
}

export function filterItemsBySearch(items: InventoryItem[], searchTerm: string): InventoryItem[] {
  const term = searchTerm.toLowerCase();
  return items.filter(item =>
    item.name.toLowerCase().includes(term) ||
    item.category.toLowerCase().includes(term) ||
    item.sku.toLowerCase().includes(term)
  );
}

export function createNewInventoryItem(partial: {
  name: string;
  category: string;
  quantity: number;
  price: number;
  minStockLevel: number;
}): InventoryItem {
  return {
    id: Math.random().toString(36).substr(2, 9),
    sku: `IV-${Math.floor(100 + Math.random() * 899)}`,
    name: partial.name,
    category: partial.category,
    quantity: partial.quantity,
    price: partial.price,
    minStockLevel: partial.minStockLevel,
    description: '',
    updatedAt: new Date().toISOString(),
  };
}
