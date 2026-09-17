import test from "node:test";
import assert from "node:assert/strict";
import {
  decodeItems,
  stats,
  stockStatus,
  attentionItems,
  validateInput,
} from "../src/domain/inventory";
import { createHttpRepository } from "../src/data/http";
import { demoItems } from "../src/data/demo";
import {
  RequestError,
  type InventoryRepository,
  type WriteResult,
} from "../src/data/contracts";
import { InventoryStore } from "../src/data/store";
import type { InventoryItem, ItemInput } from "../src/types";

const input: ItemInput = {
  name: "New item",
  category: "Supplies",
  quantity: 7,
  price: 12.5,
  minStockLevel: 3,
  description: "The description must survive every request.",
};
const item = {
  ...input,
  id: "saved-1",
  sku: "IV-123",
  updatedAt: "2026-09-16T10:00:00.000Z",
};
const signal = () => new AbortController().signal;
const response = (data: unknown, status = 200, headers = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
const fetcher = (fn: (url: string, init: RequestInit) => Promise<Response>) =>
  ((url, init) => fn(String(url), init!)) as typeof fetch;
const turn = () => new Promise((resolve) => setImmediate(resolve));
function repository(
  list: InventoryRepository["list"],
  write: InventoryRepository["write"] = async () => item,
): InventoryRepository {
  return { list, write };
}

test("stock boundaries and totals keep low and zero stock distinct", () => {
  assert.equal(stockStatus({ quantity: 0, minStockLevel: 0 }), "out");
  assert.equal(stockStatus({ quantity: 5, minStockLevel: 5 }), "low");
  assert.equal(stockStatus({ quantity: 6, minStockLevel: 5 }), "in");
  const data = stats(demoItems());
  assert.equal(data.count, 4);
  assert.equal(data.units, 99);
  assert.ok(Math.abs(data.totalValue - 828.66) < 0.000001);
  assert.equal(data.low, 1);
  assert.equal(data.out, 1);
  assert.deepEqual(
    attentionItems(demoItems()).map((i) => i.sku),
    ["IV-002", "IV-909"],
  );
});
test("response schema accepts a real empty array and rejects malformed or duplicate records", () => {
  assert.deepEqual(decodeItems([]), []);
  for (const value of [
    { items: [] },
    null,
    [{ ...item, quantity: -1 }],
    [{ ...item, quantity: 0.5 }],
    [{ ...item, price: "12" }],
    [{ ...item, updatedAt: "bad" }],
    [{ ...item, description: undefined }],
    [item, item],
  ])
    assert.throws(() => decodeItems(value));
  assert.deepEqual(decodeItems([{ ...item, _id: item.id, __v: 0 }]), [item]);
});
test("form validation does not coerce missing, negative, or fractional stock values", () => {
  assert.deepEqual(validateInput(input), {});
  const result = validateInput({
    ...input,
    quantity: NaN,
    price: -1,
    minStockLevel: 1.5,
    name: " ",
    category: "",
  });
  assert.deepEqual(Object.keys(result).sort(), [
    "category",
    "minStockLevel",
    "name",
    "price",
    "quantity",
  ]);
});
test("a valid 200 [] reaches ready; initial failure has no snapshot", async () => {
  const good = new InventoryStore(
    createHttpRepository({
      baseUrl: "",
      fetch: fetcher(async () => response([])),
    }),
  );
  await good.refresh();
  assert.equal(good.getSnapshot().load, "ready");
  assert.deepEqual(good.getSnapshot().snapshot?.items, []);
  const bad = new InventoryStore(
    createHttpRepository({
      baseUrl: "",
      fetch: fetcher(async () => response({ items: [] })),
    }),
  );
  await bad.refresh();
  assert.equal(bad.getSnapshot().load, "error");
  assert.equal(bad.getSnapshot().snapshot, null);
});
test("a transient GET retries once, while access errors and malformed JSON do not", async () => {
  let calls = 0;
  const retrying = createHttpRepository({
    baseUrl: "",
    retryDelayMs: 0,
    fetch: fetcher(async () =>
      ++calls === 1 ? response({}, 503) : response([]),
    ),
  });
  assert.deepEqual(await retrying.list(signal()), []);
  assert.equal(calls, 2);
  for (const value of [
    response({}, 403),
    response({ items: [] }),
    new Response("not json"),
  ]) {
    let calls = 0;
    await assert.rejects(
      createHttpRepository({
        baseUrl: "",
        fetch: fetcher(async () => {
          calls++;
          return value;
        }),
      }).list(signal()),
      RequestError,
    );
    assert.equal(calls, 1);
  }
});
test("rate-limit cooldown blocks early manual retry without hammering the API", async () => {
  let calls = 0;
  const store = new InventoryStore(
    createHttpRepository({
      baseUrl: "",
      fetch: fetcher(async () => {
        calls++;
        return response({}, 429, { "Retry-After": "60" });
      }),
    }),
  );
  await store.refresh();
  await store.refresh();
  assert.equal(calls, 1);
  assert.ok(store.getSnapshot().retryAt > Date.now() + 58_000);
});
test("read timeout is bounded and retries once; deliberate cancellation never retries", async () => {
  let calls = 0;
  const never = fetcher(async (_url, init) => {
    calls++;
    return new Promise((_, reject) =>
      init.signal!.addEventListener(
        "abort",
        () => reject(new DOMException("Aborted", "AbortError")),
        { once: true },
      ),
    );
  });
  const repo = createHttpRepository({
    baseUrl: "",
    fetch: never,
    readTimeoutMs: 8,
    retryDelayMs: 0,
  });
  await assert.rejects(
    repo.list(signal()),
    (e: RequestError) => e.kind === "read",
  );
  assert.equal(calls, 2);
  const controller = new AbortController();
  const running = repo.list(controller.signal);
  controller.abort();
  await assert.rejects(running, (e: RequestError) => e.kind === "cancelled");
  assert.equal(calls, 3);
});
test("writes retain description and never retry an ambiguous response", async () => {
  let calls = 0;
  const repo = createHttpRepository({
    baseUrl: "http://inventory.test",
    fetch: fetcher(async (url, init) => {
      calls++;
      assert.equal(url, "http://inventory.test/api/items");
      assert.equal(init.method, "POST");
      assert.deepEqual(JSON.parse(init.body as string), input);
      return response({}, 503);
    }),
  });
  await assert.rejects(
    repo.write({ kind: "create", input }),
    (e: RequestError) => e.kind === "unknown",
  );
  assert.equal(calls, 1);
});
test("write timeouts are uncertain and malformed 2xx bodies cannot claim success", async () => {
  let calls = 0;
  const repo = createHttpRepository({
    baseUrl: "",
    writeTimeoutMs: 8,
    fetch: fetcher(async (_url, init) => {
      calls++;
      return new Promise((_, reject) =>
        init.signal!.addEventListener("abort", () =>
          reject(new Error("lost reply")),
        ),
      );
    }),
  });
  await assert.rejects(
    repo.write({ kind: "create", input }),
    (e: RequestError) => e.kind === "unknown",
  );
  assert.equal(calls, 1);
  await assert.rejects(
    createHttpRepository({
      baseUrl: "",
      fetch: fetcher(async () => response({ ok: true }, 201)),
    }).write({ kind: "create", input }),
    (e: RequestError) => e.kind === "unknown",
  );
});
test("validation rejection maps inline errors; DELETE 204 succeeds without parsing JSON", async () => {
  const rejected = createHttpRepository({
    baseUrl: "",
    fetch: fetcher(async () =>
      response({ error: "Quantity must be a whole number." }, 400),
    ),
  });
  await assert.rejects(
    rejected.write({ kind: "update", id: item.id, input }),
    (e: RequestError) => e.kind === "rejected" && !!e.options.fields?.quantity,
  );
  assert.equal(
    await createHttpRepository({
      baseUrl: "",
      fetch: fetcher(async () => new Response(null, { status: 204 })),
    }).write({ kind: "delete", id: item.id }),
    null,
  );
});
test("refresh failures preserve both populated and genuinely empty snapshots", async () => {
  for (const items of [[], [item]]) {
    let fail = false;
    const store = new InventoryStore(
      repository(async () => {
        if (fail) throw new RequestError("offline", "read");
        return items;
      }),
    );
    await store.refresh();
    const snapshot = store.getSnapshot().snapshot;
    fail = true;
    await store.refresh();
    assert.equal(store.getSnapshot().snapshot, snapshot);
    assert.equal(store.getSnapshot().stale, true);
    assert.equal(store.getSnapshot().load, "ready");
  }
});
test("confirmed create and failed refresh stay successful; retry only reads", async () => {
  let reads = 0;
  let writes = 0;
  const store = new InventoryStore(
    repository(
      async () => {
        if (++reads > 1) throw new RequestError("read failed", "read");
        return [];
      },
      async () => {
        writes++;
        return item;
      },
    ),
  );
  await store.refresh();
  assert.deepEqual(await store.commit({ kind: "create", input }), item);
  await turn();
  assert.deepEqual(store.getSnapshot().snapshot?.items, [item]);
  assert.equal(store.getSnapshot().pending, null);
  assert.equal(store.getSnapshot().stale, true);
  await store.refresh();
  assert.equal(writes, 1);
  assert.equal(reads, 3);
});
test("confirmed update, delete, and reset apply their returned result before a failed refresh", async () => {
  for (const kind of ["update", "delete", "reset"] as const) {
    let reads = 0;
    const changed = { ...item, quantity: 30 };
    const result: WriteResult =
      kind === "delete" ? null : kind === "reset" ? demoItems() : changed;
    const store = new InventoryStore(
      repository(
        async () => {
          if (++reads > 1) throw new RequestError("read failed", "read");
          return [item];
        },
        async () => result,
      ),
    );
    await store.refresh();
    await store.commit(
      kind === "update"
        ? { kind, id: item.id, input: { ...input, quantity: 30 } }
        : kind === "delete"
          ? { kind, id: item.id }
          : { kind },
    );
    await turn();
    assert.deepEqual(
      store.getSnapshot().snapshot?.items,
      kind === "delete" ? [] : kind === "reset" ? result : [changed],
    );
    assert.equal(store.getSnapshot().pending, null);
  }
});
test("an old GET cannot overwrite a newer read or confirmed mutation", async () => {
  let resolveOld!: (items: InventoryItem[]) => void;
  let calls = 0;
  const store = new InventoryStore(
    repository(
      async () => {
        calls++;
        if (calls === 2)
          return new Promise((resolve) => {
            resolveOld = resolve;
          });
        if (calls > 2) throw new RequestError("failed refresh", "read");
        return [item];
      },
      async () => ({ ...item, quantity: 99 }),
    ),
  );
  await store.refresh();
  const old = store.refresh();
  await store.commit({
    kind: "update",
    id: item.id,
    input: { ...input, quantity: 99 },
  });
  resolveOld([item]);
  await old;
  await turn();
  assert.equal(store.getSnapshot().snapshot?.items[0].quantity, 99);
});
test("an uncertain create stays blocked after finding a matching item", async () => {
  let reads = 0;
  let writes = 0;
  const store = new InventoryStore(
    repository(
      async () => (++reads === 1 ? [] : [item]),
      async () => {
        writes++;
        throw new RequestError("lost reply", "unknown");
      },
    ),
  );
  await store.refresh();
  await assert.rejects(store.commit({ kind: "create", input }));
  await assert.rejects(
    store.commit({ kind: "create", input }),
    /pending request/,
  );
  assert.equal(await store.checkPending(), "review");
  assert.equal(store.getSnapshot().pending?.matches[0].sku, item.sku);
  assert.equal(store.getSnapshot().pending?.phase, "review");
  assert.equal(writes, 1);
  store.acknowledgeReview();
  await turn();
  assert.equal(store.getSnapshot().pending, null);
  assert.equal(writes, 1);
});
test("uncertain update reconciles by ID and full desired values", async () => {
  let reads = 0;
  const changed = { ...item, description: "Updated description", quantity: 20 };
  const store = new InventoryStore(
    repository(
      async () => (++reads === 1 ? [item] : [changed]),
      async () => {
        throw new RequestError("timeout", "unknown");
      },
    ),
  );
  await store.refresh();
  await assert.rejects(
    store.commit({
      kind: "update",
      id: item.id,
      input: { ...input, description: changed.description, quantity: 20 },
    }),
  );
  assert.equal(await store.checkPending(), "resolved");
  assert.equal(store.getSnapshot().pending, null);
  assert.equal(store.getSnapshot().stale, false);
});
test("uncertain delete resolves only when that ID is absent; reset always needs review", async () => {
  let reads = 0;
  const store = new InventoryStore(
    repository(
      async () => (++reads === 1 ? [item] : []),
      async () => {
        throw new RequestError("timeout", "unknown");
      },
    ),
  );
  await store.refresh();
  await assert.rejects(store.commit({ kind: "delete", id: item.id }));
  assert.equal(await store.checkPending(), "resolved");
  assert.deepEqual(store.getSnapshot().snapshot?.items, []);
  await assert.rejects(store.commit({ kind: "reset" }));
  assert.equal(await store.checkPending(), "review");
});
test("failed status checks retain uncertainty and cannot authorize another write", async () => {
  let reads = 0;
  const store = new InventoryStore(
    repository(
      async () => {
        if (++reads > 1) throw new RequestError("offline", "read");
        return [item];
      },
      async () => {
        throw new RequestError("timeout", "unknown");
      },
    ),
  );
  await store.refresh();
  await assert.rejects(store.commit({ kind: "update", id: item.id, input }));
  assert.equal(await store.checkPending(), "error");
  assert.equal(store.getSnapshot().pending?.phase, "unknown");
  store.acknowledgeReview();
  assert.ok(store.getSnapshot().pending);
  await assert.rejects(store.commit({ kind: "delete", id: item.id }));
});
