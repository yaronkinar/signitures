# Monetization & payments — design

**Date:** 2026-06-20
**Status:** Approved, ready for implementation plan

## Summary

Add a paywall and a paid tier to the signature-builder app, on top of the existing Clerk multi-tenant auth ([2026-06-14-multi-tenant-login-design.md](2026-06-14-multi-tenant-login-design.md)).

- Free tier: unlimited designing/previewing. Exporting a finished signature (copy HTML, download HTML/PNG, install to Outlook/new Outlook) requires payment.
- Pay-per-download: $1.99 one-time purchase unlocks a specific saved signature for unlimited free re-downloads/re-exports afterward.
- Pro subscription: $29/month, billed per **tenant** (company domain — same tenant concept used for cloud storage), not per user. Unlocks unlimited downloads for everyone on that tenant, plus three features that stay Pro-only regardless of one-time payments: AI Design Assistant, cloud save/sync, and bulk signature generation.
- No free trial.
- Payment provider: Lemon Squeezy (Merchant of Record — supports Israel-based sellers directly, no monthly fee, pay-per-transaction only, Apple Pay/Google Pay/cards supported).
- Config exports (Export Params / Export Style JSON) stay free — they're editing-state backups, not the finished deliverable.

## Decisions (locked)

| # | Decision |
|---|---|
| 1 | Monetization model: freemium — free design, paid export. |
| 2 | Paid path A: pay-per-download, $1.99, one-time, scoped to a single saved signature, unlocks unlimited re-downloads of that signature. |
| 3 | Paid path B: Pro subscription, $29/month, scoped to the tenant (company domain), unlocks unlimited downloads + AI design + cloud save + bulk generation. |
| 4 | Billing entity is the tenant (`domain:acme.com` or `user:<id>` for free-email domains), matching the existing tenant model — not per-user. |
| 5 | No free trial for Pro. |
| 6 | Provider: Lemon Squeezy, chosen because Stripe does not support Israel-based merchant payouts without a foreign entity. |
| 7 | No watermark/branding is injected into exported signature HTML. "Remove branding" is not a feature. |
| 8 | Single Pro tier only — no separate "Team" tier in v1. |

## Architecture

```
Browser (Vite SPA, React 19)
  useEntitlements()  → GET /api/entitlements on auth → { tier, unlockedSignatureIds }
  Gated actions (copy/download/install) check entitlements before running;
    if blocked, open PaywallModal → POST /api/entitlements/checkout → Lemon.js Overlay

Vercel Functions (/api/*)
  requireUser(req) + resolveTenant(user)        (existing, from api-src/auth.ts)
  GET  /api/entitlements              → reads entitlements/<tenantId>.json
  POST /api/entitlements/checkout     → creates a Lemon Squeezy checkout, embeds
                                         { tenantId, userId, signatureId? } as custom_data
  POST /api/webhooks/lemonsqueezy     → verifies signature, reads custom_data back,
                                         updates entitlements/<tenantId>.json

Vercel Blob (private)
  entitlements/<tenantId>.json   { version: 1, pro: {...}, unlockedSignatureIds: [...] }
```

Key properties:

- Entitlements are derived from the same `tenant.id` as cloud signature storage — no new identity concept.
- The client never marks itself as paid. Every gated server endpoint re-reads `entitlements/<tenantId>.json` itself.
- Lemon Squeezy is the source of truth for payment state; our blob file is a cache updated only by the webhook, never written directly by client requests.
- `signatureId` for pay-per-download is a client-generated UUID (same scheme as the existing local `saveSignatureAs` — see `src/lib/savedSignatures.ts`), assigned the first time a free-tier user tries to export an unsaved signature. We only ever store the *id*, never the signature content, server-side for free users.

## Backend (Vercel Functions)

**New shared module: `api-src/entitlements.ts`**

```ts
export type Entitlements = {
  version: 1
  pro: { active: boolean; subscriptionId?: string; renewsAt?: number }
  unlockedSignatureIds: string[]
}

export async function readEntitlements(tenantId: string): Promise<Entitlements>
export async function writeEntitlements(tenantId: string, next: Entitlements): Promise<void>
export function isPro(entitlements: Entitlements): boolean
```

Follows the exact blob read/write pattern already in `api-src/signatureBlobShared.ts` (`readManifest`/`writeManifest`), just a different path (`entitlements/<tenantId>.json`) and shape. Missing file = `{ version: 1, pro: { active: false }, unlockedSignatureIds: [] }`.

**`GET /api/entitlements`** (`api-src/entitlements-get.ts`)
- `requireUser` → `resolveTenant` → `readEntitlements(tenant.id)` → respond `{ tier: isPro ? 'pro' : 'free', unlockedSignatureIds }`.

**`POST /api/entitlements/checkout`** (`api-src/entitlements-checkout.ts`)
- Body: `{ kind: 'download'; signatureId: string } | { kind: 'pro' }`.
- `requireUser` → `resolveTenant`.
- Calls Lemon Squeezy's Checkouts API (`POST https://api.lemonsqueezy.com/v1/checkouts`) with the store id and the relevant variant id (`LEMONSQUEEZY_VARIANT_ID_DOWNLOAD` or `LEMONSQUEEZY_VARIANT_ID_PRO`), setting `attributes.checkout_data.custom = { tenantId: tenant.id, userId: user.userId, signatureId? }` and `attributes.product_options.enabled_variants`.
- Responds `{ checkoutUrl }`.

**`POST /api/webhooks/lemonsqueezy`** (`api-src/webhooks-lemonsqueezy.ts`)
- Verifies the `X-Signature` header (HMAC-SHA256 over the raw body using `LEMONSQUEEZY_WEBHOOK_SECRET`) — reject with 400 on mismatch. This endpoint needs the raw request body, so it must be excluded from any JSON body-parsing the other handlers rely on (check how `vercel.json` / `@vercel/node` parses bodies; use `req.body` only after verifying against the raw bytes, or read the raw stream directly if `@vercel/node` doesn't expose it).
- Reads `event_name` from the payload and `meta.custom_data` for `{ tenantId, signatureId }`.
- `order_created` (one-time download purchase) → `readEntitlements(tenantId)`, push `signatureId` into `unlockedSignatureIds` (dedup), `writeEntitlements`.
- `subscription_created` / `subscription_payment_success` → set `pro.active = true`, store `subscriptionId`/`renewsAt`.
- `subscription_cancelled` / `subscription_expired` / `subscription_payment_failed` → set `pro.active = false`.
- Unrecognized events: `200 OK` no-op (Lemon Squeezy retries on non-2xx).

**Existing endpoints gain entitlement checks:**
- `api-src/design-signature.ts` — after `requireUser`, add `resolveTenant` + `readEntitlements`; if not Pro, `403` with a body the client maps to "Upgrade to Pro".
- `api-src/signatures.ts` / `signatures-download.ts` (cloud save) — same addition; cloud storage becomes Pro-gated rather than purely "is Blob configured."

**New env vars** (`.env.example`, Vercel project settings):
```
LEMONSQUEEZY_API_KEY=
LEMONSQUEEZY_STORE_ID=
LEMONSQUEEZY_VARIANT_ID_DOWNLOAD=
LEMONSQUEEZY_VARIANT_ID_PRO=
LEMONSQUEEZY_WEBHOOK_SECRET=
```

## Frontend

**New dependency:** none required — Lemon Squeezy's overlay checkout is a small `<script src="https://app.lemonsqueezy.com/js/lemon.js">` loaded once, plus `window.createLemonSqueezy()` / `window.LemonSqueezy.Url.Open(url)`.

**New: `src/hooks/useEntitlements.ts`**
- Fetches `GET /api/entitlements` (via the existing authed-fetch pattern in `src/lib/cloudSignatures.ts`) once the user is signed in; exposes `{ tier, isPro, unlockedSignatureIds, refresh }`.
- `refresh()` is called after a checkout completes, polling every ~1.5s up to ~10s until the webhook has processed and the new state is visible (Lemon Squeezy webhooks typically land in a few seconds, but the UI must not assume instant consistency).

**New: `src/components/PaywallModal.tsx`**
- Two states depending on context: "Unlock this signature — $1.99" (download path) or "Upgrade to Pro — $29/mo" (AI/cloud/bulk paths), each opening the Lemon Squeezy overlay via a URL from `POST /api/entitlements/checkout`.
- On the overlay's success callback, shows a brief "Finalizing payment…" spinner while `useEntitlements().refresh()` polls, then closes and lets the originally-attempted action proceed.

**Gating the export actions in `src/hooks/useSignatureApp.ts`:**
- `copyOutput`, `handleDownload`, `handleDownloadPng`, `handleInstallOutlook` (the install wizard's `confirmInstallDownload`/`confirmInstallSaveAs`), `handleInstallNewOutlook` all route through a new `ensureExportUnlocked()` helper:
  1. If `isPro` → proceed immediately.
  2. Else, ensure the current form has a saved-signature id (if `activeSavedId` is empty, silently call the existing local `saveSignatureAs` to mint one — reuses `src/lib/savedSignatures.ts`, no new storage mechanism).
  3. If that id is in `unlockedSignatureIds` → proceed.
  4. Else → open `PaywallModal` in download mode for that id; resume the original action only after unlock is confirmed.

**Gating AI / cloud / bulk:**
- `panel-ai` (AI Design Assistant) — when `!isPro`, the brief/buttons render in a locked state with an "Upgrade to Pro" CTA opening `PaywallModal` in Pro mode, instead of calling `runAiDesign`.
- Cloud save UI (`cloudStorageAvailable` flag, `form-storage-bar` in `App.tsx`) — becomes `cloudStorageAvailable && isPro`; non-Pro users keep local-only saves exactly as today (this part of the UX doesn't change for free users, it just stops being unlockable by Blob config alone).
- `BulkSignaturesPanel.tsx` — client-side `isPro` check before generation/export; locked state with the same upgrade CTA otherwise. No backend change needed since bulk has no server endpoint today.

**UI indicators:** small "Pro" badge / "Upgrade" entry point in `UserMenu.tsx` showing current tier, opening `PaywallModal` in Pro mode.

## Payment flows

**Happy path — free user downloads a signature:**
1. Designs a signature, clicks "Download HTML."
2. `ensureExportUnlocked()` finds no `activeSavedId` → silently saves locally, mints a UUID.
3. UUID isn't in `unlockedSignatureIds` → `PaywallModal` opens in download mode → `POST /api/entitlements/checkout` with `{ kind: 'download', signatureId }` → Lemon.js Overlay opens with the returned checkout URL.
4. User pays $1.99 via card/Apple Pay/Google Pay.
5. Lemon Squeezy fires `order_created` → our webhook reads `custom_data.signatureId`, adds it to `entitlements/<tenantId>.json`.
6. Overlay's success callback fires client-side → `useEntitlements().refresh()` polls until the id appears → modal closes → the original "Download HTML" action runs.
7. Future downloads of the same saved signature (even after edits) skip straight to step 1 succeeding at step 3's check.

**Happy path — company subscribes to Pro:**
1. Someone at `acme.com` clicks "Upgrade to Pro" anywhere in the app.
2. `POST /api/entitlements/checkout` with `{ kind: 'pro' }` → checkout's `custom_data.tenantId = 'domain:acme.com'`.
3. Pays $29/month → Lemon Squeezy fires `subscription_created` → webhook sets `pro.active = true` on `entitlements/domain:acme.com.json`.
4. Every teammate at `acme.com` immediately sees Pro features unlocked on their next `GET /api/entitlements` call — no per-user action needed.

## Edge cases

| Case | Behavior |
|---|---|
| Webhook arrives before the user's poll starts, or after it times out | Polling gives up after ~10s and shows "Payment received — refresh to continue" with a manual retry button, in case of unusual webhook delay. |
| User pays for a download, then edits the signature further | Still unlocked — the unlock is keyed by saved-signature id, not by content hash. Editing without "Save As" (same id) stays unlocked; explicit "Save As" under a new name mints a new id and is **not** unlocked. |
| Tenant's Pro subscription lapses (payment failure) | `subscription_payment_failed`/`subscription_expired` flips `pro.active = false`. Previously-Pro-only saved cloud signatures remain in Blob storage but become inaccessible until Pro is reactivated (same `isBlobConfigured && isPro` gate used for reads). Already-unlocked pay-per-download signatures stay unlocked regardless (separate field). |
| Webhook signature invalid / replay | Reject with 400, log, no entitlement change. |
| Two browser tabs, one just paid | The other tab's stale `unlockedSignatureIds` is refreshed on its next `ensureExportUnlocked()` call (always re-fetches if the local check fails), so a stale cache never blocks a legitimately-paid export. |
| Free-email domain tenant (`user:<id>`) buys Pro | Works identically — Pro is just keyed by whatever `tenant.id` is, individual or domain. |
| Bulk generation gate is client-side only | Accepted limitation: bulk has no backend cost today (purely client-side), so there's nothing sensitive to protect server-side. Matches the trust model of the rest of the free-tier app. |

## Rollout

1. Add Lemon Squeezy store + two variants (one-time "Signature Download" $1.99, subscription "Pro" $29/mo) in the Lemon Squeezy dashboard; capture `LEMONSQUEEZY_STORE_ID` and variant ids.
2. Add `api-src/entitlements.ts` (read/write helpers) + `entitlements/<tenantId>.json` convention. Not yet referenced by any handler.
3. Add `GET /api/entitlements` and wire `useEntitlements()` client-side (always returns free tier — no checkout yet). Verify the hook works end-to-end.
4. Add `POST /api/entitlements/checkout` + `PaywallModal` + Lemon.js overlay integration. Verify a manual checkout completes and lands in Lemon Squeezy's dashboard (webhook not yet wired, so entitlements won't update yet).
5. Add `POST /api/webhooks/lemonsqueezy`, register the webhook URL in the Lemon Squeezy dashboard, verify signature checking against a real test-mode event.
6. Wire `ensureExportUnlocked()` into the five export call-sites in `useSignatureApp.ts`. Verify the full pay-per-download loop in Lemon Squeezy test mode.
7. Add Pro gating to `design-signature.ts`, `signatures.ts`/`signatures-download.ts`, the AI panel, cloud-save UI, and `BulkSignaturesPanel.tsx`. Verify the full Pro subscription loop in test mode.
8. Add the Pro/Upgrade UI entry point in `UserMenu.tsx`.
9. Switch Lemon Squeezy store from test mode to live, set real env vars in Vercel production.

## Verification

- `curl /api/entitlements` without `Authorization` → `401` (same pattern as existing endpoints).
- Test-mode checkout for a download → webhook test event → `entitlements/<tenantId>.json` gains the signature id → re-running the originally blocked download succeeds without a second payment.
- Test-mode subscription checkout → webhook test event → `design-signature` and `signatures` endpoints stop returning 403 for that tenant.
- Cancel the test subscription → webhook event → Pro features lock again on next load.
- `npm run build` succeeds; `npm test` passes; new Vitest coverage for `api-src/entitlements.ts` (read/write/default-shape) and the webhook's signature verification, following the existing test style in `api-src/signatureBlobShared.test.ts` and `api-src/auth.test.ts`.

## Out of scope for v1

- Team tier / multiple paid tiers.
- Free trial.
- Branding/watermark on free-tier exports.
- Refunds/dispute handling beyond Lemon Squeezy's own dashboard tools.
- Usage analytics/dashboards for revenue (Lemon Squeezy's dashboard covers this for v1).
- Annual billing option (monthly only for v1).
- Configurable pricing UI (prices are fixed at the variant level in Lemon Squeezy's dashboard, not in app code).
