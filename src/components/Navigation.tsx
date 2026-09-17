import { Bell, House, LogOut, Package, Settings2 } from "lucide-react";
import type { ViewType } from "../types";
import { Brand, ThemeSelect } from "./UI";
export function Navigation({
  view,
  onView,
  alertCount,
  stale,
  mode,
  onSettings,
  onExit,
  locked,
}: {
  view: ViewType;
  onView: (view: ViewType) => void;
  alertCount: number | null;
  stale: boolean;
  mode: "demo" | "api";
  onSettings: () => void;
  onExit: () => void;
  locked: boolean;
}) {
  const items = [
    { id: "dashboard", label: "Overview", Icon: House },
    { id: "inventory", label: "Inventory", Icon: Package },
    { id: "alerts", label: "Alerts", Icon: Bell },
  ] as const;
  const links = items.map(({ id, label, Icon }) => (
    <button
      key={id}
      className={`nav-item ${view === id ? "active" : ""}`}
      onClick={() => onView(id)}
      aria-current={view === id ? "page" : undefined}
    >
      <Icon size={20} aria-hidden="true" />
      <span>{label}</span>
      {id === "alerts" &&
        (alertCount === null ? (
          <span
            className="nav-count unknown"
            aria-label="Alert count unavailable"
          >
            —
          </span>
        ) : (
          alertCount > 0 && (
            <span
              className="nav-count"
              aria-label={`${alertCount} items need attention${stale ? ", last known count" : ""}`}
            >
              {alertCount}
            </span>
          )
        ))}
    </button>
  ));
  return (
    <>
      <aside className="sidebar">
        <a
          href="#main"
          className="brand-link"
          aria-label="Invizio, skip to content"
        >
          <Brand />
        </a>
        <div className="workspace-label">
          <span className="workspace-avatar">
            {mode === "demo" ? "D" : "W"}
          </span>
          <div>
            <strong>
              {mode === "demo" ? "Demo workspace" : "Your workspace"}
            </strong>
            <span>
              {mode === "demo" ? "A space to explore" : "Inventory management"}
            </span>
          </div>
        </div>
        <div className="nav-caption">WORKSPACE</div>
        <nav aria-label="Main navigation">{links}</nav>
        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <span className="tiny-dot" />
            <span>
              {mode === "demo"
                ? "Demo · in this tab only"
                : "Connected inventory"}
            </span>
          </div>
          <button className="nav-item" onClick={onSettings} disabled={locked}>
            <Settings2 size={19} aria-hidden="true" />
            Settings
          </button>
          <div className="sidebar-divider" />
          <div className="sidebar-controls">
            <ThemeSelect />
            <button
              className="icon-button"
              onClick={onExit}
              disabled={locked}
              aria-label={mode === "demo" ? "Leave demo" : "Leave workspace"}
              title="Leave workspace"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>
      <nav className="mobile-nav" aria-label="Mobile navigation">
        {links}
      </nav>
    </>
  );
}
