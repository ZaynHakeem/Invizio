
import { db } from './store';
import { InventoryItem, DashboardStats, ApiResponse } from '../frontend/types';

// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const backendHandlers = {
  async fetchAllItems(): Promise<ApiResponse<InventoryItem[]>> {
    await delay(400);
    return { status: 'success', data: db.getItems() };
  },

  async saveItem(item: Partial<InventoryItem>): Promise<ApiResponse<InventoryItem>> {
    await delay(600);
    const items = db.getItems();
    
    // Server-side validation
    if (!item.name || item.price! < 0 || item.quantity! < 0) {
      return { status: 'error', error: 'Invalid item data provided.' };
    }

    let savedItem: InventoryItem;

    if (item.id) {
      const index = items.findIndex(i => i.id === item.id);
      if (index === -1) return { status: 'error', error: 'Item not found.' };
      savedItem = { ...items[index], ...item, updatedAt: new Date().toISOString() } as InventoryItem;
      items[index] = savedItem;
    } else {
      savedItem = {
        ...item,
        id: Math.random().toString(36).substr(2, 9),
        sku: `${item.category?.substring(0, 3).toUpperCase() || 'GEN'}-${Math.floor(100 + Math.random() * 900)}`,
        updatedAt: new Date().toISOString()
      } as InventoryItem;
      items.push(savedItem);
    }

    db.saveItems(items);
    return { status: 'success', data: savedItem };
  },

  async deleteItem(id: string): Promise<ApiResponse<void>> {
    await delay(500);
    const items = db.getItems().filter(i => i.id !== id);
    db.saveItems(items);
    return { status: 'success' };
  },

  async getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
    await delay(300);
    const items = db.getItems();
    
    const categories: Record<string, number> = {};
    items.forEach(i => categories[i.category] = (categories[i.category] || 0) + 1);

    return {
      status: 'success',
      data: {
        totalItems: items.length,
        totalValue: items.reduce((acc, i) => acc + (i.price * i.quantity), 0),
        lowStockCount: items.filter(i => i.quantity > 0 && i.quantity <= i.minStockLevel).length,
        outOfStockCount: items.filter(i => i.quantity === 0).length,
        categoryData: Object.entries(categories).map(([name, value]) => ({ name, value })),
        topItems: items.slice(0, 5).sort((a, b) => (b.price * b.quantity) - (a.price * a.quantity)).map(i => ({
          name: i.name,
          value: i.price * i.quantity
        }))
      }
    };
  }
};
