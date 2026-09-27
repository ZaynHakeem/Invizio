import type {
  FieldErrors,
  InventoryItem,
  ItemInput,
  StockStatus,
} from "../types";

export function stockStatus(
  item: Pick<InventoryItem, "quantity" | "minStockLevel">,
): StockStatus {
  if (item.quantity === 0) return "out";
  return item.quantity <= item.minStockLevel ? "low" : "in";
}
export const stockLabels: Record<StockStatus, string> = {
  in: "In stock",
  low: "Low stock",
  out: "Out of stock",
};
export const money = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    value,
  );
export const number = (value: number) =>
  new Intl.NumberFormat("en-US").format(value);
export const time = (value: number | string) =>
  new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));

export const itemTextLimits = {
  name: 120,
  category: 60,
  description: 2000,
} as const;

export function validateInput(input: ItemInput): FieldErrors {
  const errors: FieldErrors = {};
  const name = input.name.trim();
  const category = input.category.trim();
  if (!name) errors.name = "Enter an item name.";
  else if (name.length > itemTextLimits.name)
    errors.name = `Use a name of ${itemTextLimits.name} characters or fewer.`;
  if (!category) errors.category = "Enter or choose a category.";
  else if (category.length > itemTextLimits.category)
    errors.category = `Use a category of ${itemTextLimits.category} characters or fewer.`;
  if (input.description.length > itemTextLimits.description)
    errors.description = `Use a description of ${itemTextLimits.description} characters or fewer.`;
  for (const [key, label] of [
    ["quantity", "Quantity"],
    ["minStockLevel", "Minimum stock level"],
  ] as const) {
    if (!Number.isSafeInteger(input[key]) || input[key] < 0)
      errors[key] = `${label} must be a whole number of 0 or more.`;
  }
  if (!Number.isFinite(input.price) || input.price < 0)
    errors.price = "Enter a price of 0 or more.";
  if (
    Number.isFinite(input.price) &&
    Math.abs(input.price * 100 - Math.round(input.price * 100)) > 0.00001
  )
    errors.price = "Use no more than 2 decimal places.";
  return errors;
}

// Validate the response boundary. A malformed response is never a successful empty list.
export function decodeItem(value: unknown): InventoryItem {
  if (!value || typeof value !== "object")
    throw new Error("Invalid item response.");
  const item = value as Record<string, unknown>;
  for (const key of [
    "id",
    "sku",
    "name",
    "category",
    "description",
    "updatedAt",
  ]) {
    if (
      typeof item[key] !== "string" ||
      (key !== "description" && !String(item[key]).trim())
    )
      throw new Error(`Invalid item ${key}.`);
  }
  if (!Number.isFinite(Date.parse(item.updatedAt as string)))
    throw new Error("Invalid item date.");
  for (const key of ["quantity", "price", "minStockLevel"]) {
    if (
      typeof item[key] !== "number" ||
      !Number.isFinite(item[key]) ||
      (item[key] as number) < 0
    )
      throw new Error(`Invalid item ${key}.`);
  }
  if (
    !Number.isSafeInteger(item.quantity) ||
    !Number.isSafeInteger(item.minStockLevel)
  )
    throw new Error("Invalid stock quantity.");
  return {
    id: item.id as string,
    sku: item.sku as string,
    name: item.name as string,
    category: item.category as string,
    description: item.description as string,
    quantity: item.quantity as number,
    price: item.price as number,
    minStockLevel: item.minStockLevel as number,
    updatedAt: item.updatedAt as string,
  };
}
export function decodeItems(value: unknown): InventoryItem[] {
  if (!Array.isArray(value)) throw new Error("Expected an inventory list.");
  const items = value.map(decodeItem);
  if (new Set(items.map((item) => item.id)).size !== items.length)
    throw new Error("Duplicate item IDs in response.");
  return items;
}
export function matchesInput(item: InventoryItem, input: ItemInput) {
  return (Object.keys(input) as (keyof ItemInput)[]).every(
    (key) => item[key] === input[key],
  );
}
export function searchItems(items: InventoryItem[], query: string) {
  const words = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return items.filter((item) =>
    words.every((word) =>
      `${item.name} ${item.sku} ${item.category}`
        .toLocaleLowerCase()
        .includes(word),
    ),
  );
}
export function stats(items: InventoryItem[]) {
  const categories = new Map<string, number>();
  for (const item of items)
    categories.set(
      item.category,
      (categories.get(item.category) ?? 0) + item.quantity * item.price,
    );
  return {
    totalValue: items.reduce(
      (sum, item) => sum + item.quantity * item.price,
      0,
    ),
    units: items.reduce((sum, item) => sum + item.quantity, 0),
    count: items.length,
    low: items.filter((item) => stockStatus(item) === "low").length,
    out: items.filter((item) => stockStatus(item) === "out").length,
    categories: [...categories]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value),
    top: [...items]
      .sort((a, b) => b.quantity * b.price - a.quantity * a.price)
      .slice(0, 5),
  };
}
export function attentionItems(items: InventoryItem[]) {
  return items
    .filter((item) => stockStatus(item) !== "in")
    .sort(
      (a, b) =>
        (stockStatus(a) === "out" ? 0 : 1) -
          (stockStatus(b) === "out" ? 0 : 1) ||
        a.quantity - b.quantity ||
        a.name.localeCompare(b.name),
    );
}
