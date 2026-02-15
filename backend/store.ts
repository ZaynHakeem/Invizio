
import { InventoryItem } from '../frontend/types';

const STORAGE_KEY = 'stockmaster_v2_db';

const INITIAL_DATA: InventoryItem[] = [
  { id: '1', sku: 'COF-001', name: 'Premium Coffee Beans', category: 'Groceries', quantity: 45, price: 18.50, description: 'Dark roast arabica beans', minStockLevel: 10, updatedAt: new Date().toISOString() },
  { id: '2', sku: 'MLK-002', name: 'Almond Milk (1L)', category: 'Groceries', quantity: 8, price: 4.20, description: 'Unsweetened dairy-free milk', minStockLevel: 12, updatedAt: new Date().toISOString() },
  { id: '6', sku: 'LED-006', name: 'LED Bulbs', category: 'Electronics', quantity: 0, price: 5.00, description: '60W equivalent warm white', minStockLevel: 10, updatedAt: new Date().toISOString() },
];

export const db = {
  getItems: (): InventoryItem[] => {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : INITIAL_DATA;
  },
  saveItems: (items: InventoryItem[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }
};
