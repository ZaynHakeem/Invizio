import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  LogOut,
  Plus,
  RefreshCw,
  Settings2,
  WifiOff,
} from "lucide-react";
import type { InventoryItem, ViewType } from "./types";
import { InventoryStore } from "./data/store";
import { createHttpRepository } from "./data/http";
import {
  createDemoRepository,
  previewStates,
  type PreviewState,
} from "./data/demo";
import { useInventory } from "./hooks/useInventory";
import { useClock, useOnline } from "./hooks/useOnline";
import { ThemeProvider } from "./hooks/useTheme";
import { attentionItems, time } from "./domain/inventory";
import { authAdapter, type AuthSession } from "./auth/adapter";
import { config } from "./config";
import { AuthScreen } from "./components/AuthScreen";
import { Navigation } from "./components/Navigation";
import { DashboardView, StatsSummary } from "./components/DashboardView";
import {
  InventoryView,
  defaultFilters,
  type Filters,
} from "./components/InventoryView";
import { AlertsView } from "./components/AlertsView";
import { ItemDrawer } from "./components/ItemDrawer";
import { DestructiveDialog } from "./components/DestructiveDialog";
import {
  Brand,
  Dialog,
  EmptyState,
  MobileSplash,
  Skeleton,
  Spinner,
  ThemeSelect,
  Toast,
} from "./components/UI";

function Workspace({
  mode,
  session,
  onExit,
}: {
  mode: "demo" | "api";
  session: AuthSession | null;
  onExit: () => void;
}) {
  const [preview, setPreview] = useState<PreviewState>("loaded");
  const store = useMemo(
    () =>
      new InventoryStore(
        mode === "demo"
          ? createDemoRepository(preview)
          : createHttpRepository({
              baseUrl: config.apiUrl,
              accessToken: async () => session?.accessToken ?? null,
            }),
      ),
    [mode, preview, session],
  );
  const state = useInventory(store);
  const connected = useOnline();
  const online = mode === "demo" || connected;
  const clock = useClock(state.retryAt > Date.now());
  const retrySeconds = Math.max(0, Math.ceil((state.retryAt - clock) / 1000));
  const [view, setView] = useState<ViewType>("dashboard");
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [editor, setEditor] = useState<{
    item: InventoryItem | null;
    stock: boolean;
  } | null>(null);
  const [destructive, setDestructive] = useState<{
    item: InventoryItem | null;
  } | null>(null);
  const [suspended, setSuspended] = useState(false);
  const [settings, setSettings] = useState(false);
  const [exitConfirm, setExitConfirm] = useState(false);
  const [toast, setToast] = useState("");
  const clearToast = useCallback(() => setToast(""), []);
  const heading = useRef<HTMLHeadingElement>(null);
  const items = state.snapshot?.items ?? null;
  const alertCount = items ? attentionItems(items).length : null;
  const locked = !!state.pending;
  const actionsDisabled = locked || !online || !items;
  useEffect(() => {
    document.title = `${view === "dashboard" ? "Overview" : view === "inventory" ? "Inventory" : "Alerts"} · Invizio`;
    heading.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [view]);
  useEffect(() => {
    if (
      preview === "stale" &&
      mode === "demo" &&
      state.snapshot &&
      !state.readError &&
      !state.refreshing
    )
      void store.refresh();
  }, [mode, preview, state.snapshot, state.readError, state.refreshing, store]);
  useEffect(() => {
    if (!state.pending) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [state.pending]);
  const openInventory = (stock = "") => {
    setFilters({ ...defaultFilters, stock });
    setView("inventory");
  };
  const add = () => setEditor({ item: null, stock: false });
  const saved = (message: string) => {
    setEditor(null);
    setDestructive(null);
    setSuspended(false);
    setToast(message);
  };
  const refresh = (
    <button
      className="button secondary"
      onClick={() => void store.refresh()}
      disabled={!online || state.refreshing || locked || retrySeconds > 0}
    >
      {state.refreshing ? (
        <Spinner label="Refreshing…" />
      ) : (
        <>
          <RefreshCw size={16} />
          {retrySeconds > 0 ? `Retry in ${retrySeconds}s` : "Retry"}
        </>
      )}
    </button>
  );
  const title =
    view === "dashboard"
      ? "A little order. A lot of clarity."
      : view === "inventory"
        ? "Your inventory, in order."
        : "Stay one step ahead.";
  return (
    <div className="app-shell">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <Navigation
        view={view}
        onView={setView}
        alertCount={alertCount}
        stale={state.stale}
        mode={mode}
        onSettings={() => setSettings(true)}
        onExit={() => setExitConfirm(true)}
        locked={locked}
      />
      <div className="app-main">
        <header className="topbar">
          <div className="desktop-breadcrumb">
            Workspace<span>/</span>
            <strong>
              {view === "dashboard"
                ? "Overview"
                : view === "inventory"
                  ? "Inventory"
                  : "Alerts"}
            </strong>
          </div>
          <div className="mobile-brand">
            <Brand />
          </div>
          <div className="topbar-actions">
            <span className="workspace-status">
              <span className="tiny-dot" />
              {mode === "demo"
                ? "Demo workspace"
                : (session?.email ?? "Shared workspace")}
            </span>
            <div className="mobile-theme">
              <ThemeSelect />
            </div>
            <button
              className="icon-button notification-button"
              aria-label={`Open alerts${alertCount === null ? ", count unavailable" : `, ${alertCount} items need attention`}`}
              onClick={() => setView("alerts")}
            >
              <Bell size={19} />
              {!!alertCount && <span className="notification-dot" />}
            </button>
            <button
              className="icon-button"
              aria-label="Workspace settings"
              onClick={() => setSettings(true)}
              disabled={locked}
            >
              <Settings2 size={19} />
            </button>
          </div>
        </header>
        {mode === "demo" && (
          <div className="preview-bar">
            <div>
              <span className="preview-label">PREVIEW</span>
              <span>Sample inventory · no account needed.</span>
            </div>
            <label htmlFor="preview-state">
              Preview state
              <select
                id="preview-state"
                aria-describedby="preview-state-hint"
                value={preview}
                disabled={!!editor || !!destructive || locked}
                onChange={(e) => {
                  setPreview(e.target.value as PreviewState);
                  setToast("");
                }}
              >
                {previewStates.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <span className="preview-state-hint" id="preview-state-hint">
              Changing state resets demo changes.
            </span>
          </div>
        )}
        <main id="main" className="main-content" tabIndex={-1}>
          <div className="page-heading">
            <div>
              <span className="eyebrow">
                {view === "dashboard"
                  ? "Overview"
                  : view === "inventory"
                    ? "Inventory"
                    : "Stock alerts"}
              </span>
              <h1 ref={heading} tabIndex={-1}>
                {title}
              </h1>
              <p>
                {view === "dashboard"
                  ? "The essentials, at a glance. Here’s how your inventory stands."
                  : view === "inventory"
                    ? "Every item, every detail. All in one place."
                    : "See what needs replenishing, starting with what’s run out."}
              </p>
            </div>
            <button
              className="button primary"
              onClick={add}
              disabled={actionsDisabled}
            >
              <Plus size={18} />
              Add item
            </button>
          </div>
          {mode === "api" && !connected && (
            <div className="banner warning" role="status">
              <WifiOff size={20} aria-hidden="true" />
              <div>
                <strong>You’re offline.</strong>
                <p>
                  Reconnect to load or save changes. Your open draft stays here.
                </p>
              </div>
            </div>
          )}
          {state.pending && suspended && (
            <div className="banner warning" role="status">
              <AlertTriangle size={20} aria-hidden="true" />
              <div>
                <strong>A request still needs your review.</strong>
                <p>
                  Your draft is kept here. Check the result before making
                  another change.
                </p>
              </div>
              <button
                className="button secondary"
                onClick={() => setSuspended(false)}
              >
                Review request
              </button>
            </div>
          )}
          {state.stale && !state.pending && (
            <div
              className="banner warning"
              role={state.readError ? "alert" : "status"}
            >
              <AlertTriangle size={20} aria-hidden="true" />
              <div>
                <strong>
                  {state.readError
                    ? "We couldn’t refresh your inventory."
                    : "Checking the latest inventory…"}
                </strong>
                <p>
                  {state.readError
                    ? `Showing last known data${state.snapshot ? ` from ${time(state.snapshot.receivedAt)}` : ""}. Confirmed changes are kept; retry only reloads the list.`
                    : "Confirmed changes are visible. Stock levels will be verified with the next update."}
                </p>
              </div>
              {state.readError && refresh}
            </div>
          )}
          {items && (
            <div className="sync-line">
              <span>
                {state.stale ? "Last full update" : "Updated"}{" "}
                {state.snapshot && time(state.snapshot.receivedAt)}
                {mode === "demo" ? " · Sample data" : ""}
              </span>
              <button
                className="text-button"
                disabled={
                  state.refreshing || locked || !online || retrySeconds > 0
                }
                onClick={() => void store.refresh()}
              >
                <RefreshCw
                  size={14}
                  className={state.refreshing ? "spin" : ""}
                />
                {state.refreshing
                  ? "Refreshing"
                  : retrySeconds
                    ? `Retry in ${retrySeconds}s`
                    : "Refresh"}
              </button>
            </div>
          )}
          {!items ? (
            state.load === "error" ? (
              <div className="view-stack">
                {view === "dashboard" && <StatsSummary items={null} />}
                <div className="panel" role="alert">
                  <EmptyState
                    title={
                      view === "alerts"
                        ? "We can’t check stock alerts yet."
                        : "Your inventory couldn’t be loaded."
                    }
                    kind="error"
                    action={refresh}
                  >
                    <p>{state.readError?.message}</p>
                    <p className="micro mt-3">
                      No inventory data has been confirmed. Retry to check this
                      workspace.
                    </p>
                  </EmptyState>
                </div>
              </div>
            ) : (
              <Skeleton dashboard={view === "dashboard"} />
            )
          ) : view === "dashboard" ? (
            <DashboardView
              items={items}
              stale={state.stale}
              onInventory={openInventory}
              onAlerts={() => setView("alerts")}
              onEdit={(item) => setEditor({ item, stock: true })}
              onAdd={add}
              disabled={actionsDisabled}
            />
          ) : view === "inventory" ? (
            <InventoryView
              items={items}
              stale={state.stale}
              filters={filters}
              setFilters={setFilters}
              onAdd={add}
              onEdit={(item) => setEditor({ item, stock: false })}
              onDelete={(item) => setDestructive({ item })}
              disabled={actionsDisabled}
            />
          ) : (
            <AlertsView
              items={items}
              stale={state.stale}
              onEdit={(item) => setEditor({ item, stock: true })}
              onAdd={add}
              disabled={actionsDisabled}
            />
          )}
        </main>
      </div>
      {editor && (
        <ItemDrawer
          suspended={suspended}
          onSuspend={() => setSuspended(true)}
          item={editor.item}
          focusStock={editor.stock}
          categories={[
            ...new Set((items ?? []).map((item) => item.category)),
          ].sort()}
          store={store}
          pending={state.pending}
          online={online}
          onClose={() => {
            setEditor(null);
            setSuspended(false);
          }}
          onSaved={saved}
        />
      )}
      {destructive && (
        <DestructiveDialog
          suspended={suspended}
          onSuspend={() => setSuspended(true)}
          item={destructive.item}
          count={items?.length ?? 0}
          store={store}
          pending={state.pending}
          online={online}
          onClose={() => {
            setDestructive(null);
            setSuspended(false);
          }}
          onDone={saved}
        />
      )}
      {settings && (
        <Dialog
          title="Workspace settings"
          subtitle="Make Invizio feel at home."
          onClose={() => setSettings(false)}
          footer={
            <button
              className="button primary"
              onClick={() => setSettings(false)}
            >
              Done
              <CheckIcon />
            </button>
          }
        >
          <div className="settings-row">
            <div>
              <h3>Appearance</h3>
              <p>Light, dark, or follow your device.</p>
            </div>
            <ThemeSelect />
          </div>
          <div className="settings-row">
            <div>
              <h3>Currency</h3>
              <p>Inventory values use US dollars (USD).</p>
            </div>
            <span className="category-label">USD</span>
          </div>
          <div className="settings-row">
            <div>
              <h3>
                {mode === "demo"
                  ? "Demo workspace"
                  : session
                    ? session.email
                    : "Connected workspace"}
              </h3>
              <p>
                {mode === "demo"
                  ? "Sample inventory is kept in memory. Leaving resets your changes."
                  : "Inventory changes are saved to your connected server."}
              </p>
            </div>
          </div>
          <div className="danger-zone">
            <h3>Reset inventory</h3>
            <p>
              {items
                ? `Replace all ${items.length} items with the four original demo items. This cannot be undone.`
                : "Load inventory before resetting it."}
            </p>
            <button
              className="button danger-outline"
              disabled={actionsDisabled}
              onClick={() => {
                setSettings(false);
                setDestructive({ item: null });
              }}
            >
              Factory reset
            </button>
          </div>
          <button
            className="text-button mt-4"
            onClick={() => {
              setSettings(false);
              setExitConfirm(true);
            }}
          >
            <LogOut size={16} />
            {mode === "demo" ? "Leave demo" : "Leave workspace"}
          </button>
        </Dialog>
      )}
      {exitConfirm && (
        <Dialog
          title={mode === "demo" ? "Leave the demo?" : "Leave this workspace?"}
          onClose={() => setExitConfirm(false)}
          footer={
            <>
              <button
                className="button secondary"
                onClick={() => setExitConfirm(false)}
              >
                Stay here
              </button>
              <button className="button primary" onClick={onExit}>
                Leave workspace
                <ArrowRight size={16} />
              </button>
            </>
          }
        >
          <p>
            {mode === "demo"
              ? "Your demo changes will be cleared. You can explore a fresh sample inventory whenever you return."
              : "Your confirmed inventory changes are saved. You’ll return to the sign-in page."}
          </p>
        </Dialog>
      )}
      {toast && <Toast message={toast} onClose={clearToast} />}
    </div>
  );
}
function CheckIcon() {
  return <ArrowRight size={16} aria-hidden="true" />;
}
export default function App() {
  const [mode, setMode] = useState<"demo" | "api" | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  return (
    <ThemeProvider>
      <MobileSplash />
      {mode ? (
        <Workspace
          mode={mode}
          session={session}
          onExit={() => {
            void authAdapter.signOut();
            setSession(null);
            setMode(null);
            document.title = "Invizio · Inventory, in order";
          }}
        />
      ) : (
        <AuthScreen
          onDemo={() => setMode("demo")}
          onConnected={() => setMode("api")}
          onSession={(value) => {
            setSession(value);
            setMode("api");
          }}
        />
      )}
    </ThemeProvider>
  );
}
