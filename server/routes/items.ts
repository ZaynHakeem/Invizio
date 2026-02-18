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

/** POST /api/items - create item (id/sku generated if not provided) */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, category, quantity, price, minStockLevel, description } = req.body;
    if (name == null || category == null || quantity == null || price == null || minStockLevel == null) {
      return res.status(400).json({ error: 'Missing required fields: name, category, quantity, price, minStockLevel' });
    }
    const item = createNewItem({
      name: String(name),
      category: String(category),
      quantity: Number(quantity),
      price: Number(price),
      minStockLevel: Number(minStockLevel),
      description: description != null ? String(description) : undefined,
    });
    await InventoryItemModel.create(item);
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
    await InventoryItemModel.insertMany(INITIAL_DATA);
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
    const updated = await InventoryItemModel.findOneAndUpdate(
      { id: req.params.id },
      {
        ...(name != null && { name: String(name) }),
        ...(category != null && { category: String(category) }),
        ...(quantity != null && { quantity: Number(quantity) }),
        ...(price != null && { price: Number(price) }),
        ...(minStockLevel != null && { minStockLevel: Number(minStockLevel) }),
        ...(description != null && { description: String(description) }),
        updatedAt: new Date().toISOString(),
      },
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
