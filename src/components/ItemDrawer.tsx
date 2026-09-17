import { useEffect, useRef, useState, type FormEvent } from "react";
import { Check, Info, Save } from "lucide-react";
import type { FieldErrors, InventoryItem, ItemInput } from "../types";
import type { InventoryStore, PendingOperation } from "../data/store";
import { RequestError } from "../data/contracts";
import { validateInput } from "../domain/inventory";
import { Dialog, Spinner, StockBadge } from "./UI";
import { PendingResolution } from "./PendingResolution";

export function ItemDrawer({
  item,
  categories,
  focusStock,
  store,
  pending,
  online,
  onClose,
  onSaved,
  suspended,
  onSuspend,
}: {
  item: InventoryItem | null;
  categories: string[];
  focusStock: boolean;
  store: InventoryStore;
  pending: PendingOperation | null;
  online: boolean;
  onClose: () => void;
  onSaved: (message: string) => void;
  suspended: boolean;
  onSuspend: () => void;
}) {
  const initial = useRef({
    name: item?.name ?? "",
    category: item?.category ?? "",
    quantity: String(item?.quantity ?? 0),
    price: item ? String(item.price) : "",
    minStockLevel: String(item?.minStockLevel ?? 5),
    description: item?.description ?? "",
  });
  const [draft, setDraft] = useState(initial.current);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [error, setError] = useState("");
  const [discard, setDiscard] = useState(false);
  const [busy, setBusy] = useState(false);
  const [newCategory, setNewCategory] = useState(false);
  const dirty = JSON.stringify(draft) !== JSON.stringify(initial.current);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  const formRef = useRef<HTMLFormElement>(null);
  const feedbackRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (suspended) return;
    const field = error && Object.keys(errors)[0];
    if (field) {
      formRef.current?.querySelector<HTMLElement>(`[name="${field}"]`)?.focus();
    } else if (discard || error || pending) {
      feedbackRef.current?.focus();
      feedbackRef.current?.scrollIntoView({ block: "nearest" });
    }
  }, [discard, error, errors, pending?.phase, suspended]);
  const locked = busy || !!pending;
  function change(key: keyof ItemInput, value: string) {
    setDraft((old) => ({ ...old, [key]: value }));
    setErrors((old) => ({ ...old, [key]: undefined }));
    setError("");
    setDiscard(false);
  }
  function requestClose() {
    if (busy || pending?.phase === "saving" || pending?.phase === "checking")
      return;
    if (pending) {
      onSuspend();
      return;
    }
    if (dirty) setDiscard(true);
    else onClose();
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (locked || !online) return;
    const input: ItemInput = {
      ...draft,
      name: draft.name.trim(),
      category: draft.category.trim(),
      quantity: draft.quantity.trim() ? Number(draft.quantity) : NaN,
      price: draft.price.trim() ? Number(draft.price) : NaN,
      minStockLevel: draft.minStockLevel.trim()
        ? Number(draft.minStockLevel)
        : NaN,
    };
    const validation = validateInput(input);
    setErrors(validation);
    setError("");
    if (Object.keys(validation).length) {
      formRef.current
        ?.querySelector<HTMLElement>(`[name="${Object.keys(validation)[0]}"]`)
        ?.focus();
      return;
    }
    setBusy(true);
    try {
      await store.commit(
        item
          ? { kind: "update", id: item.id, input }
          : { kind: "create", input },
      );
      onSaved(
        item ? `${input.name} updated.` : `${input.name} added to inventory.`,
      );
    } catch (error) {
      if (error instanceof RequestError && error.kind !== "unknown") {
        setErrors(error.options.fields ?? {});
        setError(error.message);
        const key = Object.keys(error.options.fields ?? {})[0];
        if (key)
          formRef.current
            ?.querySelector<HTMLElement>(`[name="${key}"]`)
            ?.focus();
      }
    } finally {
      setBusy(false);
    }
  }
  const fieldError = (key: keyof ItemInput) =>
    errors[key] && (
      <span className="field-error" id={`${key}-error`}>
        {errors[key]}
      </span>
    );
  const accessible = (key: keyof ItemInput) => ({
    "aria-invalid": !!errors[key],
    "aria-describedby": errors[key] ? `${key}-error` : `${key}-hint`,
  });
  return (
    <Dialog
      drawer
      suspended={suspended}
      title={item ? "Edit item" : "Add an item"}
      subtitle={
        item
          ? `${item.sku} · Keep every detail up to date.`
          : "A few details now. A clearer inventory from here."
      }
      onClose={requestClose}
      busy={
        busy || pending?.phase === "saving" || pending?.phase === "checking"
      }
      initialFocus={focusStock ? '[name="quantity"]' : '[name="name"]'}
      footer={
        <>
          <span className="drawer-footer-note">
            <Check size={14} />
            {dirty ? "Unsaved changes" : "All details in one place"}
          </span>
          <button
            className="button secondary"
            onClick={requestClose}
            disabled={busy || pending?.phase === "checking"}
          >
            {pending ? "Keep draft & close" : "Cancel"}
          </button>
          <button
            type="submit"
            form="item-form"
            className="button primary"
            disabled={locked || !online}
          >
            {busy ? (
              <Spinner label="Saving…" />
            ) : (
              <>
                <Save size={16} />
                {item ? "Save changes" : "Add item"}
              </>
            )}
          </button>
        </>
      }
    >
      <div ref={feedbackRef} tabIndex={-1} aria-label="Form messages">
        {!online && (
          <div className="notice warning" role="status">
            You’re offline. Your draft is kept here. Reconnect before saving.
          </div>
        )}
        {discard && (
          <div className="notice warning" role="alert">
            <strong>Discard unsaved changes?</strong>
            <p>Your changes haven’t been saved.</p>
            <div className="inline-actions">
              <button
                className="button secondary"
                onClick={() => setDiscard(false)}
              >
                Keep editing
              </button>
              <button className="button danger" onClick={onClose}>
                Discard changes
              </button>
            </div>
          </div>
        )}
        {error && (
          <div className="notice error" role="alert">
            {error}
          </div>
        )}
        {pending && (
          <PendingResolution
            pending={pending}
            store={store}
            online={online}
            onResolved={() => onSaved("The latest item matches your changes.")}
            onKeep={onClose}
            onRetry={() => {
              setError(
                "Review your draft, then submit again when you’re ready.",
              );
              setErrors({});
            }}
          />
        )}
      </div>
      <form id="item-form" ref={formRef} onSubmit={submit} noValidate>
        <fieldset disabled={locked} className="form-section">
          <legend>Item details</legend>
          <div className="field">
            <label htmlFor="item-name">
              Item name <span aria-hidden="true">*</span>
            </label>
            <input
              id="item-name"
              name="name"
              value={draft.name}
              onChange={(e) => change("name", e.target.value)}
              placeholder="e.g. Wireless Mouse"
              required
              {...accessible("name")}
            />
            {fieldError("name")}
            <span className="sr-only" id="name-hint">
              Required
            </span>
          </div>
          <div className="field">
            <label htmlFor="item-sku">SKU</label>
            <input
              id="item-sku"
              value={item?.sku ?? "Assigned when you save"}
              readOnly
              aria-describedby="sku-hint"
            />
            <span className="field-hint" id="sku-hint">
              Automatically assigned to identify this item.
            </span>
          </div>
          <div className="field">
            <label htmlFor="item-category">
              Category <span aria-hidden="true">*</span>
            </label>
            {newCategory || !categories.length ? (
              <input
                id="item-category"
                name="category"
                value={draft.category}
                onChange={(e) => change("category", e.target.value)}
                placeholder="e.g. Electronics"
                required
                {...accessible("category")}
              />
            ) : (
              <select
                id="item-category"
                name="category"
                value={draft.category}
                onChange={(e) => {
                  if (e.target.value === "__new__") {
                    setNewCategory(true);
                    change("category", "");
                  } else change("category", e.target.value);
                }}
                required
                {...accessible("category")}
              >
                <option value="">Choose a category</option>
                {categories.map((category) => (
                  <option key={category}>{category}</option>
                ))}
                <option value="__new__">+ Create a category</option>
              </select>
            )}
            {fieldError("category")}
            <span className="field-hint" id="category-hint">
              Group similar items together.
            </span>
            {newCategory && categories.length > 0 && (
              <button
                type="button"
                className="text-button"
                onClick={() => {
                  setNewCategory(false);
                  change("category", item?.category ?? "");
                }}
              >
                Choose an existing category
              </button>
            )}
          </div>
          <div className="field">
            <label htmlFor="item-description">
              Description <span className="optional">Optional</span>
            </label>
            <textarea
              id="item-description"
              name="description"
              rows={3}
              value={draft.description}
              onChange={(e) => change("description", e.target.value)}
              placeholder="Size, materials, or anything worth remembering."
              {...accessible("description")}
            />
            {fieldError("description")}
            <span className="sr-only" id="description-hint">
              Useful details about this item
            </span>
          </div>
        </fieldset>
        <fieldset disabled={locked} className="form-section">
          <legend>Stock & pricing</legend>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="item-quantity">
                Quantity <span aria-hidden="true">*</span>
              </label>
              <input
                id="item-quantity"
                name="quantity"
                type="number"
                min="0"
                step="1"
                inputMode="numeric"
                value={draft.quantity}
                onChange={(e) => change("quantity", e.target.value)}
                required
                {...accessible("quantity")}
              />
              {fieldError("quantity")}
              <span className="field-hint" id="quantity-hint">
                Units currently available.
              </span>
            </div>
            <div className="field">
              <label htmlFor="item-price">
                Unit price (USD) <span aria-hidden="true">*</span>
              </label>
              <input
                id="item-price"
                name="price"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={draft.price}
                onChange={(e) => change("price", e.target.value)}
                placeholder="0.00"
                required
                {...accessible("price")}
              />
              {fieldError("price")}
              <span className="field-hint" id="price-hint">
                Price for one unit.
              </span>
            </div>
          </div>
          <div className="field">
            <label htmlFor="item-minimum">
              Minimum stock level <span aria-hidden="true">*</span>
            </label>
            <input
              id="item-minimum"
              name="minStockLevel"
              type="number"
              min="0"
              step="1"
              inputMode="numeric"
              value={draft.minStockLevel}
              onChange={(e) => change("minStockLevel", e.target.value)}
              required
              {...accessible("minStockLevel")}
            />
            {fieldError("minStockLevel")}
            <span className="field-hint" id="minStockLevel-hint">
              Alert when quantity reaches this number or lower.
            </span>
          </div>
          <div className="stock-preview">
            <Info size={17} aria-hidden="true" />
            <span>With these stock levels</span>
            {draft.quantity.trim() &&
            draft.minStockLevel.trim() &&
            Number.isSafeInteger(Number(draft.quantity)) &&
            Number(draft.quantity) >= 0 &&
            Number.isSafeInteger(Number(draft.minStockLevel)) &&
            Number(draft.minStockLevel) >= 0 ? (
              <StockBadge
                item={{
                  quantity: Number(draft.quantity),
                  minStockLevel: Number(draft.minStockLevel),
                }}
              />
            ) : (
              <span className="muted">Enter valid quantities</span>
            )}
          </div>
        </fieldset>
      </form>
    </Dialog>
  );
}
