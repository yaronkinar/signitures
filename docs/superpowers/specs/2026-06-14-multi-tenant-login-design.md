# Multi-tenant login — design

**Date:** 2026-06-14
**Status:** Approved, ready for implementation plan

## Summary

Add login to the signature-builder app and convert cloud storage from anonymous `workspaceId` to an authenticated, per-tenant model.

- Tenant = email domain. Everyone at `acme.com` shares one tenant. Free-email domains (gmail, outlook, etc.) get a personal tenant of one.
- Sign-in providers: Google and Microsoft (social only).
- Login is required for the entire app — there is no anonymous mode.
- Flat roles inside a tenant: every member can view, create, edit, and delete every signature in the tenant.
- Existing anonymous cloud data is dropped; old blobs become orphans.
- Auth stack: Clerk via the Vercel Marketplace integration. We do not use Clerk Organizations — tenancy is derived from the verified email domain.

## Decisions (locked)

| # | Decision |
|---|---|
| 1 | Tenant model: per-organization (one tenant per email domain). |
| 2 | Sign-in: social only — Google + Microsoft. |
| 3 | Org assignment: email-domain auto-join. Free-email domains fall through to a per-user tenant. |
| 4 | Login is required to use the app at all. |
| 5 | Existing `workspaces/<uuid>/...` blob data is abandoned. No migration. |
| 6 | Flat roles. No admin/member distinction in v1. |
| 7 | Provider: Clerk via Vercel Marketplace. Identity only — Clerk Organizations is not used. |

## Architecture

```
Browser (Vite SPA, React 19)
  <ClerkProvider>
    <SignedOut>  → <SignInScreen />          (Google + Microsoft)
    <SignedIn>   → current designer UI + <UserButton />
  Every cloud call attaches Authorization: Bearer <Clerk JWT>

Vercel Functions (/api/*)
  requireUser(req)       → verifies JWT via @clerk/backend → { userId, email }
  resolveTenant(email)   → { id: "domain:acme.com" } or { id: "user:<userId>" }
  Existing handler logic, with tenant.id replacing the old workspaceId.

Vercel Blob (private)
  signatures/tenants/<tenantId>/manifest.json
  signatures/tenants/<tenantId>/<saveId>.zip
```

Key properties:

- Clerk owns identity and session. No user table in our code.
- Tenancy is **derived, not stored.** The verified email in the JWT *is* the source of truth.
- The client never sends a tenant identifier. The old `workspaceId` parameter is removed from every request.
- Blob layout is reorganized under `signatures/tenants/<tenantId>/...`. Old `signatures/workspaces/<uuid>/...` blobs are abandoned.

## Frontend

**New dependency:** `@clerk/clerk-react`.

**Changes:**

- `src/main.tsx` — wrap `<App />` in `<ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}>`.
- `src/App.tsx` — wrap the root in Clerk gate components:
  ```tsx
  <SignedOut><SignInScreen /></SignedOut>
  <SignedIn><CurrentApp /></SignedIn>
  ```
  When signed out, the entire designer is replaced by a centered sign-in card.
- `src/components/SignInScreen.tsx` (new) — hosts Clerk's `<SignIn>` with appearance overrides matching the app theme.
- `src/components/UserMenu.tsx` (new) — drops Clerk's `<UserButton />` into the app header.
- `src/lib/apiClient.ts` (new) — `fetch` wrapper that calls `useAuth().getToken()`, attaches `Authorization: Bearer <token>`, and never sends `workspaceId`. Every existing cloud call-site (`/api/signatures`, `/api/signatures/<id>`, `/api/design-signature`) migrates to it.
- Remove all `workspaceId` plumbing: the localStorage key, any hook that reads/writes it, and any types referencing it. Grep must return zero matches after this step.

**Provider restriction:** Google + Microsoft are configured as the only enabled social providers in the Clerk dashboard, not in code.

**Env var:** `VITE_CLERK_PUBLISHABLE_KEY` in `.env.local` and Vercel project env. Clerk's Marketplace integration provisions `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`; we alias to the `VITE_*` name (via `vite.config.ts` `define` or a small `.env` mapping).

**Unchanged:** the entire designer UI, theming, Excel import, AI design — none of those need to know about auth.

## Backend (Vercel Functions)

**New dependency:** `@clerk/backend`.

**New shared module: `api-src/auth.ts`**

```ts
// Shape only — not final code.
export type AuthedUser = { userId: string; email: string }
export type Tenant     = { id: string }   // "domain:acme.com" | "user:<userId>"
export class AuthError extends Error { status = 401 }

export async function requireUser(req: VercelRequest): Promise<AuthedUser>
//  - reads "Authorization: Bearer <jwt>" header
//  - verifies via @clerk/backend verifyToken() using CLERK_SECRET_KEY
//  - resolves the user's primary verified email (cached in-memory per cold start)
//  - throws AuthError(401) on any failure

export function resolveTenant(user: AuthedUser): Tenant
//  - lowercases the email domain
//  - if domain ∈ FREE_EMAIL_DOMAINS → { id: `user:${user.userId}` }
//  - else                          → { id: `domain:${domain}` }
```

`FREE_EMAIL_DOMAINS` is a hard-coded `Set<string>`:
`gmail.com`, `googlemail.com`, `outlook.com`, `hotmail.com`, `live.com`, `yahoo.com`, `icloud.com`, `proton.me`, `protonmail.com`, `aol.com`. Easy to extend later.

**`api-src/signatureBlobShared.ts` changes:**

- Drop `validateWorkspaceId`.
- Add `validateTenantId(value)` — accepts `domain:<host>` or `user:<id>`. Regex: `^(domain:[a-z0-9.-]+|user:[a-zA-Z0-9_-]+)$`.
- Rename `manifestPath(workspaceId)` → `manifestPath(tenantId)`, writing under `signatures/tenants/<tenantId>/manifest.json`. Same for `zipPath`.
- Other helpers (`readManifest`, `writeManifest`, `saveZipToBlob`, `readZipFromBlob`, `deleteZipFromBlob`, `upsertManifestEntry`, `findManifestEntryByName`) keep their behavior — only the parameter name changes.

**Each handler (`signatures.ts`, `signatures-download.ts`, `design-signature.ts`) becomes:**

```ts
export default async function handler(req, res) {
  try {
    const user   = await requireUser(req)             // 401 on failure
    const tenant = resolveTenant(user)
    // existing logic, but tenant.id replaces workspaceId
  } catch (err) {
    if (err instanceof AuthError) {
      return res.status(401).json({ error: err.message })
    }
    // existing error handling
  }
}
```

- No `workspaceId` is read from query or body anywhere.
- The client cannot influence which tenant it touches — there's no client-supplied tenant parameter to tamper with.
- `isBlobConfigured()` still gates cloud features.

**Server env vars** (auto-provisioned by the Clerk Marketplace integration):
- `CLERK_SECRET_KEY`
- `CLERK_PUBLISHABLE_KEY`

**Local dev:** `vercel env pull .env.local` after installing the integration pulls both keys into Vite's process for `vercel dev`.

## Auth flow

**Happy path — first user at acme.com:**

1. Visits app → `<SignedOut>` renders → centered sign-in card.
2. Clicks "Continue with Google" → Clerk redirects to Google → consent → callback to Clerk → returns to our app.
3. `<SignedIn>` renders → full designer loads.
4. User saves a signature → `apiClient.getToken()` → `POST /api/signatures` with `Authorization: Bearer <jwt>`, no `workspaceId`.
5. Function: `requireUser` verifies the JWT, reads `alice@acme.com`, `resolveTenant` returns `{ id: 'domain:acme.com' }`, blob written under `signatures/tenants/domain:acme.com/...`.

**Second user at acme.com:** same derived tenant; sees Alice's signatures; flat roles allow edit/delete.

**Free-email user (bob@gmail.com):** tenant `{ id: 'user:user_2abc...' }`. Personal tenant of one. Two gmail users never see each other's data.

## Edge cases

| Case | Behavior |
|---|---|
| JWT missing on a cloud endpoint | `401 Unauthorized` with `{ error: 'Not signed in' }`. Client surfaces a toast and re-renders the sign-in screen. |
| JWT expired mid-session | `getToken()` auto-refreshes. If refresh fails, SDK signals signed-out and `<SignedOut>` re-renders. No manual handling. |
| User has no verified primary email | Treated as auth failure. Message: "Please verify your email with Google/Microsoft and try again." Defensive — Clerk only returns a verified email for these providers. |
| Email casing / subdomains | Domain is lowercased and used verbatim. `alice@mail.acme.com` becomes `domain:mail.acme.com` — a different tenant from `domain:acme.com`. Intentional: subdomains often belong to different teams. Revisit if it causes real friction. |
| Disposable / temp-email domains | Out of scope for v1. Can be blocked at the Clerk provider level later. |
| Sign-out | `<UserButton />` handles it. Clerk clears its own localStorage keys. We have no auth state of our own. |
| User leaves an org (Alice quits acme.com) | Out of scope — Clerk has no signal for this. Org data stays under `domain:acme.com` and is accessible to anyone with an authenticated `@acme.com` email. Acceptable for v1. |
| `vercel dev` without Clerk env vars | Frontend won't initialize; show a clear error banner. CI/E2E gets Clerk test keys; Clerk's test mode bypasses real OAuth. |

## Rollout

Each step is independently testable:

1. Install Clerk via Vercel Marketplace. Configure Google + Microsoft as the only enabled providers in the Clerk dashboard. `vercel env pull` locally.
2. Add `@clerk/clerk-react`; wrap `main.tsx` in `<ClerkProvider>`. App still boots normally.
3. Gate the app with `<SignedOut>`/`<SignedIn>`. Add `SignInScreen` and `UserMenu`. App becomes unusable without sign-in. Cloud calls still send `workspaceId` for now.
4. Add `api-src/auth.ts` (`requireUser`, `resolveTenant`) and new tenant-shaped blob helpers. Not yet referenced by any handler.
5. Cut over `api-src/signatures.ts` and `signatures-download.ts` to `requireUser` + `resolveTenant`. Drop `workspaceId` from query/body. Migrate the matching frontend call-sites to the new `apiClient`.
6. Cut over `api-src/design-signature.ts` the same way.
7. Remove `workspaceId` plumbing from the client (localStorage key, hooks, types). Grep must return zero references.
8. Update `scripts/bundle-api.mjs` if needed so `auth.ts` and Clerk SDKs bundle correctly for the `api/` output.
9. Smoke-test in a preview deployment: two Google accounts on the same domain (shared tenant), one Microsoft account, one Gmail account (personal tenant). Confirm cross-tenant isolation by checking the Gmail user cannot see acme.com data.

## Verification

- `curl /api/signatures` without `Authorization` → `401`.
- A JWT for `alice@acme.com` cannot read `domain:other.com` data — there is no client-supplied tenant parameter to tamper with.
- Sign-out from `<UserButton />` immediately re-renders the sign-in screen.
- `npm run build` succeeds. `npm test` passes (existing Vitest suite doesn't touch auth). Existing Playwright e2e does not exercise cloud-save, so no e2e changes are required for v1.

## Out of scope for v1

- Data migration from existing `workspaces/<uuid>/...` blobs.
- Clerk Organizations, invites, member management, admin UI.
- Roles inside a tenant (admin vs member, per-signature ownership).
- Paid-tier Clerk domain verification — we trust Google/Microsoft's verified email.
- Blocking disposable-email domains.
- Handling "user left the company" (no signal from Clerk).
- Auth-flow e2e tests (can be added later with `@clerk/testing`).
