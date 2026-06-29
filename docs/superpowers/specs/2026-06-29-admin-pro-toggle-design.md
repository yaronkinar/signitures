# Admin Pro toggle — design

**Date:** 2026-06-29
**Status:** Approved, ready for implementation plan

## Summary

A paying customer's Pro status isn't reflected in the app (entitlements blob out of sync with reality — e.g. a Lemon Squeezy webhook was missed). There's currently no way to fix this short of manually editing Blob storage. Add a minimal `/admin` page, visible only to admins, that can:

- Toggle Pro on/off for a single customer, identified by email.
- Toggle a global "Pro for everyone" override, as a kill-switch independent of individual entitlements.

This builds directly on the entitlements system from [2026-06-20-monetization-payments-design.md](2026-06-20-monetization-payments-design.md) — no new storage system, no new auth provider.

## Decisions (locked)

| # | Decision |
|---|---|
| 1 | Admin access is granted via Clerk `publicMetadata.role === 'admin'` on the admin's own Clerk user, set manually via the Clerk Dashboard. No new env var, no Clerk Organizations. |
| 2 | The admin finds a customer by **email**, not tenant id. The server resolves email → Clerk user → tenant id using the exact same `resolveTenant()` logic the rest of the app already uses — never a hand-typed tenant id. |
| 3 | If no Clerk account exists for the given email, the endpoint returns 404 rather than guessing/creating a tenant id. |
| 4 | Per-customer toggle sets `pro.active` explicitly (`true`/`false` from the UI), not a blind toggle — avoids a mistaken double-click flipping state twice. |
| 5 | Global override is a separate Blob record, OR'd with each tenant's own `pro.active` at read time. Turning it off reverts everyone to their individual entitlement — nothing is destroyed. |
| 6 | No user/tenant listing UI, no bulk CSV import, no audit log. Single-customer lookup and a single global switch only. |

## Architecture

```
Browser (Vite SPA)
  /admin path (checked via window.location.pathname in main.tsx)
    → AdminPage (SignedIn/SignedOut from Clerk, same as rest of app)
       - per-customer form: email + Make Pro / Remove Pro
       - global section: Pro-for-everyone toggle, loads current state on mount

Vercel Functions (/api/*)
  requireAdmin(req)                      (new, api-src/auth.ts)
    → requireUser(req), then checks Clerk user's publicMetadata.role === 'admin'
  POST /api/admin/set-pro                → per-customer toggle
  GET  /api/admin/global-pro             → read global override state
  POST /api/admin/global-pro             → write global override state

Vercel Blob (private)
  entitlements/<tenantId>.json           (existing, unchanged shape)
  entitlements/_global-pro-override.json { active: boolean }   (new)
```

Key properties:

- Reuses `resolveTenant()` and `readEntitlements`/`writeEntitlements` from the existing entitlements module — the admin tool cannot drift from how tenants are computed elsewhere.
- The global override never mutates per-tenant files. It's a second, independent signal that's OR'd in only at the point where Pro status is read (`GET /api/entitlements`), so disabling it is always safe and instant.

## Backend (Vercel Functions)

**`api-src/auth.ts` changes:**
- `AuthError` gains an optional `status` constructor param (default `401`), so we can throw 403 for "signed in but not an admin."
- New: `requireAdmin(req: VercelRequest): Promise<AuthedUser>`
  ```ts
  export const requireAdmin = async (req: VercelRequest): Promise<AuthedUser> => {
    const user = await requireUser(req)
    const clerk = getClerk()
    const clerkUser = await clerk.users.getUser(user.userId)
    if (clerkUser.publicMetadata?.role !== 'admin') {
      throw new AuthError('Forbidden', 403)
    }
    return user
  }
  ```

**`api-src/entitlements.ts` changes:**
- New path helper: `const globalProOverridePath = 'entitlements/_global-pro-override.json'`
- New: `readGlobalProOverride(): Promise<{ active: boolean }>` — same try/get/parse/default pattern as `readEntitlements`, defaulting to `{ active: false }` on missing/invalid blob.
- New: `writeGlobalProOverride(active: boolean): Promise<void>` — same `put` pattern as `writeEntitlements`.

**`api-src/entitlements-get.ts` changes:**
- After `readEntitlements(tenant.id)`, also call `readGlobalProOverride()`.
- `tier: (isPro(entitlements) || globalOverride.active) ? 'pro' : 'free'`.

**New: `api-src/admin-set-pro.ts`** → bundled to `/api/admin/set-pro`
- `POST { email: string; active: boolean }`
- `requireAdmin(req)`.
- `clerk.users.getUserList({ emailAddress: [email] })` → if empty, `404 { error: 'No account found for that email' }`.
- Take the first matching Clerk user; build `{ userId, email }`, call `resolveTenant()` to get `tenantId`.
- `readEntitlements(tenantId)`, set `pro.active = active` (leave `subscriptionId`/`renewsAt` as-is), `writeEntitlements`.
- Respond `{ tenantId, email, active }`.

**New: `api-src/admin-global-pro.ts`** → bundled to `/api/admin/global-pro`
- `requireAdmin(req)` for both methods.
- `GET` → `readGlobalProOverride()` → `{ active }`.
- `POST { active: boolean }` → `writeGlobalProOverride(active)` → `{ active }`.
- Any other method → `405`.

**`scripts/bundle-api.mjs` changes:** add two entries —
```js
['api-src/admin-set-pro.ts', 'api/admin/set-pro.js'],
['api-src/admin-global-pro.ts', 'api/admin/global-pro.js']
```

**Setup step (manual, not code):** the admin marks their own Clerk user as admin via Clerk Dashboard → Users → select user → Metadata → public metadata: `{"role": "admin"}`.

## Frontend

**`src/main.tsx` changes:**
- Before rendering `AuthGate`, check `window.location.pathname === '/admin'`. If so, render a new `AdminGate` (Clerk provider + `SignedIn`/`SignedOut`, mirroring `AuthGate`'s shape but pointing at `AdminPage` instead of `App`) rather than the normal app.

**New: `src/components/AdminPage.tsx`**
- `SignedOut`: a sign-in prompt (reuses `SignInModal` or a plain Clerk `<SignIn>`, since this page has no existing designer UI to protect mid-session).
- `SignedIn`: two sections —
  1. **Per-customer toggle**: email `TextInput` + "Make Pro" / "Remove Pro" buttons. On click, `useAuth().getToken()` → `POST /api/admin/set-pro` with `{ email, active }`. Shows the response (`tenantId`/`email`/`active`) or the error (403 "not an admin", 404 "no account found").
  2. **Global override**: on mount, `GET /api/admin/global-pro` to show current state; a single toggle switch that `POST`s the new state and reflects the response.
- No new CSS investment — reuses existing `Field`/`TextInput`/button classes; this is an internal tool, not customer-facing.

## Edge cases

| Case | Behavior |
|---|---|
| Admin enters an email with no Clerk account | `404`, shown as "No account found for that email — ask them to sign in once first," since a tenant id can't be computed for a free-email-domain user without a `userId`. |
| Non-admin (signed in, no `role: admin` metadata) visits `/admin` | Page loads (Clerk doesn't gate the route itself), but any API call returns `403`; the UI shows "You don't have admin access." |
| Signed-out visitor hits `/admin` | Sees the sign-in prompt, same as any other Clerk-gated action elsewhere in the app. |
| Two admins toggle the same customer/global flag concurrently | Last write wins — same as the existing webhook/entitlements Blob pattern; no locking, consistent with how the rest of the system already works. |
| Global override is on, then turned off | Tenants revert immediately to their individual `pro.active` value on their next `GET /api/entitlements` call — no per-tenant cleanup needed since the override never touched per-tenant files. |
| Corporate-domain email entered for per-customer toggle | Works the same as any other email — `resolveTenant` computes `domain:<domain>`, so it also affects every other user on that domain, matching existing Pro-is-per-tenant semantics. |

## Rollout

1. Add `requireAdmin` + `AuthError` status param to `auth.ts`. Verify: a non-admin signed-in user calling a stub endpoint gets 403; an admin (manually flagged via Clerk Dashboard) gets through.
2. Add `readGlobalProOverride`/`writeGlobalProOverride` to `entitlements.ts`; wire into `entitlements-get.ts`. Verify: with no override blob present, behavior is unchanged from today.
3. Add `admin-set-pro.ts` and `admin-global-pro.ts`, register both in `bundle-api.mjs`. Verify each with `curl` (401 signed-out, 403 non-admin, 404 unknown email, 200 success) before touching the UI.
4. Add `/admin` path check in `main.tsx` + `AdminPage.tsx`. Verify end-to-end: toggle a real test customer's Pro on, confirm `GET /api/entitlements` reflects it for that customer; toggle the global override on, confirm a *different*, non-Pro customer also now reads `tier: 'pro'`; toggle both back off.

## Verification

- `curl -X POST /api/admin/set-pro` without `Authorization` → `401`.
- Same call with a valid token for a non-admin user → `403`.
- Mark that user as admin in Clerk Dashboard, retry → `200`, and the target customer's `entitlements/<tenantId>.json` Blob reflects the new `pro.active`.
- `curl -X POST /api/admin/set-pro` with an email that has no Clerk account → `404`.
- `GET /api/admin/global-pro` → toggle via `POST` → a second tenant's `GET /api/entitlements` (no individual Pro) now returns `tier: 'pro'`; toggle off → reverts.
- `npm run build` succeeds; `npm test` passes; new Vitest coverage for `requireAdmin`, `readGlobalProOverride`/`writeGlobalProOverride`, and the two new endpoint handlers, following the existing style in `api-src/auth.test.ts` and `api-src/entitlements.test.ts`.

## Out of scope for v1

- User/tenant listing or search UI.
- Audit log of admin actions.
- Bulk import / CSV-based toggling.
- Managing admin roles from within the app (stays a manual Clerk Dashboard step).
- Notifying the customer when their Pro status changes.
