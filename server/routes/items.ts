import { Router, Response, Request } from 'express';
import { InventoryItemModel } from '../models/InventoryItem.js';
import { createNewItem } from '../seedData.js';
import { requireAuth, type AuthedRequest } from '../auth.js';

const router = Router();

router.use(requireAuth);

function userId(req: Request): string {
  return (req as unknown as AuthedRequest).userId;
}

/** GET /api/items - fetch the signed-in user's items */
router.get('/', async (req, res: Response) => {
  try {
    const items = await InventoryItemModel.find({ userId: userId(req) }).sort({ updatedAt: -1 });
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

// Same limits and messages as validateInput in src/domain/inventory.ts.
// The server package cannot import that module (separate rootDir), so the rules are mirrored here.
const NAME_LIMIT = 120;
const CATEGORY_LIMIT = 60;
const DESCRIPTION_LIMIT = 2000;

type ItemField = 'name' | 'category' | 'description' | 'quantity' | 'price' | 'minStockLevel';
type ItemFieldErrors = Partial<Record<ItemField, string>>;

function nameError(value: string): string | undefined {
  const name = value.trim();
  if (!name) return 'Enter an item name.';
  if (name.length > NAME_LIMIT) return `Use a name of ${NAME_LIMIT} characters or fewer.`;
  return undefined;
}

function categoryError(value: string): string | undefined {
  const category = value.trim();
  if (!category) return 'Enter or choose a category.';
  if (category.length > CATEGORY_LIMIT) return `Use a category of ${CATEGORY_LIMIT} characters or fewer.`;
  return undefined;
}

function descriptionError(value: string): string | undefined {
  if (value.length > DESCRIPTION_LIMIT) return `Use a description of ${DESCRIPTION_LIMIT} characters or fewer.`;
  return undefined;
}

function quantityError(value: number): string | undefined {
  if (!Number.isSafeInteger(value) || value < 0) return 'Quantity must be a whole number of 0 or more.';
  return undefined;
}

function minStockError(value: number): string | undefined {
  if (!Number.isSafeInteger(value) || value < 0) return 'Minimum stock level must be a whole number of 0 or more.';
  return undefined;
}

function priceError(value: number): string | undefined {
  if (!Number.isFinite(value) || value < 0) return 'Enter a price of 0 or more.';
  if (Math.abs(value * 100 - Math.round(value * 100)) > 0.00001) return 'Use no more than 2 decimal places.';
  return undefined;
}

function sendFieldErrors(res: Response, errors: ItemFieldErrors): boolean {
  const fields = Object.fromEntries(Object.entries(errors).filter(([, message]) => message));
  const message = Object.values(fields)[0];
  if (typeof message !== 'string') return false;
  res.status(400).json({ error: message, fields });
  return true;
}

function isDuplicateKey(err: unknown): boolean {
  return typeof err === 'object' && err !== null && 'code' in err && (err as { code?: unknown }).code === 11000;
}

export async function createOwnedItem(
  owner: string,
  input: {
    name: string;
    category: string;
    quantity: number;
    price: number;
    minStockLevel: number;
    description?: string;
  },
): Promise<{ item: ReturnType<typeof createNewItem> } | { error: string; status: 409 }> {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const item = createNewItem(input);
    try {
      await InventoryItemModel.create({ ...item, userId: owner, _id: item.id });
      return { item };
    } catch (err) {
      if (isDuplicateKey(err) && attempt < 4) continue;
      if (isDuplicateKey(err)) {
        return { error: 'Could not assign a unique item code. Please try again.', status: 409 };
      }
      throw err;
    }
  }
  return { error: 'Could not assign a unique item code. Please try again.', status: 409 };
}

/** POST /api/items - create item for the signed-in user */
router.post('/', async (req, res: Response) => {
  try {
    const owner = userId(req);
    const { name, category, quantity, price, minStockLevel, description } = req.body;
    if (name == null || category == null || quantity == null || price == null || minStockLevel == null) {
      return res.status(400).json({ error: 'Missing required fields: name, category, quantity, price, minStockLevel' });
    }
    const q = Number(quantity);
    const p = Number(price);
    const m = Number(minStockLevel);
    const descriptionText = description != null ? String(description) : '';
    if (
      sendFieldErrors(res, {
        name: nameError(String(name)),
        category: categoryError(String(category)),
        description: descriptionError(descriptionText),
        quantity: quantityError(q),
        price: priceError(p),
        minStockLevel: minStockError(m),
      })
    ) {
      return;
    }
    const created = await createOwnedItem(owner, {
      name: String(name).trim(),
      category: String(category).trim(),
      quantity: q,
      price: p,
      minStockLevel: m,
      description: descriptionText,
    });
    if ('error' in created) return res.status(created.status).json({ error: created.error });
    return res.status(201).json(created.item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create item' });
  }
});

/** POST /api/items/seed - clear the signed-in user's inventory (empty start) */
router.post('/seed', async (req, res: Response) => {
  try {
    await InventoryItemModel.deleteMany({ userId: userId(req) });
    res.status(200).json([]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to reset inventory' });
  }
});

/** PUT /api/items/:id - update an item owned by the signed-in user */
router.put('/:id', async (req, res: Response) => {
  try {
    const { name, category, quantity, price, minStockLevel, description } = req.body;
    const errors: ItemFieldErrors = {};
    if (name != null) errors.name = nameError(String(name));
    if (category != null) errors.category = categoryError(String(category));
    if (description != null) errors.description = descriptionError(String(description));
    if (quantity != null) errors.quantity = quantityError(Number(quantity));
    if (price != null) errors.price = priceError(Number(price));
    if (minStockLevel != null) errors.minStockLevel = minStockError(Number(minStockLevel));
    if (sendFieldErrors(res, errors)) return;
    const updates: Record<string, unknown> = {
      ...(name != null && { name: String(name).trim() }),
      ...(category != null && { category: String(category).trim() }),
      ...(description != null && { description: String(description) }),
      updatedAt: new Date().toISOString(),
    };
    if (quantity != null) updates.quantity = Number(quantity);
    if (price != null) updates.price = Number(price);
    if (minStockLevel != null) updates.minStockLevel = Number(minStockLevel);
    const updated = await InventoryItemModel.findOneAndUpdate(
      { id: req.params.id, userId: userId(req) },
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

/** DELETE /api/items/:id - delete an item owned by the signed-in user */
router.delete('/:id', async (req, res: Response) => {
  try {
    const result = await InventoryItemModel.deleteOne({ id: req.params.id, userId: userId(req) });
    if (result.deletedCount === 0) return res.status(404).json({ error: 'Item not found' });
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

export default router;
