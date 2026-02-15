
import { backendHandlers } from '../backend/api-handlers';
import { InventoryItem, DashboardStats, ApiResponse } from './types';

/**
 * In a real-world scenario, these would be fetch() calls to a REST/GraphQL API.
 * Here we abstract the backend handlers to simulate a full-stack boundary.
 */
export const api = {
  getInventory: () => backendHandlers.fetchAllItems(),
  getStats: () => backendHandlers.getDashboardStats(),
  upsertItem: (item: Partial<InventoryItem>) => backendHandlers.saveItem(item),
  deleteItem: (id: string) => backendHandlers.deleteItem(id)
};
