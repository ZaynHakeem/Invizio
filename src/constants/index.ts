import type { InventoryItem } from '../types';

export const STORAGE_KEY = 'invizio_vault_data_v2';
export const GOLD = '#D4AF37';
export const COLORS = [
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

export const INITIAL_DATA: InventoryItem[] = [
  { id: '1', sku: 'IV-772', name: 'Wireless Mouse', category: 'Electronics', quantity: 12, price: 45.00, description: 'Ergonomic 2.4GHz wireless mouse with precision optical tracking', minStockLevel: 5, updatedAt: new Date().toISOString() },
  { id: '2', sku: 'IV-104', name: 'Pasta', category: 'Groceries', quantity: 84, price: 2.99, description: 'Premium Italian durum wheat pasta, 500g package', minStockLevel: 20, updatedAt: new Date().toISOString() },
  { id: '3', sku: 'IV-909', name: 'Trash Bags', category: 'Home & Kitchen', quantity: 3, price: 12.50, description: 'Heavy-duty tear-resistant garbage bags, 50-count box', minStockLevel: 5, updatedAt: new Date().toISOString() },
  { id: '4', sku: 'IV-002', name: 'Denim Jeans', category: 'Clothing', quantity: 0, price: 85.00, description: 'Classic fit blue denim jeans, size 32x32', minStockLevel: 10, updatedAt: new Date().toISOString() },
];
