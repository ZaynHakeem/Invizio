import { RequestError, type InventoryRepository } from "./contracts";
import type { InventoryItem } from "../types";

export type PreviewState =
  | "loaded"
  | "empty"
  | "healthy"
  | "loading"
  | "initial-error"
  | "malformed"
  | "stale"
  | "save-timeout"
  | "saved-stale";
export const previewStates: { value: PreviewState; label: string }[] = [
  { value: "loaded", label: "Loaded inventory" },
  { value: "empty", label: "Successful empty inventory" },
  { value: "healthy", label: "All stocked" },
  { value: "loading", label: "Initial loading" },
  { value: "initial-error", label: "Initial load failure" },
  { value: "malformed", label: "Malformed response" },
  { value: "stale", label: "Refresh failure" },
  { value: "save-timeout", label: "Save timeout · outcome unknown" },
  { value: "saved-stale", label: "Confirmed save · refresh failure" },
];
export const demoItems = (): InventoryItem[] =>
  [
    {
      id: "1",
      sku: "IV-772",
      name: "Wireless Mouse",
      category: "Electronics",
      quantity: 12,
      price: 45,
      minStockLevel: 5,
      description:
        "Ergonomic 2.4GHz wireless mouse with precision optical tracking.",
    },
    {
      id: "2",
      sku: "IV-104",
      name: "Pasta",
      category: "Groceries",
      quantity: 84,
      price: 2.99,
      minStockLevel: 20,
      description: "Premium Italian durum wheat pasta, 500g package.",
    },
    {
      id: "3",
      sku: "IV-909",
      name: "Trash Bags",
      category: "Home & Kitchen",
      quantity: 3,
      price: 12.5,
      minStockLevel: 5,
      description: "Heavy-duty tear-resistant garbage bags, 50-count box.",
    },
    {
      id: "4",
      sku: "IV-002",
      name: "Denim Jeans",
      category: "Clothing",
      quantity: 0,
      price: 85,
      minStockLevel: 10,
      description: "Classic fit blue denim jeans, size 32x32.",
    },
  ].map((item) => ({ ...item, updatedAt: new Date().toISOString() }));

// In-memory preview. No credentials or inventory leave the browser in this mode.
export function createDemoRepository(
  scenario: PreviewState = "loaded",
): InventoryRepository {
  let items = scenario === "empty" ? [] : demoItems();
  if (scenario === "healthy")
    items = items.map((item) => ({
      ...item,
      quantity: Math.max(item.quantity, item.minStockLevel + 1),
    }));
  let reads = 0;
  let writes = 0;
  return {
    async list(signal) {
      reads++;
      if (signal.aborted) throw new RequestError("Cancelled.", "cancelled");
      if (scenario === "loading")
        return new Promise((_, reject) => {
          signal.addEventListener(
            "abort",
            () => reject(new RequestError("Cancelled.", "cancelled")),
            { once: true },
          );
        });
      if (
        scenario === "initial-error" ||
        (scenario === "stale" && reads > 2) ||
        (scenario === "saved-stale" && writes > 0)
      ) {
        throw new RequestError(
          "Inventory could not be loaded. Check your connection and try again.",
          "read",
          { status: 503 },
        );
      }
      if (scenario === "malformed")
        throw new RequestError(
          "The server returned an invalid inventory list. Retry or contact the workspace owner.",
          "read",
        );
      return structuredClone(items);
    },
    async write(op) {
      writes++;
      let result: InventoryItem | InventoryItem[] | null;
      if (op.kind === "create") {
        const id = crypto.randomUUID();
        result = {
          ...op.input,
          id,
          sku: `IV-${id.slice(0, 6).toUpperCase()}`,
          updatedAt: new Date().toISOString(),
        };
        items.unshift(result);
      } else if (op.kind === "update") {
        const item = items.find((item) => item.id === op.id);
        if (!item)
          throw new RequestError(
            "This item is no longer available. Refresh inventory.",
            "rejected",
            { status: 404 },
          );
        result = { ...item, ...op.input, updatedAt: new Date().toISOString() };
        items = items.map((item) =>
          item.id === op.id ? (result as InventoryItem) : item,
        );
      } else if (op.kind === "delete") {
        items = items.filter((item) => item.id !== op.id);
        result = null;
      } else {
        items = demoItems();
        result = items;
      }
      if (scenario === "save-timeout")
        throw new RequestError(
          "The connection ended before we could confirm the result. Your request may have reached the server.",
          "unknown",
        );
      return structuredClone(result);
    },
  };
}
