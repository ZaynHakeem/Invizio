import mongoose, { Schema, Model } from 'mongoose';

export interface IInventoryItem {
  _id: string;
  id: string;
  userId: string;
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
    _id: { type: String, required: true },
    id: { type: String, required: true },
    userId: { type: String, required: true, index: true },
    sku: { type: String, required: true },
    name: { type: String, required: true },
    category: { type: String, required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    description: { type: String, default: '' },
    minStockLevel: { type: Number, required: true },
    updatedAt: { type: String, required: true },
  },
  { id: false }
);

inventoryItemSchema.index({ userId: 1, id: 1 }, { unique: true });
inventoryItemSchema.index({ userId: 1, sku: 1 }, { unique: true });

export const InventoryItemModel: Model<IInventoryItem> =
  mongoose.models.InventoryItem ?? mongoose.model<IInventoryItem>('InventoryItem', inventoryItemSchema);
