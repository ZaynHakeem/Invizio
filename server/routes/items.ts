import { Router, Request, Response } from 'express';
import { InventoryItemModel } from '../models/InventoryItem.js';
import { INITIAL_DATA, createNewItem } from '../seedData.js';

const router = Router();

/** GET /api/items - fetch all items */
router.get('/', async (_req: Request, res: Response) => {
  try {
    const items = await InventoryItemModel.find().sort({ updatedAt: -1 });
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

function validateNumericFields(quantity: number, price: number, minStockLevel: number): string | null {
  if (!Number.isFinite(quantity) || quantity < 0) return 'Quantity must be a non-negative number.';
  if (quantity !== Math.floor(quantity)) return 'Quantity must be a whole number.';
  if (!Number.isFinite(price) || price < 0) return 'Price must be a non-negative number.';
  if (!Number.isFinite(minStockLevel) || minStockLevel < 0) return 'Min. stock level must be a non-negative number.';
  if (minStockLevel !== Math.floor(minStockLevel)) return 'Min. stock level must be a whole number.';
  return null;
}

/** POST /api/items - create item (id/sku generated via createNewItem) */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, category, quantity, price, minStockLevel, description } = req.body;
    if (name == null || category == null || quantity == null || price == null || minStockLevel == null) {
      return res.status(400).json({ error: 'Missing required fields: name, category, quantity, price, minStockLevel' });
    }
    const q = Number(quantity);
    const p = Number(price);
    const m = Number(minStockLevel);
    const validationError = validateNumericFields(q, p, m);
    if (validationError) return res.status(400).json({ error: validationError });
    const item = createNewItem({
      name: String(name),
      category: String(category),
      quantity: q,
      price: p,
      minStockLevel: m,
      description: description != null ? String(description) : undefined,
    });
    const doc = { ...item, _id: item.id };
    await InventoryItemModel.create(doc);
    res.status(201).json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create item' });
  }
});

/** POST /api/items/seed - delete all and seed with initial data (define before /:id) */
router.post('/seed', async (_req: Request, res: Response) => {
  try {
    await InventoryItemModel.deleteMany({});
    const docs = INITIAL_DATA.map((item) => ({ ...item, _id: item.id }));
    await InventoryItemModel.insertMany(docs);
    const items = await InventoryItemModel.find().sort({ updatedAt: -1 });
    res.status(200).json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to seed items' });
  }
});

/** PUT /api/items/:id - update item */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { name, category, quantity, price, minStockLevel, description } = req.body;
    const updates: Record<string, unknown> = {
      ...(name != null && { name: String(name) }),
      ...(category != null && { category: String(category) }),
      ...(description != null && { description: String(description) }),
      updatedAt: new Date().toISOString(),
    };
    if (quantity != null) {
      const q = Number(quantity);
      if (!Number.isFinite(q) || q < 0 || q !== Math.floor(q)) return res.status(400).json({ error: 'Quantity must be a non-negative whole number.' });
      updates.quantity = q;
    }
    if (price != null) {
      const p = Number(price);
      if (!Number.isFinite(p) || p < 0) return res.status(400).json({ error: 'Price must be a non-negative number.' });
      updates.price = p;
    }
    if (minStockLevel != null) {
      const m = Number(minStockLevel);
      if (!Number.isFinite(m) || m < 0 || m !== Math.floor(m)) return res.status(400).json({ error: 'Min. stock level must be a non-negative whole number.' });
      updates.minStockLevel = m;
    }
    const updated = await InventoryItemModel.findOneAndUpdate(
      { id: req.params.id },
      updates,
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'Item not found' });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update item' });
  }
});

/** DELETE /api/items/:id - delete item */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const result = await InventoryItemModel.deleteOne({ id: req.params.id });
    if (result.deletedCount === 0) return res.status(404).json({ error: 'Item not found' });
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

export default router;
