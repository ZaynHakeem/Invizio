import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import {
  ArrowDownUp,
  ArrowUpRight,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  X,
} from "lucide-react";
import { money, number, searchItems, stockStatus } from "../domain/inventory";
import type { InventoryItem } from "../types";
import { EmptyState, StockBadge } from "./UI";
export interface Filters {
  query: string;
  category: string;
  stock: string;
  sort: string;
}
export const defaultFilters: Filters = {
  query: "",
  category: "",
  stock: "",
  sort: "name",
};
export function InventoryView({
  items,
  stale,
  filters,
  setFilters,
  onAdd,
  onEdit,
  onDelete,
  disabled,
}: {
  items: InventoryItem[];
  stale: boolean;
  filters: Filters;
  setFilters: (filters: Filters) => void;
  onAdd: () => void;
  onEdit: (item: InventoryItem) => void;
  onDelete: (item: InventoryItem) => void;
  disabled: boolean;
}) {
  const [suggestions, setSuggestions] = useState(false);
  const [active, setActive] = useState(-1);
  const [page, setPage] = useState(1);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const categories = [...new Set(items.map((item) => item.category))].sort();
  const suggested = searchItems(items, filters.query).slice(0, 5);
  const filtered = useMemo(
    () =>
      searchItems(items, filters.query)
        .filter(
          (item) =>
            (!filters.category || item.category === filters.category) &&
            (!filters.stock ||
              (filters.stock === "attention"
                ? stockStatus(item) !== "in"
                : stockStatus(item) === filters.stock)),
        )
        .sort((a, b) =>
          filters.sort === "quantity"
            ? a.quantity - b.quantity
            : filters.sort === "value"
              ? b.quantity * b.price - a.quantity * a.price
              : filters.sort === "updated"
                ? Date.parse(b.updatedAt) - Date.parse(a.updatedAt)
                : a.name.localeCompare(b.name),
        ),
    [items, filters],
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / 20));
  const currentPage = Math.min(page, totalPages);
  useEffect(() => setPage(1), [filters]);
  useEffect(() => {
    const close = (e: PointerEvent) => {
      if (!searchRef.current?.contains(e.target as Node)) setSuggestions(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);
  function choose(item: InventoryItem) {
    setFilters({ ...filters, query: item.sku, category: "", stock: "" });
    setSuggestions(false);
    setActive(-1);
    inputRef.current?.focus();
  }
  function keyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setSuggestions(false);
      setActive(-1);
    }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      setSuggestions(true);
      setActive((old) =>
        e.key === "ArrowDown"
          ? Math.min(old + 1, suggested.length - 1)
          : Math.max(old - 1, 0),
      );
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (suggestions && active >= 0 && suggested[active])
        choose(suggested[active]);
      else setSuggestions(false);
    }
  }
  const clear = () => setFilters({ ...defaultFilters, sort: filters.sort });
  const open = suggestions && !!filters.query.trim() && suggested.length > 0;
  if (!items.length)
    return (
      <div className="panel">
        <EmptyState
          title={
            stale
              ? "No items in your last update"
              : "Your inventory starts here."
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
              ? "Refresh to confirm whether this workspace is still empty."
              : "Add an item, set its stock level, and we’ll help you keep track of the rest."}
          </p>
        </EmptyState>
      </div>
    );
  return (
    <section aria-label="Inventory items" className="inventory-panel panel">
      <div className="inventory-toolbar">
        <div
          className="search-wrap"
          ref={searchRef}
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node)) {
              setSuggestions(false);
              setActive(-1);
            }
          }}
        >
          <Search size={18} aria-hidden="true" />
          <label htmlFor="inventory-search" className="sr-only">
            Search inventory by name, SKU, or category
          </label>
          <input
            ref={inputRef}
            id="inventory-search"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={open}
            aria-controls={open ? "search-suggestions" : undefined}
            aria-activedescendant={
              open && active >= 0 ? `suggestion-${active}` : undefined
            }
            autoComplete="off"
            value={filters.query}
            onChange={(e) => {
              setFilters({ ...filters, query: e.target.value });
              setSuggestions(true);
              setActive(-1);
            }}
            onFocus={() => setSuggestions(true)}
            onKeyDown={keyDown}
            placeholder="Search name, SKU, or category…"
          />
          {filters.query && (
            <button
              className="icon-button"
              aria-label="Clear search"
              onClick={() => {
                setFilters({ ...filters, query: "" });
                inputRef.current?.focus();
              }}
            >
              <X size={17} />
            </button>
          )}
          {open && (
            <ul
              id="search-suggestions"
              role="listbox"
              aria-label="Matching items"
              className="suggestions"
            >
              {suggested.map((item, i) => (
                <li
                  key={item.id}
                  role="option"
                  id={`suggestion-${i}`}
                  aria-selected={active === i}
                  onPointerDown={(e) => e.preventDefault()}
                  onClick={() => choose(item)}
                  className={active === i ? "selected" : ""}
                >
                  <span>
                    <strong>{item.name}</strong>
                    <small>{item.category}</small>
                  </span>
                  <span className="sku">{item.sku}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="filters">
          <label className="filter">
            <SlidersHorizontal size={15} aria-hidden="true" />
            <span className="sr-only">Filter by category</span>
            <select
              value={filters.category}
              onChange={(e) =>
                setFilters({ ...filters, category: e.target.value })
              }
            >
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>
          </label>
          <label className="filter">
            <span className="sr-only">Filter by stock status</span>
            <select
              value={filters.stock}
              onChange={(e) =>
                setFilters({ ...filters, stock: e.target.value })
              }
            >
              <option value="">All stock levels</option>
              <option value="attention">Needs attention</option>
              <option value="in">In stock</option>
              <option value="low">Low stock</option>
              <option value="out">Out of stock</option>
            </select>
          </label>
          <label className="filter sort-filter">
            <ArrowDownUp size={15} aria-hidden="true" />
            <span className="sr-only">Sort inventory</span>
            <select
              value={filters.sort}
              onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
            >
              <option value="name">Name A–Z</option>
              <option value="quantity">Stock: low to high</option>
              <option value="value">Value: high to low</option>
              <option value="updated">Recently updated</option>
            </select>
          </label>
        </div>
      </div>
      <div className="results-meta">
        <span role="status">
          {filtered.length} of {items.length} items
          {stale ? " · Last known data" : ""}
        </span>
        {(filters.query || filters.category || filters.stock) && (
          <button className="text-button" onClick={clear}>
            Clear filters
            <X size={14} />
          </button>
        )}
      </div>
      {!filtered.length ? (
        <EmptyState
          title="No items match your search."
          kind="search"
          action={
            <button className="button secondary" onClick={clear}>
              Clear search and filters
            </button>
          }
        >
          <p>Try another name or SKU, or broaden your filters.</p>
        </EmptyState>
      ) : (
        <>
          <table className="inventory-table">
            <caption className="sr-only">
              Inventory quantities, status, prices, and item actions
            </caption>
            <thead>
              <tr>
                <th scope="col">Item</th>
                <th scope="col">Category</th>
                <th scope="col">Stock level</th>
                <th scope="col" className="numeric">
                  Unit price
                </th>
                <th scope="col" className="numeric">
                  Total value
                </th>
                <th scope="col">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered
                .slice((currentPage - 1) * 20, currentPage * 20)
                .map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="item-identity">
                        <span className="item-initial" aria-hidden="true">
                          {item.name.slice(0, 1)}
                        </span>
                        <div>
                          <button
                            className="item-name"
                            onClick={() => onEdit(item)}
                            disabled={disabled}
                          >
                            {item.name}
                          </button>
                          <span className="sku">{item.sku}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="category-label">{item.category}</span>
                    </td>
                    <td>
                      <div className="stock-cell">
                        <span>
                          <strong>{number(item.quantity)}</strong>
                          <small> units</small>
                        </span>
                        <StockBadge item={item} />
                      </div>
                    </td>
                    <td className="numeric">{money(item.price)}</td>
                    <td className="numeric value-cell">
                      {money(item.quantity * item.price)}
                    </td>
                    <td>
                      <div className="row-actions">
                        <button
                          className="icon-button"
                          onClick={() => onEdit(item)}
                          disabled={disabled}
                          aria-label={`Edit ${item.name}`}
                          title="Edit item"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          className="icon-button danger-icon"
                          onClick={() => onDelete(item)}
                          disabled={disabled}
                          aria-label={`Delete ${item.name}`}
                          title="Delete item"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
          <div className="inventory-cards">
            {filtered
              .slice((currentPage - 1) * 20, currentPage * 20)
              .map((item) => (
                <article className="inventory-card" key={item.id}>
                  <div className="card-top">
                    <div>
                      <span className="sku">{item.sku}</span>
                      <h2>{item.name}</h2>
                      <span className="muted">{item.category}</span>
                    </div>
                    <StockBadge item={item} />
                  </div>
                  <dl>
                    <div>
                      <dt>Quantity</dt>
                      <dd>{number(item.quantity)} units</dd>
                    </div>
                    <div>
                      <dt>Unit price</dt>
                      <dd>{money(item.price)}</dd>
                    </div>
                    <div>
                      <dt>Total value</dt>
                      <dd>{money(item.quantity * item.price)}</dd>
                    </div>
                  </dl>
                  <div className="card-actions">
                    <button
                      className="text-button"
                      onClick={() => onEdit(item)}
                      disabled={disabled}
                    >
                      <Pencil size={16} />
                      Edit item
                      <ArrowUpRight size={14} />
                    </button>
                    <button
                      className="icon-button danger-icon"
                      aria-label={`Delete ${item.name}`}
                      onClick={() => onDelete(item)}
                      disabled={disabled}
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </article>
              ))}
          </div>
          <div className="pagination">
            <span>
              {Math.min((currentPage - 1) * 20 + 1, filtered.length)}–
              {Math.min(currentPage * 20, filtered.length)} of{" "}
              {number(filtered.length)}
            </span>
            <div>
              <button
                className="button secondary"
                disabled={currentPage === 1}
                onClick={() => setPage(currentPage - 1)}
              >
                Previous
              </button>
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <button
                className="button secondary"
                disabled={currentPage === totalPages}
                onClick={() => setPage(currentPage + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
