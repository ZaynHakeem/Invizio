# Invizio redesign implementation handoff

## Scope and defaults

The original inventory purpose and item fields remain intact: `id`, `sku`, `name`, `category`, `quantity`, `price`, `description`, `minStockLevel`, `updatedAt`. The backend still generates SKU and ID on create; the front end displays SKU read-only. The three state-driven views remain Overview (`dashboard`), Inventory, and Alerts. No router or backend authentication was introduced.

The initial appearance preference is **System**. An explicit Light or Dark choice is stored under `invizio-theme`. The boot script applies it before React mounts. A system-preference change only changes CSS variables, so view, filters, open drafts, and in-flight operations are retained. The product owner can select a shipping default later; if changing it, update both the boot script and `useTheme` together, preserving existing explicit choices.

## Theme mapping

Layout, borders, spacing, radii, type, and component structure are identical in both themes. Only tokens change. Navigation and the auth introduction use porcelain in Light.

| Token                    | Light                 | Dark                  |
| ------------------------ | --------------------- | --------------------- |
| `--accent`               | `#0F766E`             | `#0F766E`             |
| `--on-accent`            | `#FFFFFF`             | `#FFFFFF`             |
| `--bg`                   | `#F4F7F5`             | `#101B22`             |
| `--paper`                | `#FFFFFF`             | `#192931`             |
| `--nav`                  | `#F4F7F5`             | `#12232D`             |
| `--nav-border`           | `#182A35`             | `#34464D`             |
| `--ink`                  | `#182A35`             | `#EAF1F4`             |
| `--muted`                | `#586775`             | `#ACBDC6`             |
| `--line`                 | `#DCE4E2`             | `#34464D`             |
| `--field`                | `#798C84`             | `#879A92`             |
| `--action-border`        | `#0F766E`             | `#CCDCD5`             |
| `--red` / `--red-bg`     | `#B42318` / `#FFF0EE` | `#FFB5AB` / `#442B2B` |
| `--amber` / `--amber-bg` | `#92400E` / `#FFF5E6` | `#F7CF8C` / `#423626` |
| `--green` / `--green-bg` | `#216247` / `#EAF5EF` | `#9DD6B5` / `#203A31` |

All primary buttons have a 2px border in both themes. Dark uses the light boundary token because the teal fill alone does not provide sufficient contrast against dark surfaces. Text links use `--link`: teal in Light and light ink in Dark. The action fill remains the exact same teal.

Measured contrast pairs from the actual CSS:

| Pair                               | Light   | Dark    |
| ---------------------------------- | ------- | ------- |
| Main text / page                   | 13.70:1 | 15.30:1 |
| Muted text / page                  | 5.39:1  | 9.03:1  |
| Muted text / card                  | 5.81:1  | 7.73:1  |
| White label / teal action          | 5.47:1  | 5.47:1  |
| Red label / red status surface     | 5.93:1  | 7.66:1  |
| Amber label / amber status surface | 6.57:1  | 7.98:1  |
| Green label / green status surface | 6.48:1  | 7.43:1  |
| Input boundary / card              | 3.56:1  | 5.04:1  |
| Primary boundary / card            | 5.47:1  | 10.53:1 |

These are token calculations, not a substitute for real-browser accessibility review. Status always has an icon and text. Focus outlines, explicit form labels, skip navigation, native dialog modality, keyboard suggestions, reduced-motion treatment, and mobile touch targets are implemented.

## Inventory state contract

`InventoryStore` keeps `snapshot: null | { items, receivedAt }` separately from load state and errors. Only a schema-valid successful list response creates a snapshot. `[]` is valid; objects, null, invalid item fields, invalid dates, duplicate IDs, and malformed JSON are errors. Zero is never substituted for unknown counts.

| Situation                                                                     | Visible result                                                            | Recovery                                |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------- | --------------------------------------- |
| First read is pending                                                         | Shell and skeleton; no invented totals                                    | Wait for bounded read attempt(s)        |
| First read returns valid `[]`                                                 | Empty inventory; first-item action; zero totals                           | Add an item                             |
| First read fails or is malformed                                              | Load-error panel; unknown dashboard totals; alerts unavailable            | Retry reads only                        |
| Read succeeds with items                                                      | Actual counts, values, stock status                                       | Normal use                              |
| Refresh fails with a prior snapshot                                           | Retain every prior item, filters, and last-update time; stale banner      | Retry reads only                        |
| Refresh fails after an empty snapshot                                         | “No items in your last update”                                            | Retry to verify current inventory       |
| Cached inventory has no alerts, refresh fails                                 | “No alerts in your last update”                                           | Never claim “All stocked” on stale data |
| Known save rejection                                                          | Draft stays open; specific field/form error                               | Correct the draft and explicitly submit |
| Write timeout, dropped reply, ambiguous server error, or invalid success body | Outcome unknown; draft retained; repeat writes blocked                    | Check status; no automatic write retry  |
| Confirmed save, subsequent refresh failure                                    | Form closes; success feedback; returned data stays visible; stale warning | Retry GET only                          |
| Offline                                                                       | Connection message; draft retained; writes disabled                       | Reconnect; no hidden queue              |

**All stocked** is shown only for a fresh successful snapshot with at least one item and zero low/out items. An empty workspace instead explains how to begin monitoring. Alert badges are calculated from the entire inventory, independently of search or filters.

### Stock rules

- `quantity === 0`: out of stock, including when minimum is zero.
- `0 < quantity <= minStockLevel`: low stock.
- `quantity > minStockLevel`: in stock.
- Out-of-stock items appear first in Alerts and the overview attention list.

## Request and write recovery

The HTTP repository consumes the existing `/api/items` endpoints; no new endpoint is required.

- Each read has a **15-second** timeout. Transient network failures and HTTP 408/429/500/502/503/504 get at most **one** automatic retry, normally after 750ms. Validation/access errors and malformed data are not automatically retried.
- `Retry-After` is honored. Values over five seconds produce a manual retry cooldown rather than keeping a long automatic retry pending. Mutation cooldowns also block early resubmission.
- Writes have a **20-second** timeout and are **never automatically retried**. After eight seconds the form indicates that the request is taking longer.
- Aborting a client request does not imply the server rolled it back. Network loss, timeout, HTTP 408/5xx, and malformed 2xx write bodies remain uncertain.
- New reads invalidate older reads. Starting a write invalidates any outstanding read, so an old response cannot overwrite a confirmed change.
- Successful POST/PUT responses update their returned item locally; DELETE 204 removes the item; successful seed responses replace the snapshot. A separate follow-up read owns its own error state.

### Resolving an uncertain write

**Update:** reload the list, locate the known ID, and compare all submitted fields. If they match, report that the current item matches the requested changes. This verifies the current state; it does not claim forensic proof of which request produced it. If different or missing, show the current details and require review before another submission.

**Delete:** reload the list and check the known ID. Absence resolves the desired state. If still present, require review and a new destructive confirmation before retrying.

**Create:** the existing server generates ID and SKU. Matching fields cannot uniquely prove a particular POST succeeded. Show possible matches, keep repeat submission blocked, and require explicit acknowledgment of duplicate risk before allowing the user to return to the form and send again. No match is not proof that a delayed request cannot still complete.

**Factory reset:** a failed reset may have partially deleted/inserted data. A fresh read is shown for review; it never automatically proves reset success. Retrying requires explicit review and typing `RESET` again.

An uncertain-request dialog can be closed without losing its draft. A persistent banner reopens it; other writes remain blocked. Browser navigation/reload warns while a draft or pending operation exists. Drafts and pending state are in memory, not durably persisted across a forced reload.

A future backend idempotency key is required to guarantee duplicate-free retries of creates. A transaction for the reset endpoint and uniqueness/concurrency rules for IDs/SKUs remain backend work; this redesign does not silently claim those guarantees.

## Demo and Preview selector

`createDemoRepository` starts from the existing four sample items and never uses fetch. It implements the same repository contract as the HTTP adapter. The default totals are four items, 99 units, $828.66, one low-stock item, and one out-of-stock item.

Changing Preview state starts fresh sample data. The selector is disabled while an item/confirmation dialog or unresolved operation exists. It is absent from connected inventory.

- **Loaded inventory:** normal sample inventory.
- **Successful empty inventory:** a successful empty response.
- **All stocked:** nonempty inventory above all thresholds.
- **Initial loading:** an intentionally pending read; choose another state to leave.
- **Initial load failure:** no successful snapshot.
- **Malformed response:** invalid-response error; never empty data.
- **Refresh failure:** first load succeeds, refresh fails, items remain.
- **Save timeout:** a demo write happens, but its reply is lost. Edit to exercise ID reconciliation; create to exercise potential-match review; delete/reset to inspect their distinct confirmation paths.
- **Confirmed save · refresh failure:** submit a change; success remains success while the refresh warning appears.

These scenarios are deterministic and are not real API error injection. The HTTP tests separately verify network/status/schema behavior with mocked fetch responses.

## Auth integration boundary

`src/auth/adapter.ts` defines sign-in, sign-up, recovery, sign-out, and a session containing an email and access token. The supplied adapter is explicitly unconfigured and rejects account submissions with clear copy. No password is persisted, no fake account/session is generated, and no reset-email success is invented.

To integrate MongoDB-backed accounts or Supabase:

1. Replace the adapter implementation with the chosen provider and mark it configured.
2. Return a real session, or a genuine verification-required signup result. The HTTP repository accepts an access-token callback; attach refresh/session restoration as appropriate to the provider.
3. Implement and verify authentication and item ownership on the server (or corresponding Supabase policies). The frontend token header alone does not protect any existing route.
4. Remove the temporary connected-workspace entry. It exists only behind `VITE_ENABLE_API_WORKSPACE=true` for local use of the existing unauthenticated API.
5. Test expiry, recovery, verification, logout, rejected access, and per-user isolation end to end.

Only appearance is written to localStorage. SessionStorage stores the once-per-tab splash marker. Demo inventory, form drafts, and the placeholder auth values remain in memory.

## Validation completed

- **31 passing tests:** schema/stock boundaries, read retries/timeouts/cancellation/cooldowns, write ambiguity and inline errors, stale snapshot preservation, write-success/read-failure separation, response races, uncertain create/update/delete/reset reconciliation, correct empty/healthy wording, and navigation counts.
- DOM interactions cover account-preview validation, preserved drafts through theme changes, description create/edit, preview error vs empty, reopening and resolving a timed-out edit, confirmed-save/failed-refresh feedback, named deletion, and typed reset confirmation.
- Strict TypeScript checks pass for frontend and unchanged server.
- Production Vite build succeeds. The Recharts module is loaded separately when the dashboard needs it; its footprint does not block the account entry screen. Chart space is reserved; category values are also available as accessible text.
- Semantic foreground/background and control-boundary contrast values were measured from the implemented tokens.
- No live inventory API or MongoDB database was mutated for these checks.

Happy DOM does not compute actual page layout. Recharts emits dimension warnings in this simulated environment; the assertions exercise workflow/state behavior, not chart geometry. That limitation is deliberately not treated as a successful visual audit.

## Deferred browser QA

The product owner explicitly deferred this pass. Before shipping, review both themes at 320/390/768/1024/1440px, including long names and many items:

- Confirm porcelain fills the entire light shell and the dark teal button boundary is clearly visible.
- Confirm no horizontal overflow, usable mobile cards/bottom navigation, and keyboard-visible focus through all screens.
- Check native dialog focus trapping/restoration, Escape/backdrop handling, dirty-close confirmation, suspended-request reopening, and mobile keyboard interaction with the sticky footer.
- Confirm mobile-only splash and once-per-tab behavior. It ends after the shell is ready; no arbitrary minimum delay was introduced.
- Check chart sizing and keyboard/text alternatives, reduced motion, zoom/reflow, and a screen reader's announcement of loading, errors, toasts, and suggestion selection.
- Run the Preview states and test a real staging API with throttling, aborted replies, rejected writes, and CORS/auth failures.
- Connect accounts and server-side data ownership before private-user release. Select the desired shipping theme default after visual review.
