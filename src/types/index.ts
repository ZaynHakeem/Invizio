export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  quantity: number;
  price: number;
  description: string;
  minStockLevel: number;
  updatedAt: string;
}

export type ViewType = 'dashboard' | 'inventory' | 'alerts';

export interface DashboardStats {
  totalItems: number;
  totalValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  categoryData: { name: string; value: number }[];
  topItems: { name: string; value: number }[];
}
