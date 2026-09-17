import test, { after, afterEach, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { Window } from "happy-dom";
import { act, StrictMode } from "react";

// DOM interaction tests, not a real-browser layout/accessibility audit.
const window = new Window({ url: "http://localhost:5173" });
for (const key of [
  "window",
  "document",
  "navigator",
  "HTMLElement",
  "HTMLInputElement",
  "HTMLTextAreaElement",
  "HTMLDialogElement",
  "localStorage",
  "sessionStorage",
  "Event",
  "MutationObserver",
  "ResizeObserver",
] as const) {
  Object.defineProperty(globalThis, key, {
    value: key === "window" ? window : window[key],
    configurable: true,
    writable: true,
  });
}
Object.assign(globalThis, {
  IS_REACT_ACT_ENVIRONMENT: true,
  requestAnimationFrame: window.requestAnimationFrame.bind(window),
  cancelAnimationFrame: window.cancelAnimationFrame.bind(window),
});
const { createRoot } = await import("react-dom/client");
const { default: App } = await import("../src/App");
let root: ReturnType<typeof createRoot>;
beforeEach(() => {
  window.document.body.innerHTML = '<div id="root"></div>';
  window.localStorage.clear();
  window.sessionStorage.clear();
  root = createRoot(document.getElementById("root")!);
});
afterEach(async () => {
  await act(async () => root.unmount());
  await window.happyDOM.cancelAsync();
});
after(async () => {
  await window.happyDOM.close();
});
async function render() {
  await act(async () => {
    root.render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
  });
}
const text = () => document.body.textContent ?? "";
function button(label: string, scope: ParentNode = document) {
  const found = [...scope.querySelectorAll<HTMLButtonElement>("button")].find(
    (button) => button.textContent?.trim() === label,
  );
  assert.ok(found, `Button missing: ${label}`);
  return found;
}
async function click(label: string, scope: ParentNode = document) {
  await act(async () => {
    button(label, scope).click();
  });
}
async function select(selector: string, value: string) {
  await act(async () => {
    const input = document.querySelector<HTMLSelectElement>(selector)!;
    assert.ok(input);
    input.value = value;
    input.dispatchEvent(
      new window.Event("change", { bubbles: true }) as unknown as Event,
    );
  });
}
async function fill(selector: string, value: string) {
  await act(async () => {
    const input = document.querySelector<
      HTMLInputElement | HTMLTextAreaElement
    >(selector)!;
    assert.ok(input);
    const proto =
      input.tagName === "TEXTAREA"
        ? window.HTMLTextAreaElement.prototype
        : window.HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, "value")!.set!.call(input, value);
    input.dispatchEvent(
      new window.Event("input", { bubbles: true }) as unknown as Event,
    );
  });
}
async function submit(selector: string) {
  await act(async () => {
    document.querySelector(selector)!.dispatchEvent(
      new window.Event("submit", {
        bubbles: true,
        cancelable: true,
      }) as unknown as Event,
    );
  });
}

test("account preview validates inline and never creates a fake session", async () => {
  await render();
  await submit(".auth-form");
  assert.match(text(), /Enter a valid email address/);
  assert.match(text(), /Enter your password/);
  await fill("#auth-email", "owner@example.com");
  await fill("#auth-password", "sample-password");
  await submit(".auth-form");
  assert.match(text(), /Accounts are not connected yet/);
  assert.doesNotMatch(text(), /A little order. A lot of clarity.Here/);
  assert.equal(window.localStorage.getItem("password"), null);
  assert.ok(document.querySelector(".auth-form"));
});
test("switching theme preserves draft fields; failed validation keeps description", async () => {
  await render();
  await click("Try the demo");
  await click("Add item");
  await fill("#item-name", "Desk lamp");
  await fill("#item-description", "Warm white bulb included.");
  await select(".sidebar .theme-select select", "dark");
  assert.equal(document.documentElement.dataset.theme, "dark");
  assert.equal(window.localStorage.getItem("invizio-theme"), "dark");
  assert.equal(
    document.querySelector<HTMLInputElement>("#item-name")!.value,
    "Desk lamp",
  );
  await submit("#item-form");
  assert.match(text(), /Enter or choose a category/);
  assert.match(text(), /Enter a price of 0 or more/);
  assert.equal(
    document.querySelector<HTMLTextAreaElement>("#item-description")!.value,
    "Warm white bulb included.",
  );
  await click("Cancel", document.querySelector("dialog")!);
  assert.match(text(), /Discard unsaved changes/);
  await click("Keep editing");
  assert.ok(document.querySelector("dialog[open]"));
});
test("demo create and edit persist every field and report success", async () => {
  await render();
  await click("Try the demo");
  await click("Add item");
  await fill("#item-name", "Desk lamp");
  await select("#item-category", "Electronics");
  await fill("#item-description", "Warm white bulb included.");
  await fill("#item-price", "24.50");
  await fill("#item-quantity", "10");
  await submit("#item-form");
  assert.equal(document.querySelector("dialog[open]"), null);
  assert.match(text(), /Desk lamp added to inventory/);
  await click("Inventory");
  await click("Desk lamp");
  assert.equal(
    document.querySelector<HTMLTextAreaElement>("#item-description")!.value,
    "Warm white bulb included.",
  );
  assert.equal(
    document.querySelector<HTMLInputElement>("#item-price")!.value,
    "24.5",
  );
  assert.match(
    document.querySelector<HTMLInputElement>("#item-sku")!.value,
    /^IV-/,
  );
  await fill("#item-description", "Updated detail");
  await submit("#item-form");
  assert.match(text(), /Desk lamp updated/);
});
test("preview initial failure and empty success never collapse into the same screen", async () => {
  await render();
  await click("Try the demo");
  await click("Inventory");
  await select("#preview-state", "initial-error");
  assert.match(text(), /Your inventory couldn’t be loaded/);
  assert.doesNotMatch(text(), /Your inventory starts here/);
  await select("#preview-state", "empty");
  assert.match(text(), /Your inventory starts here/);
  assert.doesNotMatch(text(), /couldn’t be loaded/);
  await click("Alerts");
  assert.match(text(), /Add inventory to start monitoring/);
  assert.doesNotMatch(
    document.querySelector("main")!.textContent!,
    /All stocked/,
  );
  await select("#preview-state", "stale");
  assert.match(text(), /We couldn’t refresh your inventory/);
  assert.match(text(), /Denim Jeans/);
});
test("timed-out edit retains its draft when closed, then resolves by a read", async () => {
  await render();
  await click("Try the demo");
  await select("#preview-state", "save-timeout");
  await click("Inventory");
  await click("Wireless Mouse");
  await fill("#item-quantity", "27");
  await fill("#item-description", "Saved even though the reply is lost.");
  await submit("#item-form");
  assert.match(text(), /We couldn’t confirm the result/);
  assert.equal(button("Save changes").disabled, true);
  await click("Keep draft & close");
  assert.equal(document.querySelector("dialog[open]"), null);
  assert.match(text(), /A request still needs your review/);
  await click("Review request");
  assert.equal(
    document.querySelector<HTMLInputElement>("#item-quantity")!.value,
    "27",
  );
  await click("Check status");
  assert.equal(document.querySelector("dialog[open]"), null);
  assert.match(text(), /The latest item matches your changes/);
});
test("confirmed save with failed reload closes the form and reports stale data", async () => {
  await render();
  await click("Try the demo");
  await select("#preview-state", "saved-stale");
  await click("Inventory");
  await click("Wireless Mouse");
  await fill("#item-quantity", "42");
  await submit("#item-form");
  assert.equal(document.querySelector("dialog[open]"), null);
  assert.match(text(), /Wireless Mouse updated/);
  assert.match(text(), /We couldn’t refresh your inventory/);
  assert.match(text(), /42/);
  assert.doesNotMatch(text(), /We couldn’t confirm the result/);
});

test("delete names the item and requires an explicit confirmation", async () => {
  await render();
  await click("Try the demo");
  await click("Inventory");
  await act(async () => {
    document
      .querySelector<HTMLButtonElement>('[aria-label="Delete Denim Jeans"]')!
      .click();
  });
  assert.match(
    document.querySelector("dialog")!.textContent!,
    /Delete Denim Jeans\?/,
  );
  assert.match(document.querySelector("dialog")!.textContent!, /IV-002/);
  await click("Cancel", document.querySelector("dialog")!);
  assert.ok(button("Denim Jeans"));
  await act(async () => {
    document
      .querySelector<HTMLButtonElement>('[aria-label="Delete Denim Jeans"]')!
      .click();
  });
  await submit("#destructive-form");
  assert.equal(
    document.querySelector('[aria-label="Delete Denim Jeans"]'),
    null,
  );
  assert.match(text(), /Denim Jeans deleted/);
});

test("factory reset is disabled until RESET is typed and replaces the sample inventory", async () => {
  await render();
  await click("Try the demo");
  await click("Settings");
  await click("Factory reset");
  assert.match(
    document.querySelector("dialog")!.textContent!,
    /All 4 existing items/,
  );
  assert.equal(button("Reset inventory").disabled, true);
  await fill("#reset-confirmation", "reset");
  assert.equal(button("Reset inventory").disabled, true);
  await fill("#reset-confirmation", "RESET");
  assert.equal(button("Reset inventory").disabled, false);
  await submit("#destructive-form");
  assert.equal(document.querySelector("dialog[open]"), null);
  assert.match(text(), /Inventory replaced with the demo items/);
});
