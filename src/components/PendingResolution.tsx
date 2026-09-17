import { useEffect, useRef, useState } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import type { InventoryStore, PendingOperation } from "../data/store";
import { useClock } from "../hooks/useOnline";
import { Spinner } from "./UI";
export function PendingResolution({
  pending,
  store,
  onResolved,
  onKeep,
  onRetry,
  online,
}: {
  pending: PendingOperation;
  store: InventoryStore;
  onResolved: () => void;
  onKeep: () => void;
  onRetry: () => void;
  online: boolean;
}) {
  const [accepted, setAccepted] = useState(false);
  const panel = useRef<HTMLElement>(null);
  useEffect(() => {
    if (pending.phase !== "saving")
      panel.current?.scrollIntoView({ block: "nearest" });
  }, [pending.phase]);
  const now = useClock(true);
  const retryAt = store.getSnapshot().retryAt;
  const seconds = Math.max(0, Math.ceil((retryAt - now) / 1000));
  if (pending.phase === "saving")
    return (
      <div className="notice" role="status">
        <Spinner
          label={
            now - pending.startedAt > 8000
              ? "Taking longer than usual. Keep this window open; the request may still complete."
              : "Saving your changes…"
          }
        />
      </div>
    );
  const create = pending.operation.kind === "create";
  const reset = pending.operation.kind === "reset";
  return (
    <section
      ref={panel}
      className="pending-resolution"
      aria-label="Resolve unconfirmed request"
    >
      <h3>
        <AlertTriangle size={18} aria-hidden="true" />
        {pending.phase === "review"
          ? "Review the current inventory"
          : "We couldn’t confirm the result"}
      </h3>
      <p>
        {pending.error ||
          (pending.phase === "review"
            ? create
              ? "An item with similar details cannot prove whether this request created it. Review the matches before deciding what to do next."
              : reset
                ? "Inventory was reloaded, but the reset may have completed only partly. Review the current items before making another change."
                : "The current item does not match the requested result. Review its latest details before sending again."
            : "The request may have reached the server. We won’t send it again automatically.")}
      </p>
      {pending.phase === "review" && (
        <>
          <div className="pending-matches">
            <strong>
              {create
                ? `${pending.matches.length} possible ${pending.matches.length === 1 ? "match" : "matches"}`
                : reset
                  ? "Current inventory"
                  : "Current item"}
            </strong>
            {reset ? (
              <p>
                {store.getSnapshot().snapshot?.items.length ?? 0} items loaded.
                Keep the current inventory to inspect the full list.
              </p>
            ) : pending.matches.length ? (
              pending.matches.map((item) => (
                <div className="pending-item" key={item.id}>
                  <strong>
                    {item.name} · {item.sku}
                  </strong>
                  <span>
                    {item.category} · {item.quantity} units · $
                    {item.price.toFixed(2)} each · Minimum {item.minStockLevel}
                  </span>
                  <span>{item.description || "No description"}</span>
                </div>
              ))
            ) : (
              <p>
                {create
                  ? "No matching items found. A delayed request could still finish."
                  : "The item is not present in the latest response."}
              </p>
            )}
          </div>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
            />
            <span>
              {create
                ? "I have reviewed this inventory and understand another submission could create a duplicate."
                : reset
                  ? "I have reviewed the result and understand another reset will replace this inventory."
                  : "I have reviewed the current result. Sending again may overwrite newer changes."}
            </span>
          </label>
        </>
      )}
      <div className="pending-actions">
        <button
          className="button secondary"
          disabled={!online || pending.phase === "checking" || seconds > 0}
          onClick={async () => {
            setAccepted(false);
            const result = await store.checkPending();
            if (result === "resolved") onResolved();
          }}
        >
          {pending.phase === "checking" ? (
            <Spinner label="Checking…" />
          ) : (
            <>
              <RefreshCw size={16} />
              {seconds ? `Check again in ${seconds}s` : "Check status"}
            </>
          )}
        </button>
        {pending.phase === "review" && (
          <>
            <button
              className="button secondary"
              onClick={() => {
                store.acknowledgeReview();
                onKeep();
              }}
            >
              Keep current inventory
            </button>
            <button
              className="button primary"
              disabled={!accepted || !online}
              onClick={() => {
                store.acknowledgeReview();
                onRetry();
              }}
            >
              Review and retry
            </button>
          </>
        )}
      </div>
    </section>
  );
}
