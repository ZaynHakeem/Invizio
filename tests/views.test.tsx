import test from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { AlertsView } from "../src/components/AlertsView";
import { InventoryView, defaultFilters } from "../src/components/InventoryView";
import { StatsSummary } from "../src/components/DashboardView";
import { Navigation } from "../src/components/Navigation";
import { demoItems } from "../src/data/demo";
const noop = () => {};
test("new user with successful [] is empty, never All stocked", () => {
  const html = renderToStaticMarkup(
    <AlertsView
      items={[]}
      stale={false}
      disabled={false}
      onAdd={noop}
      onEdit={noop}
    />,
  );
  assert.match(html, /Add inventory to start monitoring/);
  assert.doesNotMatch(html, /All stocked/);
});
test("All stocked requires a nonempty fresh successful snapshot", () => {
  const items = demoItems().map((item) => ({ ...item, quantity: 100 }));
  assert.match(
    renderToStaticMarkup(
      <AlertsView
        items={items}
        stale={false}
        disabled={false}
        onAdd={noop}
        onEdit={noop}
      />,
    ),
    /All stocked/,
  );
  const stale = renderToStaticMarkup(
    <AlertsView
      items={items}
      stale
      disabled={false}
      onAdd={noop}
      onEdit={noop}
    />,
  );
  assert.match(stale, /No alerts in your last update/);
  assert.doesNotMatch(stale, /All stocked/);
});
test("stale empty inventory is historical and missing dashboard data is unknown", () => {
  assert.match(
    renderToStaticMarkup(
      <AlertsView
        items={[]}
        stale
        disabled={false}
        onAdd={noop}
        onEdit={noop}
      />,
    ),
    /No items in your last update/,
  );
  const summary = renderToStaticMarkup(<StatsSummary items={null} />);
  assert.equal((summary.match(/class="stat-value">—/g) ?? []).length, 4);
  assert.doesNotMatch(summary, /\$0.00/);
});
test("no search matches offers filter recovery rather than empty-inventory messaging", () => {
  const html = renderToStaticMarkup(
    <InventoryView
      items={demoItems()}
      stale={false}
      filters={{ ...defaultFilters, query: "no such item" }}
      setFilters={noop}
      onAdd={noop}
      onEdit={noop}
      onDelete={noop}
      disabled={false}
    />,
  );
  assert.match(html, /No items match your search/);
  assert.match(html, /Clear search and filters/);
  assert.doesNotMatch(html, /Your inventory starts here/);
});
test("navigation exposes the combined low/out count and unknown count separately", () => {
  const props = {
    view: "inventory" as const,
    onView: noop,
    onSettings: noop,
    onExit: noop,
    stale: false,
    mode: "demo" as const,
    locked: false,
  };
  assert.match(
    renderToStaticMarkup(<Navigation {...props} alertCount={2} />),
    /2 items need attention/,
  );
  assert.match(
    renderToStaticMarkup(<Navigation {...props} alertCount={null} />),
    /Alert count unavailable/,
  );
});
