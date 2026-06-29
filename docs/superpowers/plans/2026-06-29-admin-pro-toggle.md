# Admin Pro Toggle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an admin-only `/admin` page that can toggle a single customer's Pro status by email, and a global "Pro for everyone" override — fixing the immediate problem of a paying customer whose entitlements blob is out of sync.

**Architecture:** Reuse the existing entitlements Blob storage and `resolveTenant()` logic from the monetization feature (`api-src/entitlements.ts`, `api-src/auth.ts`). Add a `requireAdmin` auth guard backed by a Clerk `publicMetadata.role` check, two new Vercel Function endpoints, and a separate `/admin` SPA route gated the same way the rest of the app is gated by Clerk.

**Tech Stack:** Existing stack only — Vite/React 19 SPA, Vercel Functions, `@vercel/blob`, `@clerk/backend` / `@clerk/clerk-react`, Vitest.

**Spec:** [docs/superpowers/specs/2026-06-29-admin-pro-toggle-design.md](../specs/2026-06-29-admin-pro-toggle-design.md)

---

## Testing note

This codebase's existing tests (`api-src/auth.test.ts`, `api-src/entitlements.test.ts`, `api-src/lemonsqueezy.test.ts`, `api-src/signatureBlobShared.test.ts`) only cover **pure, network-free logic** (`resolveTenant`, `entitlementsPath`, `isPro`, `defaultEntitlements`, `verifyLemonSqueezySignature`, `validateTenantId`). Functions that call `@vercel/blob` or `@clerk/backend` directly (`readEntitlements`, `writeEntitlements`, `requireUser`, the webhook/checkout handlers) have **no unit tests** in this codebase — they're verified manually via `curl`/dev server instead. This plan follows that same convention: TDD for new pure logic, manual `curl` verification (with exact commands) for anything that talks to Blob or Clerk.

---

### Task 1: Add a configurable status to `AuthError`

**Files:**
- Modify: `api-src/auth.ts:8-14`
- Test: `api-src/auth.test.ts`

- [ ] **Step 1: Write the failing test**

Add to `api-src/auth.test.ts` (new `describe` block, alongside the existing `resolveTenant` block):

```ts
import { AuthError, resolveTenant } from './auth'
```

```ts
describe('AuthError', () => {
  it('defaults to a 401 status', () => {
    expect(new AuthError('Not signed in').status).toBe(401)
  })

  it('accepts a custom status', () => {
    expect(new AuthError('Forbidden', 403).status).toBe(403)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run api-src/auth.test.ts`
Expected: FAIL — `new AuthError('Forbidden', 403)` doesn't accept a second argument yet (current constructor is `constructor(message: string)`), so the second test fails (status is hardcoded to `401`).

- [ ] **Step 3: Update `AuthError` to accept a status**

In `api-src/auth.ts`, replace:

```ts
export class AuthError extends Error {
  status = 401
  constructor(message: string) {
    super(message)
    this.name = 'AuthError'
  }
}
```

with:

```ts
export class AuthError extends Error {
  status: number
  constructor(message: string, status = 401) {
    super(message)
    this.name = 'AuthError'
    this.status = status
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run api-src/auth.test.ts`
Expected: PASS (all tests in the file, including the existing `resolveTenant` ones).

- [ ] **Step 5: Commit**

```bash
git add api-src/auth.ts api-src/auth.test.ts
git commit -m "feat: allow AuthError to carry a custom HTTP status"
```

---

### Task 2: Export `getClerk` and add `requireAdmin`

**Files:**
- Modify: `api-src/auth.ts:51-58` (export `getClerk`), and add `requireAdmin` after `requireUser` (currently ends at line 85)

- [ ] **Step 1: Export the cached Clerk client getter**

In `api-src/auth.ts`, change:

```ts
let cachedClerk: ReturnType<typeof createClerkClient> | null = null
const getClerk = () => {
```

to:

```ts
let cachedClerk: ReturnType<typeof createClerkClient> | null = null
export const getClerk = () => {
```

(No other change to that function's body.)

- [ ] **Step 2: Add `requireAdmin` after `requireUser`**

Append to the end of `api-src/auth.ts` (after the closing brace of `requireUser`):

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

- [ ] **Step 3: Run the existing test suite to make sure nothing broke**

Run: `npx vitest run api-src/auth.test.ts`
Expected: PASS — `requireAdmin` is network-dependent (calls Clerk) and isn't unit tested here, matching how `requireUser` itself has no direct test. It will be verified manually in Task 8.

- [ ] **Step 4: Commit**

```bash
git add api-src/auth.ts
git commit -m "feat: add requireAdmin auth guard backed by Clerk publicMetadata role"
```

---

### Task 3: Add global Pro override storage to `entitlements.ts`

**Files:**
- Modify: `api-src/entitlements.ts` (append after `writeEntitlements`)
- Test: `api-src/entitlements.test.ts`

- [ ] **Step 1: Write the failing tests for the pure parts**

Add to `api-src/entitlements.test.ts`:

```ts
import {
  GLOBAL_PRO_OVERRIDE_PATH,
  defaultEntitlements,
  defaultGlobalProOverride,
  entitlementsPath,
  isPro
} from './entitlements'
```

```ts
describe('GLOBAL_PRO_OVERRIDE_PATH', () => {
  it('points at a fixed path', () => {
    expect(GLOBAL_PRO_OVERRIDE_PATH).toBe('entitlements/_global-pro-override.json')
  })
})

describe('defaultGlobalProOverride', () => {
  it('defaults to inactive', () => {
    expect(defaultGlobalProOverride()).toEqual({ active: false })
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run api-src/entitlements.test.ts`
Expected: FAIL with `GLOBAL_PRO_OVERRIDE_PATH` / `defaultGlobalProOverride` not exported from `./entitlements`.

- [ ] **Step 3: Implement the global override storage**

Append to `api-src/entitlements.ts` (after the existing `writeEntitlements` function, keeping the existing `get`/`put` import as-is):

```ts

export type GlobalProOverride = { active: boolean }

export const GLOBAL_PRO_OVERRIDE_PATH = 'entitlements/_global-pro-override.json'

export const defaultGlobalProOverride = (): GlobalProOverride => ({ active: false })

export const readGlobalProOverride = async (): Promise<GlobalProOverride> => {
  try {
    const result = await get(GLOBAL_PRO_OVERRIDE_PATH, { access: 'private' })
    if (!result || result.statusCode !== 200 || !result.stream) {
      return defaultGlobalProOverride()
    }
    const text = await new Response(result.stream).text()
    const parsed = JSON.parse(text) as GlobalProOverride
    return { active: Boolean(parsed?.active) }
  } catch {
    return defaultGlobalProOverride()
  }
}

export const writeGlobalProOverride = async (active: boolean): Promise<void> => {
  await put(GLOBAL_PRO_OVERRIDE_PATH, JSON.stringify({ active }), {
    access: 'private',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true
  })
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run api-src/entitlements.test.ts`
Expected: PASS (all tests in the file).

- [ ] **Step 5: Commit**

```bash
git add api-src/entitlements.ts api-src/entitlements.test.ts
git commit -m "feat: add global Pro override storage to entitlements module"
```

---

### Task 4: Combine the global override into `GET /api/entitlements`

**Files:**
- Modify: `api-src/entitlements-get.ts` (full file, currently 29 lines)

- [ ] **Step 1: Update the handler**

Replace the full contents of `api-src/entitlements-get.ts` with:

```ts
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { AuthError, requireUser, resolveTenant } from './auth'
import { isPro, readEntitlements, readGlobalProOverride } from './entitlements'

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  try {
    const user = await requireUser(req)
    const tenant = resolveTenant(user)

    if (req.method !== 'GET') {
      res.status(405).json({ error: 'Method not allowed' })
      return
    }

    const [entitlements, globalOverride] = await Promise.all([
      readEntitlements(tenant.id),
      readGlobalProOverride()
    ])
    res.status(200).json({
      tier: isPro(entitlements) || globalOverride.active ? 'pro' : 'free',
      unlockedSignatureIds: entitlements.unlockedSignatureIds
    })
  } catch (error) {
    if (error instanceof AuthError) {
      res.status(error.status).json({ error: error.message })
      return
    }
    const message = error instanceof Error ? error.message : 'Entitlements request failed'
    console.error('[entitlements]', message, error)
    res.status(500).json({ error: message })
  }
}
```

- [ ] **Step 2: Run the full test suite**

Run: `npm test`
Expected: PASS — this handler has no direct unit test (matching the existing convention; it's network-dependent end to end). It will be verified manually in Task 8/11.

- [ ] **Step 3: Commit**

```bash
git add api-src/entitlements-get.ts
git commit -m "feat: let a global Pro override unlock entitlements for every tenant"
```

---

### Task 5: Add the two new admin endpoints to the API bundler

**Files:**
- Modify: `scripts/bundle-api.mjs:3-10`

- [ ] **Step 1: Add the two new bundle entries**

In `scripts/bundle-api.mjs`, change the `bundles` array from:

```js
const bundles = [
  ['api-src/design-signature.ts', 'api/design-signature.js'],
  ['api-src/signatures.ts', 'api/signatures.js'],
  ['api-src/signatures-download.ts', 'api/signatures/download.js'],
  ['api-src/entitlements-get.ts', 'api/entitlements.js'],
  ['api-src/entitlements-checkout.ts', 'api/entitlements/checkout.js'],
  ['api-src/webhooks-lemonsqueezy.ts', 'api/webhooks/lemonsqueezy.js']
]
```

to:

```js
const bundles = [
  ['api-src/design-signature.ts', 'api/design-signature.js'],
  ['api-src/signatures.ts', 'api/signatures.js'],
  ['api-src/signatures-download.ts', 'api/signatures/download.js'],
  ['api-src/entitlements-get.ts', 'api/entitlements.js'],
  ['api-src/entitlements-checkout.ts', 'api/entitlements/checkout.js'],
  ['api-src/webhooks-lemonsqueezy.ts', 'api/webhooks/lemonsqueezy.js'],
  ['api-src/admin-set-pro.ts', 'api/admin/set-pro.js'],
  ['api-src/admin-global-pro.ts', 'api/admin/global-pro.js']
]
```

Note: `api-src/admin-set-pro.ts` and `api-src/admin-global-pro.ts` don't exist yet — they're created in Tasks 6 and 7. This step just registers the future files; running `node scripts/bundle-api.mjs` before those files exist will fail, which is expected and fine since we won't run it until Task 8.

- [ ] **Step 2: Commit**

```bash
git add scripts/bundle-api.mjs
git commit -m "feat: register admin endpoints with the API bundler"
```

---

### Task 6: Add `POST /api/admin/set-pro`

**Files:**
- Create: `api-src/admin-set-pro.ts`

- [ ] **Step 1: Write the handler**

```ts
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { AuthError, getClerk, requireAdmin, resolveTenant } from './auth'
import { readEntitlements, writeEntitlements } from './entitlements'

type SetProBody = { email?: unknown; active?: unknown }

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  try {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' })
      return
    }

    await requireAdmin(req)

    const body = (req.body ?? {}) as SetProBody
    const email = typeof body.email === 'string' ? body.email.trim() : ''
    const active = typeof body.active === 'boolean' ? body.active : undefined
    if (!email || active === undefined) {
      res.status(400).json({ error: 'email (string) and active (boolean) are required' })
      return
    }

    const clerk = getClerk()
    const { data: users } = await clerk.users.getUserList({ emailAddress: [email] })
    const found = users[0]
    if (!found) {
      res.status(404).json({ error: 'No account found for that email' })
      return
    }

    const primary = found.emailAddresses.find(
      (address) => address.id === found.primaryEmailAddressId
    )
    const resolvedEmail = primary?.emailAddress ?? email
    const tenant = resolveTenant({ userId: found.id, email: resolvedEmail })

    const entitlements = await readEntitlements(tenant.id)
    await writeEntitlements(tenant.id, {
      ...entitlements,
      pro: { ...entitlements.pro, active }
    })

    res.status(200).json({ tenantId: tenant.id, email: resolvedEmail, active })
  } catch (error) {
    if (error instanceof AuthError) {
      res.status(error.status).json({ error: error.message })
      return
    }
    const message = error instanceof Error ? error.message : 'Admin set-pro request failed'
    console.error('[admin-set-pro]', message, error)
    res.status(500).json({ error: message })
  }
}
```

- [ ] **Step 2: Run the full test suite**

Run: `npm test`
Expected: PASS — no new test file for this handler (network-dependent: Clerk lookup + Blob read/write), matching the existing convention for handler files like `webhooks-lemonsqueezy.ts` and `entitlements-checkout.ts`. Verified manually in Task 8.

- [ ] **Step 3: Commit**

```bash
git add api-src/admin-set-pro.ts
git commit -m "feat: add admin endpoint to toggle a single customer's Pro status"
```

---

### Task 7: Add `GET`/`POST /api/admin/global-pro`

**Files:**
- Create: `api-src/admin-global-pro.ts`

- [ ] **Step 1: Write the handler**

```ts
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { AuthError, requireAdmin } from './auth'
import { readGlobalProOverride, writeGlobalProOverride } from './entitlements'

type GlobalProBody = { active?: unknown }

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  try {
    await requireAdmin(req)

    if (req.method === 'GET') {
      const override = await readGlobalProOverride()
      res.status(200).json(override)
      return
    }

    if (req.method === 'POST') {
      const body = (req.body ?? {}) as GlobalProBody
      if (typeof body.active !== 'boolean') {
        res.status(400).json({ error: 'active (boolean) is required' })
        return
      }
      await writeGlobalProOverride(body.active)
      res.status(200).json({ active: body.active })
      return
    }

    res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    if (error instanceof AuthError) {
      res.status(error.status).json({ error: error.message })
      return
    }
    const message = error instanceof Error ? error.message : 'Admin global-pro request failed'
    console.error('[admin-global-pro]', message, error)
    res.status(500).json({ error: message })
  }
}
```

- [ ] **Step 2: Run the full test suite**

Run: `npm test`
Expected: PASS — same rationale as Task 6 (network-dependent, no direct unit test). Verified manually in Task 8.

- [ ] **Step 3: Commit**

```bash
git add api-src/admin-global-pro.ts
git commit -m "feat: add admin endpoint to toggle the global Pro override"
```

---

### Task 8: Manual verification of the new endpoints

**Files:** none (verification only)

This task requires a real Clerk account and the local dev server. Do this before building the UI, so any backend issues are caught early.

- [ ] **Step 1: Build the API bundle**

Run: `node scripts/bundle-api.mjs`
Expected: prints `Bundled api/admin/set-pro.js` and `Bundled api/admin/global-pro.js` among the others, with no errors.

- [ ] **Step 2: Mark your own Clerk user as admin**

In the Clerk Dashboard → Users → select your test user → Metadata → Public metadata, set:

```json
{ "role": "admin" }
```

- [ ] **Step 3: Start the dev server**

Run: `npm run dev:vercel`
(This runs `node scripts/bundle-api.mjs && vercel dev` per `package.json`.)

- [ ] **Step 4: Get a session token**

Sign in to the app in a browser at the dev server's URL, open the browser console, and run:

```js
await window.Clerk.session.getToken()
```

Copy the returned token for use in the next steps. Set it as a shell variable:

```bash
export TOKEN="<paste token here>"
```

- [ ] **Step 5: Verify 401 without a token**

Run:

```bash
curl -i -X POST http://localhost:3000/api/admin/set-pro -H "Content-Type: application/json" -d '{"email":"test@example.com","active":true}'
```

Expected: `HTTP/1.1 401` with `{"error":"Not signed in"}`.

- [ ] **Step 6: Verify 403 for a non-admin token**

Temporarily remove the `role: admin` metadata from your Clerk user (Clerk Dashboard), get a fresh token (Step 4), then run:

```bash
curl -i -X POST http://localhost:3000/api/admin/set-pro -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"email":"test@example.com","active":true}'
```

Expected: `HTTP/1.1 403` with `{"error":"Forbidden"}`. Restore the `role: admin` metadata afterward and get a fresh `TOKEN` (Step 4) before continuing.

- [ ] **Step 7: Verify 404 for an unknown email**

```bash
curl -i -X POST http://localhost:3000/api/admin/set-pro -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"email":"definitely-not-a-real-account@example.com","active":true}'
```

Expected: `HTTP/1.1 404` with `{"error":"No account found for that email"}`.

- [ ] **Step 8: Verify a successful toggle on a real test account**

Using an email address that has actually signed in to the app at least once (use your own test account's email, or a second test account):

```bash
curl -i -X POST http://localhost:3000/api/admin/set-pro -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"email":"<real-test-email>","active":true}'
```

Expected: `HTTP/1.1 200` with `{"tenantId":"...","email":"...","active":true}`.

- [ ] **Step 9: Verify `GET /api/entitlements` reflects the change**

Sign in as the customer whose email you just toggled (or get a token for that user), then:

```bash
curl -i http://localhost:3000/api/entitlements -H "Authorization: Bearer <that user's token>"
```

Expected: `HTTP/1.1 200` with `"tier":"pro"`.

- [ ] **Step 10: Toggle it back off and re-verify**

```bash
curl -i -X POST http://localhost:3000/api/admin/set-pro -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"email":"<real-test-email>","active":false}'
```

Then repeat Step 9 — expect `"tier":"free"` (assuming that account had no other source of Pro).

- [ ] **Step 11: Verify the global override**

```bash
curl -i http://localhost:3000/api/admin/global-pro -H "Authorization: Bearer $TOKEN"
```

Expected: `HTTP/1.1 200` with `{"active":false}`.

```bash
curl -i -X POST http://localhost:3000/api/admin/global-pro -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"active":true}'
```

Expected: `HTTP/1.1 200` with `{"active":true}`.

Then `GET /api/entitlements` (Step 9) for a **different**, non-Pro test account — expect `"tier":"pro"` now, even though that account was never individually toggled.

- [ ] **Step 12: Turn the global override back off**

```bash
curl -i -X POST http://localhost:3000/api/admin/global-pro -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"active":false}'
```

Re-check the non-Pro account from Step 11 — expect `"tier":"free"` again.

No commit for this task — it's pure verification of work already committed in Tasks 1–7.

---

### Task 9: Add the `/admin` route and `AdminGate`

**Files:**
- Create: `src/components/AdminGate.tsx`
- Modify: `src/main.tsx`

- [ ] **Step 1: Write `AdminGate`**

```tsx
import { SignedIn, SignedOut, SignIn, useAuth } from '@clerk/clerk-react'
import { useEffect } from 'react'
import { AdminPage } from './AdminPage'
import { setCloudAuthTokenGetter } from '../lib/cloudSignatures'

const RegisterAdminAuthToken = () => {
  const { getToken, isSignedIn } = useAuth()
  useEffect(() => {
    if (!isSignedIn) return
    setCloudAuthTokenGetter(() => getToken())
  }, [getToken, isSignedIn])
  return null
}

export const AdminGate = () => (
  <>
    <SignedIn>
      <RegisterAdminAuthToken />
      <AdminPage />
    </SignedIn>
    <SignedOut>
      <main style={{ maxWidth: 420, margin: '64px auto', padding: '0 16px' }}>
        <h1>Admin sign in</h1>
        <SignIn routing="virtual" />
      </main>
    </SignedOut>
  </>
)
```

- [ ] **Step 2: Wire it into `main.tsx`**

In `src/main.tsx`, add the import alongside the existing `AuthGate` import:

```ts
import { AdminGate } from './components/AdminGate'
```

(Place it on the line right after `import { AuthGate } from './components/AuthGate'`.)

Then change the final render call from:

```tsx
createRoot(root).render(
  <StrictMode>
    <UiLanguageProvider>
      <LocalizedClerkProvider>
        <AuthGate />
      </LocalizedClerkProvider>
    </UiLanguageProvider>
  </StrictMode>
)
```

to:

```tsx
const isAdminRoute = window.location.pathname === '/admin'

createRoot(root).render(
  <StrictMode>
    <UiLanguageProvider>
      <LocalizedClerkProvider>
        {isAdminRoute ? <AdminGate /> : <AuthGate />}
      </LocalizedClerkProvider>
    </UiLanguageProvider>
  </StrictMode>
)
```

- [ ] **Step 3: Run the full test suite**

Run: `npm test`
Expected: PASS (no existing tests cover `main.tsx`; this is a routing-only change verified manually in Task 11).

- [ ] **Step 4: Commit**

```bash
git add src/components/AdminGate.tsx src/main.tsx
git commit -m "feat: add /admin route gated by Clerk sign-in"
```

---

### Task 10: Add `AdminPage`

**Files:**
- Create: `src/components/AdminPage.tsx`

- [ ] **Step 1: Write the component**

```tsx
import { useEffect, useState } from 'react'
import { Field, TextInput } from './Field'
import { authedFetch } from '../lib/cloudSignatures'

type SetProResult = { tenantId: string; email: string; active: boolean }
type ApiError = { error: string }

export const AdminPage = () => {
  const [email, setEmail] = useState('')
  const [customerStatus, setCustomerStatus] = useState('')
  const [customerWorking, setCustomerWorking] = useState(false)

  const [globalActive, setGlobalActive] = useState(false)
  const [globalLoaded, setGlobalLoaded] = useState(false)
  const [globalWorking, setGlobalWorking] = useState(false)
  const [globalStatus, setGlobalStatus] = useState('')

  useEffect(() => {
    let cancelled = false
    authedFetch('/api/admin/global-pro')
      .then(async (response) => {
        if (cancelled) return
        if (!response.ok) {
          setGlobalStatus(`Failed to load global override (${response.status})`)
          return
        }
        const payload = (await response.json()) as { active: boolean }
        setGlobalActive(Boolean(payload.active))
      })
      .catch(() => {
        if (!cancelled) setGlobalStatus('Failed to load global override')
      })
      .finally(() => {
        if (!cancelled) setGlobalLoaded(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const setCustomerPro = async (active: boolean) => {
    const trimmed = email.trim()
    if (!trimmed) {
      setCustomerStatus('Enter an email first')
      return
    }
    setCustomerWorking(true)
    setCustomerStatus('Working…')
    try {
      const response = await authedFetch('/api/admin/set-pro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed, active })
      })
      const payload = (await response.json()) as SetProResult | ApiError
      if (!response.ok) {
        setCustomerStatus('error' in payload ? payload.error : `Request failed (${response.status})`)
        return
      }
      const result = payload as SetProResult
      setCustomerStatus(
        `${result.email} → tenant ${result.tenantId} is now ${result.active ? 'Pro' : 'Free'}`
      )
    } catch {
      setCustomerStatus('Request failed')
    } finally {
      setCustomerWorking(false)
    }
  }

  const setGlobalOverride = async (active: boolean) => {
    setGlobalWorking(true)
    setGlobalStatus('Working…')
    try {
      const response = await authedFetch('/api/admin/global-pro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active })
      })
      if (!response.ok) {
        const payload = (await response.json()) as ApiError
        setGlobalStatus(payload.error ?? `Request failed (${response.status})`)
        return
      }
      setGlobalActive(active)
      setGlobalStatus(active ? 'Pro is now on for everyone' : 'Global override is off')
    } catch {
      setGlobalStatus('Request failed')
    } finally {
      setGlobalWorking(false)
    }
  }

  return (
    <main style={{ maxWidth: 560, margin: '48px auto', padding: '0 16px' }}>
      <h1>Admin</h1>

      <section style={{ marginTop: 32 }}>
        <h2>Customer Pro status</h2>
        <Field label="Customer email">
          <TextInput
            value={email}
            placeholder="customer@example.com"
            onChange={(event) => setEmail(event.target.value)}
          />
        </Field>
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button
            type="button"
            className="primary"
            disabled={customerWorking}
            onClick={() => setCustomerPro(true)}
          >
            Make Pro
          </button>
          <button
            type="button"
            className="secondary"
            disabled={customerWorking}
            onClick={() => setCustomerPro(false)}
          >
            Remove Pro
          </button>
        </div>
        {customerStatus && <p className="hint">{customerStatus}</p>}
      </section>

      <section style={{ marginTop: 32 }}>
        <h2>Pro for everyone</h2>
        <p className="hint">Overrides every tenant&apos;s individual Pro status while on.</p>
        <button
          type="button"
          className={globalActive ? 'primary' : 'secondary'}
          disabled={!globalLoaded || globalWorking}
          onClick={() => setGlobalOverride(!globalActive)}
        >
          {globalActive ? 'Pro for everyone: ON' : 'Pro for everyone: OFF'}
        </button>
        {globalStatus && <p className="hint">{globalStatus}</p>}
      </section>
    </main>
  )
}
```

- [ ] **Step 2: Run the full test suite**

Run: `npm test`
Expected: PASS (no existing tests cover React components in this codebase's `src/components/`; verified manually in Task 11).

- [ ] **Step 3: Commit**

```bash
git add src/components/AdminPage.tsx
git commit -m "feat: add AdminPage UI for toggling Pro status"
```

---

### Task 11: Manual end-to-end verification in the browser

**Files:** none (verification only)

- [ ] **Step 1: Build and run**

Run: `npm run dev:vercel`

- [ ] **Step 2: Verify the signed-out state**

In an incognito/private window, navigate to `http://localhost:3000/admin`.
Expected: a sign-in form renders (no full app, no redirect loop).

- [ ] **Step 3: Verify the non-admin state**

Sign in as a user without `role: admin` metadata.
Expected: the Admin page itself renders (no client-side gate on the route), but clicking "Make Pro" or the global toggle shows a "Forbidden" status message (from the 403 response).

- [ ] **Step 4: Verify the admin happy path**

Sign in as your admin test user (with `role: admin` metadata set per Task 8 Step 2).
- Enter a real test customer's email, click "Make Pro." Expected: status line shows `<email> → tenant <tenantId> is now Pro`.
- Sign in as that customer in a separate window/profile, reload the main app (not `/admin`). Expected: `UserMenu` shows the Pro badge instead of the upgrade button.
- Back on `/admin`, click "Remove Pro" for the same email. Expected: status shows `... is now Free`; the customer's Pro badge disappears on their next reload.

- [ ] **Step 5: Verify the global override in the browser**

On `/admin` as the admin, click the "Pro for everyone: OFF" button.
Expected: it flips to "Pro for everyone: ON" and the status line confirms it.
Reload `/admin`. Expected: the button still shows "ON" (state persisted via Blob, loaded on mount).
Sign in as a different, non-Pro customer and reload the main app. Expected: Pro features are unlocked even though that customer was never individually toggled.
Return to `/admin`, click the button again to turn it back "OFF." Reload the non-Pro customer's app. Expected: Pro features are locked again.

No commit for this task — verification only.

---

## Self-Review Notes

- **Spec coverage:** All 6 locked decisions from the spec are covered — admin via Clerk role (Task 2), email-based lookup via `resolveTenant` (Task 6), explicit-not-toggle per-customer set (Task 6/10), global override OR'd at read time (Tasks 3–4), 404 on unknown email (Task 6), no listing/audit/bulk UI (explicitly out of scope, not built).
- **Placeholder scan:** no TBDs; every code step has complete code; manual-verification tasks (8, 11) have exact commands/expected output instead of automated tests, consistent with this codebase's existing convention for Blob/Clerk-dependent code.
- **Type consistency:** `SetProResult`/`ApiError` types in `AdminPage.tsx` match the JSON shapes actually returned by `admin-set-pro.ts` (`{ tenantId, email, active }` / `{ error }`). `GlobalProOverride` shape (`{ active: boolean }`) matches between `entitlements.ts`, `admin-global-pro.ts`, and `AdminPage.tsx`. `getClerk` is exported once (Task 2) and reused identically in `admin-set-pro.ts` (Task 6) and the existing `requireUser`/`requireAdmin`.
