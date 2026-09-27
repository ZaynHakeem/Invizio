import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import {
  BrowserRouter,
  Link,
  Navigate,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";
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
              accessToken: async () =>
                (await authAdapter.getSession())?.accessToken ??
                session?.accessToken ??
                null,
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
                : (session?.email ?? "Your workspace")}
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
            <Link className="text-button" to="/">
              Sign in
            </Link>
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
          mode={mode}
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
                    : "Your workspace"}
              </h3>
              <p>
                {mode === "demo"
                  ? "Sample inventory is kept in memory. Leaving resets your changes."
                  : "Inventory changes are saved to your private MongoDB inventory."}
              </p>
            </div>
          </div>
          <div className="danger-zone">
            <h3>Reset inventory</h3>
            <p>
              {items
                ? mode === "demo"
                  ? `Replace all ${items.length} items with the four original demo items. This cannot be undone.`
                  : `Permanently remove all ${items.length} items. Your inventory will be empty.`
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
            {mode === "demo" ? "Leave demo" : "Sign out"}
          </button>
        </Dialog>
      )}
      {exitConfirm && (
        <Dialog
          title={mode === "demo" ? "Leave the demo?" : "Sign out?"}
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
                {mode === "demo" ? "Leave demo" : "Sign out"}
                <ArrowRight size={16} />
              </button>
            </>
          }
        >
          <p>
            {mode === "demo"
              ? "Your demo changes will be cleared. You can explore a fresh sample inventory whenever you return."
              : "Your inventory stays saved. You’ll return to the sign-in page."}
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

function DemoRoute() {
  const navigate = useNavigate();
  return (
    <Workspace
      mode="demo"
      session={null}
      onExit={() => {
        document.title = "Invizio · Inventory, in order";
        navigate("/");
      }}
    />
  );
}

function recoveryLinkPresent() {
  const value = `${window.location.search}${window.location.hash}`;
  return /(?:^|[?&#])type=recovery(?:&|$)/.test(value);
}

function NewPassword({
  onDone,
  onCancel,
}: {
  onDone: () => void;
  onCancel: () => void;
}) {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    if (password.length < 8) {
      setError("Use at least 8 characters.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await authAdapter.updatePassword(password);
      onDone();
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "We could not update your password. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-page">
      <main className="auth-layout">
        <section className="auth-form-section">
          <div className="auth-form-wrap">
            <span className="eyebrow">Password recovery</span>
            <h2>Choose a new password.</h2>
            <p className="muted">
              This reset link signed you in. Set a new password before opening
              your inventory.
            </p>
            <form noValidate onSubmit={submit} className="auth-form">
              <div className="field">
                <label htmlFor="new-password">New password</label>
                <input
                  id="new-password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setError("");
                  }}
                  disabled={busy}
                  aria-invalid={!!error}
                  required
                />
                <span className="field-hint">At least 8 characters.</span>
              </div>
              {error && (
                <div className="notice error" role="alert">
                  {error}
                </div>
              )}
              <button className="button primary full" disabled={busy}>
                {busy ? <Spinner /> : "Update password"}
              </button>
            </form>
            <button
              type="button"
              className="text-button auth-forgot"
              onClick={onCancel}
              disabled={busy}
            >
              Back to sign in
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

function AppRoute() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [recovery, setRecovery] = useState(recoveryLinkPresent);
  const [ready, setReady] = useState(!authAdapter.configured);

  useEffect(() => {
    if (!authAdapter.configured) return;
    let cancelled = false;
    void authAdapter.getSession().then((value) => {
      if (!cancelled) {
        setSession(value);
        setReady(true);
      }
    });
    const unsubscribe = authAdapter.onSessionChange((value, event) => {
      if (event === "PASSWORD_RECOVERY") setRecovery(true);
      setSession(value);
      setReady(true);
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  if (!ready) {
    return (
      <div className="auth-page" aria-busy="true">
        <div className="auth-form-wrap" style={{ margin: "auto" }}>
          <Spinner label="Checking your session…" />
        </div>
      </div>
    );
  }

  if (recovery) {
    return (
      <NewPassword
        onDone={() => setRecovery(false)}
        onCancel={() => {
          setRecovery(false);
          void authAdapter.signOut();
          setSession(null);
        }}
      />
    );
  }

  if (!session) {
    return (
      <AuthScreen
        onSession={(value) => {
          setSession(value);
          document.title = "Overview · Invizio";
        }}
      />
    );
  }

  return (
    <Workspace
      mode="api"
      session={session}
      onExit={() => {
        void authAdapter.signOut();
        setSession(null);
        document.title = "Invizio · Inventory, in order";
      }}
    />
  );
}

export function AppShell() {
  return (
    <>
      <MobileSplash />
      <Routes>
        <Route path="/demo" element={<DemoRoute />} />
        <Route path="/" element={<AppRoute />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AppShell />
      </ThemeProvider>
    </BrowserRouter>
  );
}
