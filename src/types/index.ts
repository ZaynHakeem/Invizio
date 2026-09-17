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

export type ViewType = "dashboard" | "inventory" | "alerts";

export type ItemInput = Pick<
  InventoryItem,
  "name" | "category" | "quantity" | "price" | "description" | "minStockLevel"
>;
export type StockStatus = "in" | "low" | "out";
export type FieldErrors = Partial<Record<keyof ItemInput, string>>;
