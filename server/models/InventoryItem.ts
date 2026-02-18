import mongoose, { Schema, Model } from 'mongoose';

export interface IInventoryItem {
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

const inventoryItemSchema = new Schema<IInventoryItem>(
  {
    id: { type: String, required: true, unique: true },
    sku: { type: String, required: true },
    name: { type: String, required: true },
    category: { type: String, required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    description: { type: String, default: '' },
    minStockLevel: { type: Number, required: true },
    updatedAt: { type: String, required: true },
  },
  { _id: false }
);

export const InventoryItemModel: Model<IInventoryItem> =
  mongoose.models.InventoryItem ?? mongoose.model<IInventoryItem>('InventoryItem', inventoryItemSchema);
