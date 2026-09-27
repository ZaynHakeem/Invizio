import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import http from "node:http";
import type { Request } from "express";
import { exportJWK, generateKeyPair, SignJWT, type JWK } from "jose";
import {
  requireAuth,
  supabaseIssuer,
  type AuthedRequest,
} from "../server/auth.js";

const PROJECT = "https://invizio-test.supabase.co";
const ISSUER = supabaseIssuer(PROJECT);

let privateKey: CryptoKey;
let publicJwk: JWK;
let restoreFetch: (() => void) | undefined;

async function signToken(
  subject: string,
  claims: { audience?: string; issuer?: string } = {},
): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: "ES256", kid: "invizio-test" })
    .setSubject(subject)
    .setIssuer(claims.issuer ?? ISSUER)
    .setAudience(claims.audience ?? "authenticated")
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(privateKey);
}

function useProject() {
  const previousUrl = process.env.SUPABASE_URL;
  const previousVite = process.env.VITE_SUPABASE_URL;
  process.env.SUPABASE_URL = PROJECT;
  delete process.env.VITE_SUPABASE_URL;
  return () => {
    if (previousUrl === undefined) delete process.env.SUPABASE_URL;
    else process.env.SUPABASE_URL = previousUrl;
    if (previousVite === undefined) delete process.env.VITE_SUPABASE_URL;
    else process.env.VITE_SUPABASE_URL = previousVite;
  };
}

async function invokeRequireAuth(headers: Record<string, string>) {
  const req = { headers } as AuthedRequest;
  const res = {
    statusCode: 200,
    body: null as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
  };
  let nextCalled = false;
  await requireAuth(req, res as never, () => {
    nextCalled = true;
  });
  return { req, res, nextCalled };
}

async function withServer(
  register: (app: express.Express) => void,
  run: (baseUrl: string) => Promise<void>,
) {
  const app = express();
  app.use(express.json());
  register(app);
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    const address = server.address();
    assert.ok(address && typeof address === "object");
    await run(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("JWT verification", async (t) => {
  const pair = await generateKeyPair("ES256", { extractable: true });
  privateKey = pair.privateKey;
  publicJwk = await exportJWK(pair.publicKey);
  publicJwk.alg = "ES256";
  publicJwk.kid = "invizio-test";
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
  restoreFetch = () => {
    globalThis.fetch = originalFetch;
  };
  const restoreEnv = useProject();

  try {
    await t.test("returns 503 when the Supabase project URL is missing", async () => {
      delete process.env.SUPABASE_URL;
      delete process.env.VITE_SUPABASE_URL;
      try {
        const { res, nextCalled } = await invokeRequireAuth({
          authorization: "Bearer anything",
        });
        assert.equal(nextCalled, false);
        assert.equal(res.statusCode, 503);
      } finally {
        process.env.SUPABASE_URL = PROJECT;
      }
    });

    await t.test("rejects missing, invalid, and wrong-audience tokens", async () => {
      const missing = await invokeRequireAuth({});
      assert.equal(missing.nextCalled, false);
      assert.equal(missing.res.statusCode, 401);

      const invalid = await invokeRequireAuth({
        authorization: "Bearer not-a-jwt",
      });
      assert.equal(invalid.nextCalled, false);
      assert.equal(invalid.res.statusCode, 401);

      const wrongAudience = await signToken("user-alice", {
        audience: "anon",
      });
      const rejected = await invokeRequireAuth({
        authorization: `Bearer ${wrongAudience}`,
      });
      assert.equal(rejected.nextCalled, false);
      assert.equal(rejected.res.statusCode, 401);
    });

    await t.test("accepts a JWKS-signed token and sets userId", async () => {
      const token = await signToken("user-alice");
      const { req, res, nextCalled } = await invokeRequireAuth({
        authorization: `Bearer ${token}`,
      });
      assert.equal(res.statusCode, 200);
      assert.equal(nextCalled, true);
      assert.equal(req.userId, "user-alice");
    });

    await t.test("authenticated routes receive userId from the JWT subject", async () => {
      await withServer(
        (app) => {
          app.get("/api/items", requireAuth, (req: Request, res) => {
            res.json({ userId: (req as AuthedRequest).userId });
          });
        },
        async (baseUrl) => {
          const unauth = await fetch(`${baseUrl}/api/items`);
          assert.equal(unauth.status, 401);

          const token = await signToken("user-bob");
          const auth = await fetch(`${baseUrl}/api/items`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          assert.equal(auth.status, 200);
          assert.deepEqual(await auth.json(), { userId: "user-bob" });
        },
      );
    });

    await t.test("user B cannot read or change user A's items", async () => {
      const { InventoryItemModel } = await import(
        "../server/models/InventoryItem.js"
      );
      const { default: itemsRouter } = await import("../server/routes/items.js");
      const rows: Array<Record<string, unknown>> = [];
      const original = {
        find: InventoryItemModel.find,
        create: InventoryItemModel.create,
        findOneAndUpdate: InventoryItemModel.findOneAndUpdate,
        deleteOne: InventoryItemModel.deleteOne,
        deleteMany: InventoryItemModel.deleteMany,
      };
      InventoryItemModel.find = ((filter: { userId?: string }) => ({
        sort: async () => rows.filter((row) => row.userId === filter.userId),
      })) as unknown as typeof InventoryItemModel.find;
      InventoryItemModel.create = (async (doc: Record<string, unknown>) => {
        rows.push(doc);
        return doc;
      }) as unknown as typeof InventoryItemModel.create;
      InventoryItemModel.findOneAndUpdate = (async (filter: {
        id?: string;
        userId?: string;
      }) =>
        rows.find(
          (row) => row.id === filter.id && row.userId === filter.userId,
        ) ?? null) as unknown as typeof InventoryItemModel.findOneAndUpdate;
      InventoryItemModel.deleteOne = (async (filter: {
        id?: string;
        userId?: string;
      }) => {
        const index = rows.findIndex(
          (row) => row.id === filter.id && row.userId === filter.userId,
        );
        if (index < 0) return { deletedCount: 0 };
        rows.splice(index, 1);
        return { deletedCount: 1 };
      }) as unknown as typeof InventoryItemModel.deleteOne;
      InventoryItemModel.deleteMany = (async (filter: { userId?: string }) => {
        const before = rows.length;
        for (let index = rows.length - 1; index >= 0; index -= 1) {
          if (rows[index]?.userId === filter.userId) rows.splice(index, 1);
        }
        return { deletedCount: before - rows.length };
      }) as unknown as typeof InventoryItemModel.deleteMany;

      try {
        await withServer(
          (app) => {
            app.use("/api/items", itemsRouter);
          },
          async (baseUrl) => {
            const alice = await signToken("user-alice");
            const bob = await signToken("user-bob");
            const created = await fetch(`${baseUrl}/api/items`, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${alice}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                name: "Lamp",
                category: "Home",
                quantity: 1,
                price: 10,
                minStockLevel: 1,
              }),
            });
            assert.equal(created.status, 201);
            const item = (await created.json()) as { id: string };

            const bobList = await fetch(`${baseUrl}/api/items`, {
              headers: { Authorization: `Bearer ${bob}` },
            });
            assert.equal(bobList.status, 200);
            assert.deepEqual(await bobList.json(), []);

            const aliceList = await fetch(`${baseUrl}/api/items`, {
              headers: { Authorization: `Bearer ${alice}` },
            });
            assert.equal(aliceList.status, 200);
            const aliceItems = (await aliceList.json()) as Array<{ id: string }>;
            assert.deepEqual(
              aliceItems.map((row) => row.id),
              [item.id],
            );

            const bobUpdate = await fetch(`${baseUrl}/api/items/${item.id}`, {
              method: "PUT",
              headers: {
                Authorization: `Bearer ${bob}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ name: "Stolen" }),
            });
            assert.equal(bobUpdate.status, 404);

            const bobDelete = await fetch(`${baseUrl}/api/items/${item.id}`, {
              method: "DELETE",
              headers: { Authorization: `Bearer ${bob}` },
            });
            assert.equal(bobDelete.status, 404);

            const stillThere = await fetch(`${baseUrl}/api/items`, {
              headers: { Authorization: `Bearer ${alice}` },
            });
            assert.equal(
              ((await stillThere.json()) as unknown[]).length,
              1,
            );
          },
        );
      } finally {
        InventoryItemModel.find = original.find;
        InventoryItemModel.create = original.create;
        InventoryItemModel.findOneAndUpdate = original.findOneAndUpdate;
        InventoryItemModel.deleteOne = original.deleteOne;
        InventoryItemModel.deleteMany = original.deleteMany;
      }
    });
  } finally {
    restoreEnv();
    restoreFetch?.();
  }
});
