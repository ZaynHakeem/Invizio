import { useState } from "react";
import { ArrowUpRight, Plus } from "lucide-react";
import type { InventoryItem } from "../types";
import { attentionItems, number, stockStatus } from "../domain/inventory";
import { EmptyState, StockBadge } from "./UI";
export function AlertsView({
  items,
  stale,
  onEdit,
  onAdd,
  disabled,
}: {
  items: InventoryItem[];
  stale: boolean;
  onEdit: (item: InventoryItem) => void;
  onAdd: () => void;
  disabled: boolean;
}) {
  const [filter, setFilter] = useState<"all" | "out" | "low">("all");
  const attention = attentionItems(items);
  const shown = attention.filter(
    (item) => filter === "all" || stockStatus(item) === filter,
  );
  if (!items.length)
    return (
      <div className="panel">
        <EmptyState
          title={
            stale
              ? "No items in your last update"
              : "Add inventory to start monitoring."
          }
          action={
            <button
              className="button primary"
              disabled={disabled}
              onClick={onAdd}
            >
              <Plus size={17} />
              Add your first item
            </button>
          }
        >
          <p>
            {stale
              ? "Refresh inventory to check current stock levels."
              : "Alerts will appear here when an item reaches its minimum stock level."}
          </p>
        </EmptyState>
      </div>
    );
  if (!attention.length)
    return (
      <div className="panel">
        <EmptyState
          title={stale ? "No alerts in your last update" : "All stocked."}
          kind={stale ? "empty" : "success"}
        >
          <p>
            {stale
              ? "This is last known data. Refresh to check your current stock levels."
              : "Every item is above its minimum stock level. We’ll surface anything that needs attention here."}
          </p>
        </EmptyState>
      </div>
    );
  return (
    <div className="view-stack">
      <div className="alert-tabs" role="group" aria-label="Filter stock alerts">
        {(["all", "out", "low"] as const).map((value) => (
          <button
            key={value}
            aria-pressed={filter === value}
            className={filter === value ? "active" : ""}
            onClick={() => setFilter(value)}
          >
            {value === "all"
              ? "All alerts"
              : value === "out"
                ? "Out of stock"
                : "Low stock"}
            <span>
              {value === "all"
                ? attention.length
                : attention.filter((item) => stockStatus(item) === value)
                    .length}
            </span>
          </button>
        ))}
      </div>
      <p className="muted">
        {stale
          ? "Last known stock levels. Refresh to confirm changes."
          : "Out-of-stock items appear first. Update quantities when new stock arrives."}
      </p>
      {!shown.length ? (
        <div className="panel">
          <EmptyState
            title="No alerts in this category."
            action={
              <button
                className="button secondary"
                onClick={() => setFilter("all")}
              >
                View all alerts
              </button>
            }
          >
            <p>
              Choose another stock level to see the items that need attention.
            </p>
          </EmptyState>
        </div>
      ) : (
        <div className="alerts-grid">
          {shown.map((item) => (
            <article
              className={`panel alert-card ${stockStatus(item)}`}
              key={item.id}
            >
              <div className="card-top">
                <StockBadge item={item} />
                <span className="sku">{item.sku}</span>
              </div>
              <h2>{item.name}</h2>
              <p className="muted">{item.category}</p>
              <dl className="alert-quantities">
                <div>
                  <dt>Available</dt>
                  <dd>
                    {number(item.quantity)}
                    <span> units</span>
                  </dd>
                </div>
                <div>
                  <dt>Minimum level</dt>
                  <dd>
                    {number(item.minStockLevel)}
                    <span> units</span>
                  </dd>
                </div>
              </dl>
              <p className="alert-advice">
                {item.quantity === 0
                  ? "No units available. Check whether new stock has arrived."
                  : "At or below your threshold. Consider replenishing this item."}
              </p>
              <button
                className="button secondary full"
                onClick={() => onEdit(item)}
                disabled={disabled}
              >
                Update stock
                <ArrowUpRight size={16} />
              </button>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
