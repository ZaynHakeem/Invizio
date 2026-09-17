import type { FieldErrors, InventoryItem, ItemInput } from "../types";

export type Operation =
  | { kind: "create"; input: ItemInput }
  | { kind: "update"; id: string; input: ItemInput }
  | { kind: "delete"; id: string }
  | { kind: "reset" };
export type WriteResult = InventoryItem | InventoryItem[] | null;
export interface InventoryRepository {
  list(signal: AbortSignal): Promise<InventoryItem[]>;
  write(operation: Operation): Promise<WriteResult>;
}
export class RequestError extends Error {
  constructor(
    message: string,
    public kind: "rejected" | "unknown" | "read" | "cancelled",
    public options: {
      status?: number;
      transient?: boolean;
      retryAfterMs?: number;
      fields?: FieldErrors;
    } = {},
  ) {
    super(message);
    this.name = "RequestError";
  }
}
export const isCancelled = (error: unknown) =>
  error instanceof RequestError && error.kind === "cancelled";
