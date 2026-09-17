import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  AlertCircle,
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronDown,
  Layers3,
  Moon,
  Package,
  RefreshCw,
  X,
} from "lucide-react";
import { useTheme, type ThemePreference } from "../hooks/useTheme";
import { stockLabels, stockStatus } from "../domain/inventory";
import type { InventoryItem } from "../types";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <span className="brand">
      <span className="brand-mark">
        <Layers3 size={23} strokeWidth={1.8} aria-hidden="true" />
      </span>
      {!compact && (
        <span>
          invizio<span className="brand-period">.</span>
        </span>
      )}
    </span>
  );
}
export function ThemeSelect() {
  const { preference, setPreference } = useTheme();
  return (
    <label className="theme-select">
      <Moon size={16} aria-hidden="true" />
      <span className="sr-only">Appearance</span>
      <select
        value={preference}
        onChange={(e) => setPreference(e.target.value as ThemePreference)}
      >
        <option value="system">System</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
      <ChevronDown size={14} aria-hidden="true" />
    </label>
  );
}
export function StockBadge({
  item,
}: {
  item: Pick<InventoryItem, "quantity" | "minStockLevel">;
}) {
  const status = stockStatus(item);
  const Icon =
    status === "out"
      ? AlertCircle
      : status === "low"
        ? AlertTriangle
        : CheckCircle2;
  return (
    <span className={`stock-badge ${status}`}>
      <Icon size={13} aria-hidden="true" />
      {stockLabels[status]}
    </span>
  );
}
export function Dialog({
  title,
  subtitle,
  children,
  footer,
  onClose,
  busy = false,
  drawer = false,
  initialFocus,
  suspended = false,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
  busy?: boolean;
  drawer?: boolean;
  initialFocus?: string;
  suspended?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    if (suspended) return;
    const previous = document.activeElement as HTMLElement | null;
    const dialog = ref.current!;
    dialog.showModal();
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    if (initialFocus) dialog.querySelector<HTMLElement>(initialFocus)?.focus();
    return () => {
      dialog.close();
      document.body.style.overflow = oldOverflow;
      previous?.focus();
    };
  }, [suspended]);
  return (
    <dialog
      ref={ref}
      className={drawer ? "dialog drawer" : "dialog"}
      aria-labelledby="dialog-title"
      aria-describedby={subtitle ? "dialog-subtitle" : undefined}
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) closeRef.current();
      }}
      onClick={(e) => {
        if (e.target !== e.currentTarget || busy) return;
        const r = e.currentTarget.getBoundingClientRect();
        if (
          e.clientX < r.left ||
          e.clientX > r.right ||
          e.clientY < r.top ||
          e.clientY > r.bottom
        )
          closeRef.current();
      }}
    >
      <header className="dialog-head">
        <div>
          <h2 id="dialog-title">{title}</h2>
          {subtitle && <p id="dialog-subtitle">{subtitle}</p>}
        </div>
        <button
          className="icon-button"
          onClick={onClose}
          disabled={busy}
          aria-label="Close dialog"
        >
          <X size={20} />
        </button>
      </header>
      <div className="dialog-body">{children}</div>
      {footer && <footer className="dialog-footer">{footer}</footer>}
    </dialog>
  );
}
export function EmptyState({
  title,
  children,
  action,
  kind = "empty",
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
  kind?: "empty" | "error" | "success" | "search";
}) {
  const Icon =
    kind === "error"
      ? AlertCircle
      : kind === "success"
        ? CheckCircle2
        : Package;
  return (
    <section className={`empty-state ${kind}`}>
      <span className="empty-icon">
        <Icon size={28} strokeWidth={1.5} aria-hidden="true" />
      </span>
      <h2>{title}</h2>
      <div className="empty-copy">{children}</div>
      {action && <div className="empty-action">{action}</div>}
    </section>
  );
}
export function Skeleton({ dashboard = false }: { dashboard?: boolean }) {
  return (
    <div
      className="loading-surface"
      role="status"
      aria-label="Loading inventory"
    >
      <span className="sr-only">Loading inventory…</span>
      {dashboard && (
        <div className="stats-grid">
          {[0, 1, 2, 3].map((i) => (
            <div className="stat-card" key={i}>
              <div className="skeleton sk-short" />
              <div className="skeleton sk-number" />
              <div className="skeleton sk-short" />
            </div>
          ))}
        </div>
      )}
      <div className="panel skeleton-list">
        {[0, 1, 2, 3, 4].map((i) => (
          <div className="skeleton-row" key={i}>
            <div className="skeleton sk-avatar" />
            <div className="skeleton sk-name" />
            <div className="skeleton sk-short" />
          </div>
        ))}
      </div>
    </div>
  );
}
export function Toast({
  message,
  onClose,
}: {
  message: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const id = setTimeout(onClose, 8000);
    return () => clearTimeout(id);
  }, [message, onClose]);
  return (
    <div className="toast" role="status">
      <Check size={19} aria-hidden="true" />
      <span>{message}</span>
      <button
        className="icon-button"
        onClick={onClose}
        aria-label="Dismiss notification"
      >
        <X size={18} />
      </button>
    </div>
  );
}
export function Spinner({ label = "Working…" }: { label?: string }) {
  return (
    <>
      <RefreshCw size={16} className="spin" aria-hidden="true" />
      {label}
    </>
  );
}
export function MobileSplash() {
  const [visible, setVisible] = useState(() => {
    if (!window.matchMedia("(max-width: 767px)").matches) return false;
    try {
      return sessionStorage.getItem("invizio-splash-seen") !== "yes";
    } catch {
      return true;
    }
  });
  useEffect(() => {
    if (!visible) return;
    let frame2 = 0;
    // Shell readiness, not network readiness: a slow API can never trap the splash.
    const frame1 = requestAnimationFrame(() => {
      frame2 = requestAnimationFrame(() => {
        setVisible(false);
        try {
          sessionStorage.setItem("invizio-splash-seen", "yes");
        } catch {}
      });
    });
    return () => {
      cancelAnimationFrame(frame1);
      cancelAnimationFrame(frame2);
    };
  }, [visible]);
  return visible ? (
    <div className="mobile-splash" role="status" aria-label="Opening Invizio">
      <Brand />
      <p>A little order. A lot of clarity.</p>
      <span className="splash-line" />
    </div>
  ) : null;
}
