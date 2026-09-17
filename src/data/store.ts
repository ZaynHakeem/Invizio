import type { InventoryItem } from "../types";
import { matchesInput } from "../domain/inventory";
import {
  isCancelled,
  RequestError,
  type InventoryRepository,
  type Operation,
} from "./contracts";

export interface Snapshot {
  items: InventoryItem[];
  receivedAt: number;
}
export interface PendingOperation {
  operation: Operation;
  phase: "saving" | "unknown" | "checking" | "review";
  startedAt: number;
  error: string | null;
  matches: InventoryItem[];
}
export interface InventoryState {
  snapshot: Snapshot | null;
  load: "idle" | "loading" | "ready" | "error";
  refreshing: boolean;
  stale: boolean;
  readError: RequestError | null;
  retryAt: number;
  pending: PendingOperation | null;
}
export class InventoryStore {
  private state: InventoryState = {
    snapshot: null,
    load: "idle",
    refreshing: false,
    stale: false,
    readError: null,
    retryAt: 0,
    pending: null,
  };
  private listeners = new Set<() => void>();
  private generation = 0;
  private readController?: AbortController;
  constructor(private repository: InventoryRepository) {}
  getSnapshot = () => this.state;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  private patch(patch: Partial<InventoryState>) {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((fn) => fn());
  }
  cancelRead = () => {
    this.generation++;
    this.readController?.abort();
  };
  async refresh(): Promise<void> {
    if (this.state.pending || Date.now() < this.state.retryAt) return;
    this.cancelRead();
    const generation = this.generation;
    const controller = (this.readController = new AbortController());
    this.patch({
      load: this.state.snapshot ? "ready" : "loading",
      refreshing: !!this.state.snapshot,
      readError: null,
    });
    try {
      const items = await this.repository.list(controller.signal);
      if (generation !== this.generation) return;
      this.patch({
        snapshot: { items, receivedAt: Date.now() },
        load: "ready",
        refreshing: false,
        stale: false,
        readError: null,
        retryAt: 0,
      });
    } catch (error) {
      if (generation !== this.generation || isCancelled(error)) return;
      const readError =
        error instanceof RequestError
          ? error
          : new RequestError(
              "Inventory could not be loaded. Try again.",
              "read",
            );
      this.patch({
        load: this.state.snapshot ? "ready" : "error",
        refreshing: false,
        stale: !!this.state.snapshot,
        readError,
        retryAt: Date.now() + (readError.options.retryAfterMs ?? 0),
      });
    }
  }
  async commit(operation: Operation) {
    if (this.state.pending)
      throw new RequestError(
        "Resolve the pending request before making another change.",
        "rejected",
      );
    if (Date.now() < this.state.retryAt)
      throw new RequestError(
        `Wait ${Math.ceil((this.state.retryAt - Date.now()) / 1000)} seconds before trying again.`,
        "rejected",
      );
    if (!this.state.snapshot)
      throw new RequestError(
        "Load inventory before making changes.",
        "rejected",
      );
    this.cancelRead();
    this.patch({
      refreshing: false,
      pending: {
        operation,
        phase: "saving",
        startedAt: Date.now(),
        error: null,
        matches: [],
      },
    });
    try {
      const result = await this.repository.write(operation);
      let items = this.state.snapshot!.items;
      if (operation.kind === "reset") items = result as InventoryItem[];
      else if (operation.kind === "delete")
        items = items.filter((item) => item.id !== operation.id);
      else {
        const saved = result as InventoryItem;
        items = [saved, ...items.filter((item) => item.id !== saved.id)];
      }
      // A confirmed write immediately updates local data. Refresh owns a separate error path.
      this.patch({
        snapshot: { items, receivedAt: this.state.snapshot!.receivedAt },
        pending: null,
        stale: true,
        readError: null,
        retryAt: 0,
      });
      void this.refresh();
      return result;
    } catch (error) {
      const failure =
        error instanceof RequestError
          ? error
          : new RequestError(
              "We could not confirm the result. Check its status before trying again.",
              "unknown",
            );
      if (failure.kind === "unknown") {
        this.patch({
          stale: true,
          retryAt: Date.now() + (failure.options.retryAfterMs ?? 0),
          pending: {
            ...this.state.pending!,
            phase: "unknown",
            error: failure.message,
          },
        });
      } else
        this.patch({
          pending: null,
          retryAt: Date.now() + (failure.options.retryAfterMs ?? 0),
        });
      throw failure;
    }
  }
  async checkPending(): Promise<"resolved" | "review" | "error"> {
    const pending = this.state.pending;
    if (
      !pending ||
      pending.phase === "saving" ||
      pending.phase === "checking" ||
      Date.now() < this.state.retryAt
    )
      return "error";
    this.cancelRead();
    const generation = this.generation;
    const controller = (this.readController = new AbortController());
    this.patch({ pending: { ...pending, phase: "checking", error: null } });
    try {
      const items = await this.repository.list(controller.signal);
      if (generation !== this.generation) return "error";
      const op = pending.operation;
      const current =
        "id" in op ? items.find((item) => item.id === op.id) : undefined;
      const resolved =
        op.kind === "delete"
          ? !current
          : op.kind === "update"
            ? !!current && matchesInput(current, op.input)
            : false;
      const matches =
        op.kind === "create"
          ? items.filter((item) => matchesInput(item, op.input))
          : current
            ? [current]
            : [];
      this.patch({
        snapshot: { items, receivedAt: Date.now() },
        load: "ready",
        stale: !resolved,
        readError: null,
        retryAt: 0,
        pending: resolved
          ? null
          : { ...pending, phase: "review", matches, error: null },
      });
      return resolved ? "resolved" : "review";
    } catch (error) {
      if (generation !== this.generation) return "error";
      const failure =
        error instanceof RequestError
          ? error
          : new RequestError("Status could not be checked. Try again.", "read");
      this.patch({
        stale: true,
        retryAt: Date.now() + (failure.options.retryAfterMs ?? 0),
        pending: {
          ...pending,
          phase: "unknown",
          error: `Status could not be checked. ${failure.message}`,
        },
      });
      return "error";
    }
  }
  // Only after a successful read and an explicit review. This never resends a write.
  acknowledgeReview() {
    if (this.state.pending?.phase !== "review") return;
    this.patch({ pending: null, stale: true });
    void this.refresh();
  }
}
