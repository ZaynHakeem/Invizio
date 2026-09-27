import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import http from "node:http";
import { exportJWK, generateKeyPair, SignJWT, type JWK } from "jose";
import { supabaseIssuer } from "../server/auth.js";
import { createOwnedItem } from "../server/routes/items.js";

const PROJECT = "https://invizio-sku-test.supabase.co";
const ISSUER = supabaseIssuer(PROJECT);

test("creating many items assigns unique SKUs and retries duplicate keys", async () => {
  const pair = await generateKeyPair("ES256", { extractable: true });
  const publicJwk: JWK = await exportJWK(pair.publicKey);
  publicJwk.alg = "ES256";
  publicJwk.kid = "invizio-sku-test";
  publicJwk.use = "sig";
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input, init) => {
    const href =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : input.url;
    if (href === `${ISSUER}/.well-known/jwks.json`) {
      return new Response(JSON.stringify({ keys: [publicJwk] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }
    return originalFetch(input, init);
  };
  const previousUrl = process.env.SUPABASE_URL;
  process.env.SUPABASE_URL = PROJECT;

  const { InventoryItemModel } = await import("../server/models/InventoryItem.js");
  const { default: itemsRouter } = await import("../server/routes/items.js");
  const rows: Array<Record<string, unknown>> = [];
  let duplicateFailuresLeft = 2;
  const original = {
    find: InventoryItemModel.find,
    create: InventoryItemModel.create,
    findOneAndUpdate: InventoryItemModel.findOneAndUpdate,
    deleteOne: InventoryItemModel.deleteOne,
    deleteMany: InventoryItemModel.deleteMany,
  };
  InventoryItemModel.create = (async (doc: Record<string, unknown>) => {
    if (duplicateFailuresLeft > 0) {
      duplicateFailuresLeft -= 1;
      const error = new Error("E11000 duplicate key");
      (error as { code?: number }).code = 11000;
      throw error;
    }
    if (rows.some((row) => row.userId === doc.userId && row.sku === doc.sku)) {
      const error = new Error("E11000 duplicate key");
      (error as { code?: number }).code = 11000;
      throw error;
    }
    rows.push(doc);
    return doc;
  }) as unknown as typeof InventoryItemModel.create;

  const app = express();
  app.use(express.json());
  app.use("/api/items", itemsRouter);
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));

  try {
    const address = server.address();
    assert.ok(address && typeof address === "object");
    const baseUrl = `http://127.0.0.1:${address.port}/api/items`;
    const token = await new SignJWT({})
      .setProtectedHeader({ alg: "ES256", kid: "invizio-sku-test" })
      .setSubject("user-stock")
      .setIssuer(ISSUER)
      .setAudience("authenticated")
      .setIssuedAt()
      .setExpirationTime("1h")
      .sign(pair.privateKey);

    const blank = await fetch(baseUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "   ",
        category: "Home",
        quantity: 1,
        price: 1.999,
        minStockLevel: 0,
        description: "x".repeat(2001),
      }),
    });
    assert.equal(blank.status, 400);
    const blankBody = (await blank.json()) as { error?: string; fields?: { name?: string; price?: string; description?: string } };
    assert.match(blankBody.error ?? "", /Enter an item name/);
    assert.match(blankBody.fields?.name ?? "", /Enter an item name/);
    assert.match(blankBody.fields?.price ?? "", /2 decimal places/);
    assert.match(blankBody.fields?.description ?? "", /2000 characters or fewer/);

    const first = await fetch(baseUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "First",
        category: "Home",
        quantity: 1,
        price: 2,
        minStockLevel: 0,
      }),
    });
    assert.equal(first.status, 201);
    assert.equal(duplicateFailuresLeft, 0);
    assert.equal(rows.length, 1);

    for (let index = 0; index < 1000; index += 1) {
      const created = await createOwnedItem("user-stock", {
        name: `Item ${index}`,
        category: "Home",
        quantity: 1,
        price: 2,
        minStockLevel: 0,
      });
      assert.ok(!("error" in created), `create ${index} failed`);
    }
    const skus = rows.map((row) => row.sku);
    assert.equal(new Set(skus).size, skus.length);
    assert.equal(skus.length, 1001);
    assert.ok(skus.every((sku) => typeof sku === "string" && /^IV-[A-Z2-9]{10}$/.test(sku)));
  } finally {
    InventoryItemModel.find = original.find;
    InventoryItemModel.create = original.create;
    InventoryItemModel.findOneAndUpdate = original.findOneAndUpdate;
    InventoryItemModel.deleteOne = original.deleteOne;
    InventoryItemModel.deleteMany = original.deleteMany;
    if (previousUrl === undefined) delete process.env.SUPABASE_URL;
    else process.env.SUPABASE_URL = previousUrl;
    globalThis.fetch = originalFetch;
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});
