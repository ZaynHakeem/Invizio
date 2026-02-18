export const INITIAL_DATA = [
  { id: '1', sku: 'IV-772', name: 'Wireless Mouse', category: 'Electronics', quantity: 12, price: 45.00, description: 'Ergonomic 2.4GHz wireless mouse with precision optical tracking', minStockLevel: 5, updatedAt: new Date().toISOString() },
  { id: '2', sku: 'IV-104', name: 'Pasta', category: 'Groceries', quantity: 84, price: 2.99, description: 'Premium Italian durum wheat pasta, 500g package', minStockLevel: 20, updatedAt: new Date().toISOString() },
  { id: '3', sku: 'IV-909', name: 'Trash Bags', category: 'Home & Kitchen', quantity: 3, price: 12.50, description: 'Heavy-duty tear-resistant garbage bags, 50-count box', minStockLevel: 5, updatedAt: new Date().toISOString() },
  { id: '4', sku: 'IV-002', name: 'Denim Jeans', category: 'Clothing', quantity: 0, price: 85.00, description: 'Classic fit blue denim jeans, size 32x32', minStockLevel: 10, updatedAt: new Date().toISOString() },
];

function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

function generateSku(): string {
  return `IV-${Math.floor(100 + Math.random() * 899)}`;
}

export function createNewItem(partial: {
  name: string;
  category: string;
  quantity: number;
  price: number;
  minStockLevel: number;
  description?: string;
}) {
  return {
    id: generateId(),
    sku: generateSku(),
    name: partial.name,
    category: partial.category,
    quantity: partial.quantity,
    price: partial.price,
    minStockLevel: partial.minStockLevel,
    description: partial.description ?? '',
    updatedAt: new Date().toISOString(),
  };
}
