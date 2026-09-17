import { Component, lazy, Suspense, type ReactNode } from "react";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Boxes,
  CircleDollarSign,
  Plus,
} from "lucide-react";
import type { InventoryItem } from "../types";
import { attentionItems, money, number, stats } from "../domain/inventory";
import { EmptyState, StockBadge } from "./UI";
const ValueChart = lazy(() => import("./ValueChart"));
class ChartBoundary extends Component<
  { children: ReactNode },
  { error: boolean }
> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    return this.state.error ? (
      <p className="chart-fallback">
        Chart unavailable. All values are listed below.
      </p>
    ) : (
      this.props.children
    );
  }
}
export function StatsSummary({
  items,
  onLow,
  onOut,
  onInventory,
}: {
  items: InventoryItem[] | null;
  onLow?: () => void;
  onOut?: () => void;
  onInventory?: () => void;
}) {
  const data = items ? stats(items) : null;
  const cards = [
    {
      label: "Inventory value",
      value: data ? money(data.totalValue) : "—",
      note: "Quantity × unit price",
      Icon: CircleDollarSign,
      tone: "",
      action: onInventory,
    },
    {
      label: "Total items",
      value: data ? number(data.count) : "—",
      note: data
        ? `${number(data.units)} units across all items`
        : "Waiting for inventory",
      Icon: Boxes,
      tone: "",
      action: onInventory,
    },
    {
      label: "Low stock",
      value: data ? number(data.low) : "—",
      note: "At or below the minimum",
      Icon: AlertTriangle,
      tone: "warning",
      action: onLow,
    },
    {
      label: "Out of stock",
      value: data ? number(data.out) : "—",
      note: "Zero units available",
      Icon: AlertCircle,
      tone: "danger",
      action: onOut,
    },
  ];
  return (
    <div className="stats-grid">
      {cards.map((card) => (
        <button
          key={card.label}
          className={`stat-card ${card.tone}`}
          onClick={card.action}
          disabled={!items || !card.action}
        >
          <span className="stat-label">
            {card.label}
            <card.Icon size={18} aria-hidden="true" />
          </span>
          <strong className="stat-value">{card.value}</strong>
          <span className="stat-note">
            {card.note}
            {card.action && items && (
              <ArrowUpRight size={15} aria-hidden="true" />
            )}
          </span>
        </button>
      ))}
    </div>
  );
}
export function DashboardView({
  items,
  stale,
  onInventory,
  onAlerts,
  onEdit,
  onAdd,
  disabled,
}: {
  items: InventoryItem[];
  stale: boolean;
  onInventory: (stock?: string) => void;
  onAlerts: () => void;
  onEdit: (item: InventoryItem) => void;
  onAdd: () => void;
  disabled: boolean;
}) {
  const data = stats(items);
  const attention = attentionItems(items);
  return (
    <div className="view-stack">
      <StatsSummary
        items={items}
        onInventory={() => onInventory()}
        onLow={() => onInventory("low")}
        onOut={() => onInventory("out")}
      />
      {!items.length ? (
        <div className="panel">
          <EmptyState
            title={
              stale
                ? "No items in your last update"
                : "A fresh start for your inventory."
            }
            action={
              <button
                className="button primary"
                onClick={onAdd}
                disabled={disabled}
              >
                <Plus size={17} />
                Add your first item
              </button>
            }
          >
            <p>
              {stale
                ? "Refresh to confirm the current inventory."
                : "Add your first item to see stock levels, inventory value, and alerts here."}
            </p>
          </EmptyState>
        </div>
      ) : (
        <>
          <section className="panel attention-panel">
            <div className="section-head">
              <div>
                <span className="eyebrow">Keep things moving</span>
                <h2>
                  Needs attention
                  {attention.length > 0 && (
                    <span className="count-pill">{attention.length}</span>
                  )}
                </h2>
              </div>
              <button className="text-button" onClick={onAlerts}>
                View alerts
                <ArrowRight size={16} />
              </button>
            </div>
            {attention.length ? (
              <div className="attention-list">
                {attention.slice(0, 3).map((item) => (
                  <div className="attention-row" key={item.id}>
                    <span
                      className={`attention-icon ${item.quantity === 0 ? "out" : "low"}`}
                    >
                      {item.quantity === 0 ? (
                        <AlertCircle size={20} aria-hidden="true" />
                      ) : (
                        <AlertTriangle size={20} aria-hidden="true" />
                      )}
                    </span>
                    <div className="attention-name">
                      <strong>{item.name}</strong>
                      <span>
                        {item.sku} <span aria-hidden="true">·</span> Minimum{" "}
                        {number(item.minStockLevel)}
                      </span>
                    </div>
                    <div className="attention-stock">
                      <strong>
                        {number(item.quantity)} <span>left</span>
                      </strong>
                      <StockBadge item={item} />
                    </div>
                    <button
                      className="button secondary"
                      onClick={() => onEdit(item)}
                      disabled={disabled}
                    >
                      Update stock
                      <ArrowUpRight size={15} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="healthy-inline">
                <span className="healthy-mark">✓</span>
                <div>
                  <strong>
                    {stale
                      ? "No alerts in your last update"
                      : "All stocked. You’re in good shape."}
                  </strong>
                  <p>
                    {stale
                      ? "Refresh inventory to check current stock levels."
                      : "Every item is above its minimum stock level."}
                  </p>
                </div>
              </div>
            )}
          </section>
          <div className="chart-grid">
            <section className="panel chart-panel">
              <div className="section-head">
                <div>
                  <span className="eyebrow">The bigger picture</span>
                  <h2>Value by category</h2>
                </div>
                <span className="micro">USD</span>
              </div>
              <ChartBoundary>
                <Suspense
                  fallback={
                    <div
                      className="chart-skeleton skeleton"
                      aria-label="Loading chart"
                    />
                  }
                >
                  <ValueChart data={data.categories.slice(0, 5)} />
                </Suspense>
              </ChartBoundary>
              <details className="chart-details">
                <summary>
                  View category values
                  {data.categories.length > 5
                    ? ` · all ${data.categories.length} categories`
                    : ""}
                </summary>
                <dl>
                  {data.categories.map((category) => (
                    <div key={category.name}>
                      <dt>{category.name}</dt>
                      <dd>{money(category.value)}</dd>
                    </div>
                  ))}
                </dl>
              </details>
            </section>
            <section className="panel chart-panel">
              <div className="section-head">
                <div>
                  <span className="eyebrow">Where your value sits</span>
                  <h2>Highest value items</h2>
                </div>
                <span className="micro">Top {data.top.length}</span>
              </div>
              <div className="top-items">
                {data.top.map((item, index) => (
                  <div className="top-item" key={item.id}>
                    <span className="rank">0{index + 1}</span>
                    <div>
                      <div className="top-item-label">
                        <strong>{item.name}</strong>
                        <span>{money(item.quantity * item.price)}</span>
                      </div>
                      <div className="value-track" aria-hidden="true">
                        <span
                          style={{
                            width: `${data.top[0].quantity * data.top[0].price ? ((item.quantity * item.price) / (data.top[0].quantity * data.top[0].price)) * 100 : 0}%`,
                          }}
                        />
                      </div>
                      <small>
                        {number(item.quantity)} units · {money(item.price)} each
                      </small>
                    </div>
                  </div>
                ))}
              </div>
              <div className="chart-footnote">
                Based on current stock and unit prices.
              </div>
            </section>
          </div>
          <div className="workspace-footnote">
            A clear picture, one item at a time.
            <button className="text-button" onClick={() => onInventory()}>
              Explore inventory
              <ArrowRight size={15} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
