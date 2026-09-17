import { decodeItem, decodeItems } from "../domain/inventory";
import type { FieldErrors } from "../types";
import {
  RequestError,
  type InventoryRepository,
  type Operation,
  type WriteResult,
} from "./contracts";

export interface HttpOptions {
  baseUrl: string;
  fetch?: typeof fetch;
  readTimeoutMs?: number;
  writeTimeoutMs?: number;
  retryDelayMs?: number;
  // Connect your future auth provider here. Tokens are never persisted by Invizio.
  accessToken?: () => Promise<string | null>;
}
function delay(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const stop = () => {
      clearTimeout(timer);
      reject(new RequestError("Request cancelled.", "cancelled"));
    };
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", stop);
      resolve();
    }, ms);
    if (signal.aborted) stop();
    else signal.addEventListener("abort", stop, { once: true });
  });
}
export function createHttpRepository(
  options: HttpOptions,
): InventoryRepository {
  const fetcher = options.fetch ?? fetch;
  const base = options.baseUrl.replace(/\/$/, "");
  async function request(
    path: string,
    method: string,
    body?: unknown,
    outer?: AbortSignal,
  ): Promise<unknown> {
    const write = method !== "GET";
    const controller = new AbortController();
    const abort = () => controller.abort();
    if (outer?.aborted)
      throw new RequestError("Request cancelled.", "cancelled");
    outer?.addEventListener("abort", abort, { once: true });
    const timer = setTimeout(
      abort,
      write
        ? (options.writeTimeoutMs ?? 20_000)
        : (options.readTimeoutMs ?? 15_000),
    );
    try {
      const token = options.accessToken ? await options.accessToken() : null;
      if (controller.signal.aborted)
        throw new Error("Request aborted before sending.");
      const response = await fetcher(`${base}/api/items${path}`, {
        method,
        signal: controller.signal,
        headers: {
          Accept: "application/json",
          ...(body ? { "Content-Type": "application/json" } : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
        cache: "no-store",
      });
      if (!response.ok) {
        const status = response.status;
        let fields: FieldErrors | undefined;
        let serverMessage = "";
        try {
          const data = await response.json();
          serverMessage = typeof data.error === "string" ? data.error : "";
          if (data.fields && typeof data.fields === "object") {
            fields = {};
            for (const key of [
              "name",
              "category",
              "quantity",
              "price",
              "description",
              "minStockLevel",
            ] as const) {
              if (typeof data.fields[key] === "string")
                fields[key] = data.fields[key];
            }
          }
          // The existing Express API returns a single validation message.
          if (status === 400 && !fields && serverMessage) {
            const key = /min\.|minStock|minimum/i.test(serverMessage)
              ? "minStockLevel"
              : /quantity/i.test(serverMessage)
                ? "quantity"
                : /price/i.test(serverMessage)
                  ? "price"
                  : null;
            if (key) fields = { [key]: serverMessage };
          }
        } catch {
          /* The HTTP status still determines whether a write is uncertain. */
        }
        const retry = response.headers.get("Retry-After");
        const retryAfterMs = retry
          ? /^\d+$/.test(retry)
            ? Number(retry) * 1000
            : Math.max(0, Date.parse(retry) - Date.now())
          : undefined;
        const transient = [408, 429, 500, 502, 503, 504].includes(status);
        const kind = write
          ? status >= 500 || status === 408
            ? "unknown"
            : "rejected"
          : "read";
        const message =
          status === 401 || status === 403
            ? "Access was denied. Check your workspace access, then try again."
            : status === 429
              ? "Too many requests. Wait a moment before trying again."
              : status === 404
                ? "This item is no longer available. Refresh inventory to see the latest data."
                : status === 400 || status === 422
                  ? serverMessage ||
                    "Check the highlighted fields and try again."
                  : write
                    ? "We could not confirm the result. Check the latest inventory before sending again."
                    : "Inventory could not be loaded. Check your connection and try again.";
        throw new RequestError(message, kind, {
          status,
          transient,
          retryAfterMs: Number.isFinite(retryAfterMs)
            ? retryAfterMs
            : undefined,
          fields,
        });
      }
      if (response.status === 204) return null;
      try {
        return await response.json();
      } catch {
        throw new RequestError(
          write
            ? "The server replied, but the saved item could not be verified. Check its status."
            : "The server returned an unreadable response. Try again or contact the workspace owner.",
          write ? "unknown" : "read",
        );
      }
    } catch (error) {
      if (outer?.aborted)
        throw new RequestError("Request cancelled.", "cancelled");
      if (error instanceof RequestError) throw error;
      throw new RequestError(
        write
          ? "The connection ended before we could confirm the result. Your request may have reached the server."
          : "The request timed out or the connection was lost. Check your connection and try again.",
        write ? "unknown" : "read",
        { transient: true },
      );
    } finally {
      clearTimeout(timer);
      outer?.removeEventListener("abort", abort);
    }
  }
  return {
    async list(signal) {
      for (let attempt = 0; ; attempt++) {
        try {
          const data = await request("", "GET", undefined, signal);
          try {
            return decodeItems(data);
          } catch {
            throw new RequestError(
              "The server returned an invalid inventory list. Retry or contact the workspace owner.",
              "read",
            );
          }
        } catch (error) {
          const retryDelay =
            error instanceof RequestError
              ? (error.options.retryAfterMs ?? options.retryDelayMs ?? 750)
              : 0;
          // One bounded retry for transient reads. Long Retry-After values are handled by manual retry UI.
          if (
            attempt === 0 &&
            error instanceof RequestError &&
            error.options.transient &&
            retryDelay <= 5000
          ) {
            await delay(retryDelay, signal);
          } else throw error;
        }
      }
    },
    async write(operation: Operation): Promise<WriteResult> {
      const path =
        operation.kind === "reset"
          ? "/seed"
          : operation.kind === "create"
            ? ""
            : `/${encodeURIComponent(operation.id)}`;
      const method =
        operation.kind === "delete"
          ? "DELETE"
          : operation.kind === "update"
            ? "PUT"
            : "POST";
      const data = await request(
        path,
        method,
        "input" in operation ? operation.input : undefined,
      );
      if (operation.kind === "delete") return null;
      try {
        return operation.kind === "reset"
          ? decodeItems(data)
          : decodeItem(data);
      } catch {
        throw new RequestError(
          "The server replied, but its result could not be verified. Check the latest inventory before sending again.",
          "unknown",
        );
      }
    },
  };
}
