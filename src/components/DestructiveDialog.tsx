import { useState } from "react";
import { RotateCcw, Trash2 } from "lucide-react";
import type { InventoryItem } from "../types";
import type { InventoryStore, PendingOperation } from "../data/store";
import { RequestError } from "../data/contracts";
import { Dialog, Spinner } from "./UI";
import { PendingResolution } from "./PendingResolution";
export function DestructiveDialog({
  item,
  count,
  store,
  pending,
  online,
  onClose,
  onDone,
  suspended,
  onSuspend,
  mode = "demo",
}: {
  item: InventoryItem | null;
  count: number;
  store: InventoryStore;
  pending: PendingOperation | null;
  online: boolean;
  onClose: () => void;
  onDone: (message: string) => void;
  suspended: boolean;
  onSuspend: () => void;
  mode?: "demo" | "api";
}) {
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const reset = !item;
  const clearToEmpty = mode === "api";
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy || pending || !online || (reset && confirmation !== "RESET"))
      return;
    setBusy(true);
    setError("");
    try {
      await store.commit(
        item ? { kind: "delete", id: item.id } : { kind: "reset" },
      );
      onDone(
        item
          ? `${item.name} deleted.`
          : clearToEmpty
            ? "Inventory cleared."
            : "Inventory replaced with the demo items.",
      );
    } catch (failure) {
      if (failure instanceof RequestError && failure.kind !== "unknown")
        setError(failure.message);
      setConfirmation("");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog
      suspended={suspended}
      title={reset ? "Reset inventory?" : `Delete ${item.name}?`}
      subtitle={
        reset
          ? clearToEmpty
            ? "This permanently removes every item from your inventory."
            : "This replaces your entire inventory with the four demo items."
          : `${item.sku} · This cannot be undone.`
      }
      onClose={() => {
        if (pending) onSuspend();
        else onClose();
      }}
      busy={busy || pending?.phase === "checking"}
      initialFocus={reset ? "#reset-confirmation" : "#cancel-delete"}
      footer={
        <>
          <button
            className="button secondary"
            id="cancel-delete"
            onClick={pending ? onSuspend : onClose}
            disabled={busy || pending?.phase === "checking"}
          >
            {pending ? "Close for now" : "Cancel"}
          </button>
          <button
            className="button danger"
            type="submit"
            form="destructive-form"
            disabled={
              busy ||
              !!pending ||
              !online ||
              (reset && confirmation !== "RESET")
            }
          >
            {busy ? (
              <Spinner />
            ) : reset ? (
              <>
                <RotateCcw size={16} />
                Reset inventory
              </>
            ) : (
              <>
                <Trash2 size={16} />
                Delete item
              </>
            )}
          </button>
        </>
      }
    >
      <form id="destructive-form" onSubmit={submit}>
        <p>
          {reset
            ? clearToEmpty
              ? `All ${count} existing ${count === 1 ? "item" : "items"} and their details will be permanently removed. Your inventory will be empty.`
              : `All ${count} existing ${count === 1 ? "item" : "items"} and their details will be permanently removed. Only the four demo items will remain.`
            : `This removes ${item.name} and all its details from this inventory. It will no longer appear in stock alerts or totals.`}
        </p>
        {reset && (
          <div className="field mt-6">
            <label htmlFor="reset-confirmation">Type RESET to confirm</label>
            <input
              id="reset-confirmation"
              autoComplete="off"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              disabled={busy || !!pending}
            />
          </div>
        )}
        {!online && (
          <div className="notice warning" role="status">
            You’re offline. Reconnect before making changes.
          </div>
        )}
        {error && (
          <div className="notice error" role="alert">
            {error}
          </div>
        )}
      </form>
      {pending && (
        <PendingResolution
          pending={pending}
          store={store}
          online={online}
          onResolved={() =>
            onDone("The item is no longer in the latest inventory.")
          }
          onKeep={onClose}
          onRetry={() => {
            setConfirmation("");
            setError("Review the details and confirm again before retrying.");
          }}
        />
      )}
    </Dialog>
  );
}
