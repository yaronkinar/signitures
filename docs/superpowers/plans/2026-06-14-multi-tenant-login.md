# Multi-tenant login — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace anonymous `workspaceId` cloud storage with Clerk-authenticated sign-in, deriving the tenant from the verified email domain.

**Architecture:** A Vite SPA wraps the existing `<App />` in `<ClerkProvider>` and gates it behind `<SignedIn>`/`<SignedOut>`. Vercel Functions verify the Clerk JWT via `@clerk/backend`, derive a tenant id (`domain:<host>` or `user:<userId>`) from the verified email, and key Vercel Blob storage on the tenant id. The client never sends a tenant identifier.

**Tech Stack:** Vite 7, React 19, `@clerk/clerk-react`, `@clerk/backend`, Vercel Functions (Node), Vercel Blob, Vitest, esbuild bundler for `api/`.

**Spec:** `docs/superpowers/specs/2026-06-14-multi-tenant-login-design.md`.

---

## File map

**Create**
- `src/components/SignInScreen.tsx` — centered Clerk `<SignIn />` host shown when signed out.
- `src/components/AuthGate.tsx` — picks between `<SignInScreen />` and `<App />`.
- `src/components/UserMenu.tsx` — wraps Clerk's `<UserButton />` for the app header.
- `api-src/auth.ts` — `requireUser`, `resolveTenant`, `AuthError`, `FREE_EMAIL_DOMAINS`.
- `api-src/auth.test.ts` — unit tests for `resolveTenant` and `FREE_EMAIL_DOMAINS`.
- `api-src/signatureBlobShared.test.ts` — unit tests for `validateTenantId`, `manifestPath`, `zipPath`.

**Modify**
- `package.json` — add `@clerk/clerk-react`, `@clerk/backend`.
- `vite.config.ts` — alias `VITE_CLERK_PUBLISHABLE_KEY` from `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` so both names work.
- `vitest.config.ts` — include `api-src/**/*.test.ts`.
- `src/main.tsx` — wrap render tree in `<ClerkProvider>` + `<AuthGate />`.
- `src/App.tsx` — mount `<UserMenu />` next to existing controls at lines 375, 387, 400.
- `api-src/signatureBlobShared.ts` — drop `validateWorkspaceId`, add `validateTenantId`, rename path helpers to `tenantId` and write under `signatures/tenants/<tenantId>/...`.
- `api-src/signatures.ts` — call `requireUser` + `resolveTenant`, drop all `workspaceId` reads.
- `api-src/signatures-download.ts` — same.
- `api-src/design-signature.ts` — call `requireUser` only (it isn't tenant-scoped).
- `src/lib/cloudSignatures.ts` — switch to an authenticated `fetch` helper, drop `workspaceId`.

**Delete**
- `src/lib/workspaceId.ts` — no longer referenced.

---

## Task 1: Install Clerk Marketplace integration and SDKs

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install the Clerk integration on Vercel**

This is a manual step in the Vercel dashboard (the CLI is not installed in this repo). The integration auto-provisions `CLERK_SECRET_KEY` and `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` in Production, Preview, and Development environments.

1. In the Vercel dashboard, open the project → **Integrations** → **Browse Marketplace** → **Clerk** → **Add Integration**.
2. Pick "Create new Clerk application" → name it after the project.
3. In the Clerk dashboard, **User & Authentication → Social Connections**: enable **Google** and **Microsoft**, disable everything else.
4. In Clerk → **User & Authentication → Email, Phone, Username**: disable email/password and email-code (we only want social).

Then pull the new env vars locally:

```bash
# Requires the Vercel CLI. If not installed:
#   npm i -g vercel
# Then once per machine:
#   vercel login
#   vercel link
vercel env pull .env.local
```

Confirm `.env.local` now contains `CLERK_SECRET_KEY=` and `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=`. Add `.env.local` to `.gitignore` if it is not already there.

- [ ] **Step 2: Verify .gitignore already excludes .env.local**

Run:
```bash
grep -F ".env.local" .gitignore || echo "MISSING"
```

Expected: a matching line is printed. If the output is `MISSING`, append the line:
```bash
printf '\n.env.local\n' >> .gitignore
```

- [ ] **Step 3: Add Clerk SDK dependencies**

Run:
```bash
npm install @clerk/clerk-react@^5 @clerk/backend@^2
```

Expected: `package.json` `dependencies` now lists both packages and `package-lock.json` updates.

- [ ] **Step 4: Verify the install builds**

Run:
```bash
npm run build
```

Expected: exits 0. (Build still uses the old `workspaceId` paths; nothing should break.)

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json .gitignore
git commit -m "Install Clerk SDKs and Marketplace integration"
```

---

## Task 2: Alias the Clerk publishable key for Vite

The Marketplace integration provisions `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, but Vite only exposes env vars prefixed with `VITE_`. We bridge them in `vite.config.ts` so the client reads one name and either Vercel env var works.

**Files:**
- Modify: `vite.config.ts:11-15`

- [ ] **Step 1: Add the alias in `vite.config.ts`**

Replace the existing `define` block (lines 11-15) with:

```ts
const clerkPublishableKey =
  process.env.VITE_CLERK_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ??
  ''

export default defineConfig({
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(pkg.version),
    'import.meta.env.VITE_BUILD_TIME': JSON.stringify(buildTime),
    'import.meta.env.VITE_CLERK_PUBLISHABLE_KEY': JSON.stringify(clerkPublishableKey)
  },
```

- [ ] **Step 2: Verify dev startup picks up the key**

Run:
```bash
npm run dev -- --host 127.0.0.1 --port 5173
```

In another terminal:
```bash
curl -s http://127.0.0.1:5173/ | head -20
```

Expected: HTML loads. Stop the dev server (`Ctrl+C`).

- [ ] **Step 3: Commit**

```bash
git add vite.config.ts
git commit -m "Expose Clerk publishable key to Vite as VITE_CLERK_PUBLISHABLE_KEY"
```

---

## Task 3: Create the `SignInScreen` component

**Files:**
- Create: `src/components/SignInScreen.tsx`

- [ ] **Step 1: Write the component**

Create `src/components/SignInScreen.tsx`:

```tsx
import { SignIn } from '@clerk/clerk-react'

export const SignInScreen = () => {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background: 'var(--app-bg, #eef3f8)'
      }}
    >
      <SignIn routing="virtual" />
    </main>
  )
}
```

`routing="virtual"` keeps Clerk's sign-in inside the SPA without route changes — important because this app has no router. The Google + Microsoft buttons come from the providers enabled in the Clerk dashboard (configured in Task 1).

- [ ] **Step 2: Verify it type-checks**

Run:
```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/SignInScreen.tsx
git commit -m "Add SignInScreen component"
```

---

## Task 4: Create the `AuthGate` component

**Files:**
- Create: `src/components/AuthGate.tsx`

- [ ] **Step 1: Write the component**

Create `src/components/AuthGate.tsx`:

```tsx
import { SignedIn, SignedOut } from '@clerk/clerk-react'
import App from '../App'
import { SignInScreen } from './SignInScreen'

export const AuthGate = () => {
  return (
    <>
      <SignedOut>
        <SignInScreen />
      </SignedOut>
      <SignedIn>
        <App />
      </SignedIn>
    </>
  )
}
```

This wrapper isolates auth concerns from `App.tsx`. We do not modify `App.tsx`'s top-level structure.

- [ ] **Step 2: Verify it type-checks**

Run:
```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/AuthGate.tsx
git commit -m "Add AuthGate to switch between SignInScreen and App"
```

---

## Task 5: Wire `ClerkProvider` + `AuthGate` into `main.tsx`

**Files:**
- Modify: `src/main.tsx`

- [ ] **Step 1: Replace `main.tsx`**

Replace the entire contents of `src/main.tsx` with:

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import { AuthGate } from './components/AuthGate'
import './App.css'

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!publishableKey) {
  throw new Error(
    'Missing VITE_CLERK_PUBLISHABLE_KEY. Run `vercel env pull .env.local` after installing the Clerk Marketplace integration.'
  )
}

const root = document.getElementById('root')
if (!root) {
  throw new Error('Missing #root element')
}

createRoot(root).render(
  <StrictMode>
    <ClerkProvider publishableKey={publishableKey}>
      <AuthGate />
    </ClerkProvider>
  </StrictMode>
)
```

- [ ] **Step 2: Verify type-check and build**

```bash
npx tsc --noEmit && npm run build
```

Expected: both exit 0.

- [ ] **Step 3: Smoke-test in dev**

```bash
npm run dev -- --host 127.0.0.1 --port 5173
```

Open `http://127.0.0.1:5173/` in a browser. Expected: the Clerk sign-in card renders. Sign in with a Google account. After redirect, the existing designer UI renders.

Stop the dev server (`Ctrl+C`).

- [ ] **Step 4: Commit**

```bash
git add src/main.tsx
git commit -m "Gate the app behind Clerk sign-in"
```

---

## Task 6: Add `UserMenu` and mount it in the app headers

**Files:**
- Create: `src/components/UserMenu.tsx`
- Modify: `src/App.tsx` (insertions after lines 375, 387, 400)

- [ ] **Step 1: Write the `UserMenu` component**

Create `src/components/UserMenu.tsx`:

```tsx
import { UserButton } from '@clerk/clerk-react'

export const UserMenu = () => {
  return <UserButton afterSignOutUrl="/" />
}
```

- [ ] **Step 2: Import `UserMenu` in `App.tsx`**

In `src/App.tsx`, add this import next to the existing `ThemeToggle` / `LanguageToggle` imports (around line 10):

```tsx
import { UserMenu } from './components/UserMenu'
```

- [ ] **Step 3: Mount `<UserMenu />` in all three header locations**

In `src/App.tsx`, add `<UserMenu />` immediately after each `<LanguageToggle .../>` element. There are three of them.

Around line 376 (inside `<header className="app-mobile-chrome">`):
```tsx
        <ThemeToggle lang={lang} theme={uiTheme} onChange={setUiTheme} />
        <LanguageToggle lang={lang} onChange={app.handleLanguageChange} />
        <UserMenu />
      </header>
```

Around line 387 (inside `<header className="app-topbar">`):
```tsx
            <ThemeToggle lang={lang} theme={uiTheme} onChange={setUiTheme} />
            <LanguageToggle lang={lang} onChange={app.handleLanguageChange} />
            <UserMenu />
            <button type="button" className="btn-topbar-primary" onClick={() => app.generate()}>
```

Around line 400 (inside `.classic-topbar-actions`):
```tsx
            <ThemeToggle lang={lang} theme={uiTheme} onChange={setUiTheme} />
            <LanguageToggle lang={lang} onChange={app.handleLanguageChange} />
            <UserMenu />
          </div>
```

- [ ] **Step 4: Verify build + visual check**

```bash
npx tsc --noEmit && npm run build
```

Then:
```bash
npm run dev -- --host 127.0.0.1 --port 5173
```

Open the app, sign in, confirm the avatar/user button appears in all three header layouts (resize the window to see the mobile chrome). Click the avatar — sign-out should return to the sign-in screen.

Stop the dev server.

- [ ] **Step 5: Commit**

```bash
git add src/components/UserMenu.tsx src/App.tsx
git commit -m "Add UserMenu to app headers"
```

---

## Task 7: Add `api-src/auth.ts` with TDD

**Files:**
- Create: `api-src/auth.ts`
- Create: `api-src/auth.test.ts`
- Modify: `vitest.config.ts`

- [ ] **Step 1: Update `vitest.config.ts` to include `api-src` tests**

Replace `vitest.config.ts` with:

```ts
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    include: ['src/**/*.test.ts', 'api-src/**/*.test.ts'],
    globals: false
  }
})
```

- [ ] **Step 2: Write the failing test**

Create `api-src/auth.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { resolveTenant } from './auth'

describe('resolveTenant', () => {
  it('derives a domain tenant from a business email', () => {
    expect(resolveTenant({ userId: 'user_1', email: 'alice@acme.com' })).toEqual({
      id: 'domain:acme.com'
    })
  })

  it('lowercases the domain', () => {
    expect(resolveTenant({ userId: 'user_1', email: 'Alice@ACME.com' })).toEqual({
      id: 'domain:acme.com'
    })
  })

  it('keeps subdomains distinct', () => {
    expect(resolveTenant({ userId: 'user_1', email: 'bob@mail.acme.com' })).toEqual({
      id: 'domain:mail.acme.com'
    })
  })

  it('routes gmail.com to a per-user tenant', () => {
    expect(resolveTenant({ userId: 'user_42', email: 'bob@gmail.com' })).toEqual({
      id: 'user:user_42'
    })
  })

  it('routes outlook.com to a per-user tenant', () => {
    expect(resolveTenant({ userId: 'user_42', email: 'bob@outlook.com' })).toEqual({
      id: 'user:user_42'
    })
  })

  it('routes proton.me to a per-user tenant', () => {
    expect(resolveTenant({ userId: 'user_42', email: 'bob@proton.me' })).toEqual({
      id: 'user:user_42'
    })
  })

  it('throws if email has no domain', () => {
    expect(() => resolveTenant({ userId: 'user_1', email: 'no-at-sign' })).toThrow()
  })
})
```

- [ ] **Step 3: Run the test to confirm it fails**

Run:
```bash
npx vitest run api-src/auth.test.ts
```

Expected: FAIL — cannot resolve `./auth`.

- [ ] **Step 4: Write the minimal implementation**

Create `api-src/auth.ts`:

```ts
import type { VercelRequest } from '@vercel/node'
import { createClerkClient, verifyToken } from '@clerk/backend'

export type AuthedUser = { userId: string; email: string }
export type Tenant = { id: string }

export class AuthError extends Error {
  status = 401
  constructor(message: string) {
    super(message)
    this.name = 'AuthError'
  }
}

const FREE_EMAIL_DOMAINS = new Set([
  'gmail.com',
  'googlemail.com',
  'outlook.com',
  'hotmail.com',
  'live.com',
  'yahoo.com',
  'icloud.com',
  'proton.me',
  'protonmail.com',
  'aol.com'
])

export const resolveTenant = (user: AuthedUser): Tenant => {
  const at = user.email.lastIndexOf('@')
  if (at < 1 || at === user.email.length - 1) {
    throw new Error(`Email "${user.email}" has no domain`)
  }
  const domain = user.email.slice(at + 1).toLowerCase()
  if (FREE_EMAIL_DOMAINS.has(domain)) {
    return { id: `user:${user.userId}` }
  }
  return { id: `domain:${domain}` }
}

const getBearerToken = (req: VercelRequest): string | null => {
  const header = req.headers.authorization ?? req.headers.Authorization
  if (typeof header !== 'string') return null
  const match = /^Bearer\s+(.+)$/i.exec(header.trim())
  return match ? match[1].trim() : null
}

let cachedClerk: ReturnType<typeof createClerkClient> | null = null
const getClerk = () => {
  if (cachedClerk) return cachedClerk
  const secretKey = process.env.CLERK_SECRET_KEY
  if (!secretKey) throw new AuthError('Auth is not configured on the server')
  cachedClerk = createClerkClient({ secretKey })
  return cachedClerk
}

export const requireUser = async (req: VercelRequest): Promise<AuthedUser> => {
  const token = getBearerToken(req)
  if (!token) throw new AuthError('Not signed in')

  let payload
  try {
    payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY ?? ''
    })
  } catch {
    throw new AuthError('Invalid or expired session')
  }

  const userId = typeof payload.sub === 'string' ? payload.sub : ''
  if (!userId) throw new AuthError('Invalid session payload')

  const clerk = getClerk()
  const user = await clerk.users.getUser(userId)
  const primary = user.emailAddresses.find(
    (address) => address.id === user.primaryEmailAddressId && address.verification?.status === 'verified'
  )
  if (!primary?.emailAddress) throw new AuthError('No verified email on this account')

  return { userId, email: primary.emailAddress }
}
```

- [ ] **Step 5: Run the tests to confirm they pass**

Run:
```bash
npx vitest run api-src/auth.test.ts
```

Expected: all 7 tests PASS.

- [ ] **Step 6: Verify the full test suite still passes**

Run:
```bash
npm test
```

Expected: all tests PASS (no regressions).

- [ ] **Step 7: Commit**

```bash
git add api-src/auth.ts api-src/auth.test.ts vitest.config.ts
git commit -m "Add requireUser and resolveTenant for tenant-derived auth"
```

---

## Task 8: Tenant-shape `signatureBlobShared.ts` with TDD

**Files:**
- Modify: `api-src/signatureBlobShared.ts`
- Create: `api-src/signatureBlobShared.test.ts`

- [ ] **Step 1: Write the failing test**

Create `api-src/signatureBlobShared.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { manifestPath, validateTenantId, zipPath } from './signatureBlobShared'

describe('validateTenantId', () => {
  it('accepts domain tenants', () => {
    expect(validateTenantId('domain:acme.com')).toBe(true)
    expect(validateTenantId('domain:mail.acme.co.uk')).toBe(true)
  })

  it('accepts user tenants', () => {
    expect(validateTenantId('user:user_2abc123')).toBe(true)
    expect(validateTenantId('user:user_ABC-123_xyz')).toBe(true)
  })

  it('rejects empty or malformed ids', () => {
    expect(validateTenantId('')).toBe(false)
    expect(validateTenantId('domain:')).toBe(false)
    expect(validateTenantId('user:')).toBe(false)
    expect(validateTenantId('acme.com')).toBe(false)
    expect(validateTenantId('domain:UPPER.com')).toBe(false)
    expect(validateTenantId('domain:acme.com/extra')).toBe(false)
    expect(validateTenantId('user:has spaces')).toBe(false)
  })
})

describe('manifestPath / zipPath', () => {
  it('writes manifests under signatures/tenants/<tenantId>/', () => {
    expect(manifestPath('domain:acme.com')).toBe(
      'signatures/tenants/domain:acme.com/manifest.json'
    )
  })

  it('writes zips under signatures/tenants/<tenantId>/<saveId>.zip', () => {
    expect(zipPath('user:user_42', 'abc-123')).toBe(
      'signatures/tenants/user:user_42/abc-123.zip'
    )
  })
})
```

- [ ] **Step 2: Run the test to confirm it fails**

Run:
```bash
npx vitest run api-src/signatureBlobShared.test.ts
```

Expected: FAIL — `validateTenantId` is not exported.

- [ ] **Step 3: Update `signatureBlobShared.ts`**

In `api-src/signatureBlobShared.ts`:

1. Delete `validateWorkspaceId` (lines 19-20).
2. Add `validateTenantId` after `validateSaveId` (around line 23):

```ts
export const validateTenantId = (value: string): boolean =>
  /^(domain:[a-z0-9.-]+|user:[A-Za-z0-9_-]+)$/.test(value)
```

3. Update `manifestPath` (line 25-26):

```ts
export const manifestPath = (tenantId: string): string =>
  `signatures/tenants/${tenantId}/manifest.json`
```

4. Update `zipPath` (line 28-29):

```ts
export const zipPath = (tenantId: string, saveId: string): string =>
  `signatures/tenants/${tenantId}/${saveId}.zip`
```

5. Update the parameter names of the helpers that take a workspaceId (`readManifest`, `writeManifest`, `saveZipToBlob`, `readZipFromBlob`, `deleteZipFromBlob`) — rename the parameter from `workspaceId` to `tenantId`. The function bodies should already work since they pass through to `manifestPath` / `zipPath`. No call to `validateWorkspaceId` remains in this file.

- [ ] **Step 4: Run the tests**

```bash
npx vitest run api-src/signatureBlobShared.test.ts
```

Expected: all tests PASS.

- [ ] **Step 5: Verify type-check (handlers still import workspaceId — temporary mismatch)**

```bash
npx tsc --noEmit
```

Expected: errors in `api-src/signatures.ts` and `api-src/signatures-download.ts` because they still reference `validateWorkspaceId`. **This is expected.** The next three tasks fix them.

Do NOT commit yet — wait until handlers are updated so the tree stays buildable when checked out at any green commit.

---

## Task 9: Cut over `api-src/signatures.ts`

**Files:**
- Modify: `api-src/signatures.ts`

- [ ] **Step 1: Replace the file**

Overwrite `api-src/signatures.ts` with:

```ts
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { randomUUID } from 'node:crypto'
import { AuthError, requireUser, resolveTenant } from './auth'
import {
  deleteZipFromBlob,
  findManifestEntryByName,
  isBlobConfigured,
  readManifest,
  saveZipToBlob,
  upsertManifestEntry,
  validateSaveId,
  writeManifest,
  type ManifestEntry
} from './signatureBlobShared'

const parseJsonBody = (body: unknown): Record<string, unknown> => {
  if (body && typeof body === 'object' && !Array.isArray(body)) {
    return body as Record<string, unknown>
  }
  if (typeof body === 'string' && body.trim()) {
    try {
      const parsed = JSON.parse(body) as unknown
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>
      }
    } catch {
      // fall through
    }
  }
  return {}
}

const blobUnavailable = (res: VercelResponse): void => {
  res.status(503).json({
    available: false,
    error: 'Blob storage is not configured. Add BLOB_READ_WRITE_TOKEN in Vercel project settings.'
  })
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  try {
    const user = await requireUser(req)
    const tenant = resolveTenant(user)

    if (!isBlobConfigured()) {
      if (req.method === 'GET') {
        res.status(200).json({ available: false, entries: [] })
        return
      }
      blobUnavailable(res)
      return
    }

    if (req.method === 'GET') {
      const manifest = await readManifest(tenant.id)
      res.status(200).json({ available: true, entries: manifest.entries })
      return
    }

    if (req.method === 'POST') {
      const body = parseJsonBody(req.body)
      const name = typeof body.name === 'string' ? body.name.trim() : ''
      const zipBase64 = typeof body.zipBase64 === 'string' ? body.zipBase64.trim() : ''
      const overwriteId =
        typeof body.overwriteId === 'string' && validateSaveId(body.overwriteId)
          ? body.overwriteId
          : undefined

      if (!name) {
        res.status(400).json({ error: 'Missing name' })
        return
      }
      if (!zipBase64) {
        res.status(400).json({ error: 'Missing zipBase64' })
        return
      }

      const zipBytes = Buffer.from(zipBase64, 'base64')
      if (!zipBytes.length) {
        res.status(400).json({ error: 'Invalid zip payload' })
        return
      }
      if (zipBytes.length > 10 * 1024 * 1024) {
        res.status(413).json({ error: 'Signature package is too large (max 10 MB).' })
        return
      }

      const manifest = await readManifest(tenant.id)
      const existingByName = findManifestEntryByName(manifest, name)
      const saveId = overwriteId ?? existingByName?.id ?? randomUUID()
      const now = Date.now()
      const entry: ManifestEntry = { id: saveId, name, savedAt: now }

      let nextManifest
      try {
        nextManifest = upsertManifestEntry(manifest, entry, overwriteId ?? existingByName?.id)
      } catch (error) {
        if (error instanceof Error && error.message === 'TOO_MANY') {
          res.status(409).json({ error: 'Too many saved signatures' })
          return
        }
        throw error
      }

      await saveZipToBlob(tenant.id, saveId, zipBytes)
      await writeManifest(tenant.id, nextManifest)

      res.status(200).json({ entry })
      return
    }

    if (req.method === 'DELETE') {
      const body = parseJsonBody(req.body)
      const saveId = typeof body.id === 'string' ? body.id.trim() : ''

      if (!validateSaveId(saveId)) {
        res.status(400).json({ error: 'Invalid id' })
        return
      }

      const manifest = await readManifest(tenant.id)
      const nextManifest = {
        version: 1 as const,
        entries: manifest.entries.filter((entry) => entry.id !== saveId)
      }

      await deleteZipFromBlob(tenant.id, saveId).catch(() => undefined)
      await writeManifest(tenant.id, nextManifest)

      res.status(200).json({ ok: true })
      return
    }

    res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    if (error instanceof AuthError) {
      res.status(error.status).json({ error: error.message })
      return
    }
    const message = error instanceof Error ? error.message : 'Blob request failed'
    console.error('[signatures]', message, error)
    res.status(500).json({ error: message })
  }
}
```

- [ ] **Step 2: Verify type-check**

```bash
npx tsc --noEmit
```

Expected: only `api-src/signatures-download.ts` errors remain. `signatures.ts` is now clean.

Do NOT commit yet — finish the download handler first.

---

## Task 10: Cut over `api-src/signatures-download.ts`

**Files:**
- Modify: `api-src/signatures-download.ts`

- [ ] **Step 1: Read the current file**

`api-src/signatures-download.ts` re-exports the download handler from `api-src/signatures.ts`. Inspect it first:

```bash
cat api-src/signatures-download.ts
```

It exports `downloadHandler` from `./signatures`. The actual logic lives in the `downloadHandler` export inside `api-src/signatures.ts` (lines 152-192 in the original file). After Task 9 deleted that export, this file is broken.

- [ ] **Step 2: Replace `signatures-download.ts` with a self-contained handler**

Overwrite `api-src/signatures-download.ts` with:

```ts
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { AuthError, requireUser, resolveTenant } from './auth'
import {
  isBlobConfigured,
  readManifest,
  readZipFromBlob,
  validateSaveId
} from './signatureBlobShared'

const blobUnavailable = (res: VercelResponse): void => {
  res.status(503).json({
    available: false,
    error: 'Blob storage is not configured. Add BLOB_READ_WRITE_TOKEN in Vercel project settings.'
  })
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  try {
    const user = await requireUser(req)
    const tenant = resolveTenant(user)

    if (!isBlobConfigured()) {
      blobUnavailable(res)
      return
    }

    if (req.method !== 'GET') {
      res.status(405).json({ error: 'Method not allowed' })
      return
    }

    const saveId = typeof req.query.id === 'string' ? req.query.id.trim() : ''
    if (!validateSaveId(saveId)) {
      res.status(400).json({ error: 'Invalid id' })
      return
    }

    const manifest = await readManifest(tenant.id)
    if (!manifest.entries.some((entry) => entry.id === saveId)) {
      res.status(404).json({ error: 'Saved signature not found' })
      return
    }

    const zipBytes = await readZipFromBlob(tenant.id, saveId)
    if (!zipBytes) {
      res.status(404).json({ error: 'Saved signature file not found' })
      return
    }

    res.setHeader('Content-Type', 'application/zip')
    res.setHeader('Cache-Control', 'private, no-store')
    res.status(200).send(zipBytes)
  } catch (error) {
    if (error instanceof AuthError) {
      res.status(error.status).json({ error: error.message })
      return
    }
    const message = error instanceof Error ? error.message : 'Download failed'
    console.error('[signatures-download]', message, error)
    res.status(500).json({ error: message })
  }
}
```

- [ ] **Step 3: Remove the now-stale `downloadHandler` export from `signatures.ts`**

Confirm via grep that `signatures.ts` from Task 9 no longer exports `downloadHandler`. If anything else in the repo references it, fix the import:

```bash
grep -rn "downloadHandler" api-src api/ src/ scripts/
```

Expected: no matches (or only matches inside `dist/` build output we don't care about — ignore those).

- [ ] **Step 4: Verify type-check and tests**

```bash
npx tsc --noEmit && npm test
```

Expected: both exit 0.

- [ ] **Step 5: Commit Tasks 8 + 9 + 10 together**

These three tasks form one buildable unit:

```bash
git add api-src/auth.ts api-src/auth.test.ts api-src/signatureBlobShared.ts api-src/signatureBlobShared.test.ts api-src/signatures.ts api-src/signatures-download.ts vitest.config.ts
git commit -m "Switch /api/signatures and /api/signatures/download to tenant-derived auth"
```

(Tasks 8-10 are committed together because the intermediate states do not type-check; the test suite is green at this point.)

---

## Task 11: Require auth on `api-src/design-signature.ts`

**Files:**
- Modify: `api-src/design-signature.ts`

`design-signature.ts` is not tenant-scoped, but the spec requires login on every endpoint. We just gate it with `requireUser`.

- [ ] **Step 1: Add the auth gate at the top of the handler**

In `api-src/design-signature.ts`, add the import near the top:

```ts
import { AuthError, requireUser } from './auth'
```

Then at the top of the `try` block inside `handler` (currently `try { if (req.method === 'GET') { ... } }`), add an auth check before the GET-handling branch:

```ts
  try {
    // Public discovery endpoint (no PII, just config flags) — still gated.
    await requireUser(req)

    if (req.method === 'GET') {
      // ...existing body unchanged...
```

And in the `catch` block, handle `AuthError` first:

```ts
  } catch (error) {
    if (error instanceof AuthError) {
      res.status(error.status).json({ error: error.message })
      return
    }
    const message = error instanceof Error ? error.message : 'AI request failed'
    console.error('[design-signature]', message, error)
    res.status(500).json({ error: message })
  }
```

- [ ] **Step 2: Verify type-check, tests, and build**

```bash
npx tsc --noEmit && npm test && npm run build
```

Expected: all exit 0. The build also bundles `api/design-signature.js` with the new auth import.

- [ ] **Step 3: Commit**

```bash
git add api-src/design-signature.ts
git commit -m "Require auth on /api/design-signature"
```

---

## Task 12: Migrate `src/lib/cloudSignatures.ts` to authenticated fetch

**Files:**
- Modify: `src/lib/cloudSignatures.ts`

- [ ] **Step 1: Add a token-aware fetch helper**

Replace the entire contents of `src/lib/cloudSignatures.ts` with:

```ts
import { blobToBase64, buildFormParamsExportZip } from './buildFormExportZip'
import { parseFormFromExportZip } from './formStorage'
import type { SignatureFormState } from '../types/signatureForm'

export type CloudSignatureEntry = {
  id: string
  name: string
  savedAt: number
}

type CloudListResponse = {
  available: boolean
  entries?: CloudSignatureEntry[]
  error?: string
}

type CloudSaveResponse = {
  entry?: CloudSignatureEntry
  error?: string
}

const apiBase = '/api/signatures'

// Set by `useCloudAuth()` in App startup. We avoid pulling React hooks into
// this module so existing call sites (none of which are React components)
// keep working unchanged.
type TokenGetter = () => Promise<string | null>
let getToken: TokenGetter = async () => null

export const setCloudAuthTokenGetter = (next: TokenGetter): void => {
  getToken = next
}

const authedFetch = async (input: RequestInfo, init: RequestInit = {}): Promise<Response> => {
  const token = await getToken()
  const headers = new Headers(init.headers)
  if (token) headers.set('Authorization', `Bearer ${token}`)
  return fetch(input, { ...init, headers })
}

export const fetchCloudSignatures = async (): Promise<{
  available: boolean
  entries: CloudSignatureEntry[]
}> => {
  const response = await authedFetch(apiBase)
  if (!response.ok) {
    return { available: false, entries: [] }
  }
  const payload = (await response.json()) as CloudListResponse
  return {
    available: Boolean(payload.available),
    entries: Array.isArray(payload.entries) ? payload.entries : []
  }
}

export const saveCloudSignature = async (
  name: string,
  form: SignatureFormState,
  overwriteId?: string
): Promise<
  | { ok: true; entry: CloudSignatureEntry }
  | { ok: false; reason: 'unavailable' | 'too_large' | 'too_many' | 'storage_failed' | 'empty_name' }
> => {
  const trimmedName = name.trim()
  if (!trimmedName) {
    return { ok: false, reason: 'empty_name' }
  }

  const zipBlob = await buildFormParamsExportZip(form)
  const zipBase64 = await blobToBase64(zipBlob)

  const response = await authedFetch(apiBase, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: trimmedName, overwriteId, zipBase64 })
  })

  if (response.status === 503) return { ok: false, reason: 'unavailable' }
  if (response.status === 413) return { ok: false, reason: 'too_large' }
  if (response.status === 409) return { ok: false, reason: 'too_many' }
  if (!response.ok) return { ok: false, reason: 'storage_failed' }

  const payload = (await response.json()) as CloudSaveResponse
  if (!payload.entry) return { ok: false, reason: 'storage_failed' }
  return { ok: true, entry: payload.entry }
}

export const loadCloudSignatureForm = async (
  id: string
): Promise<SignatureFormState | null> => {
  const response = await authedFetch(`${apiBase}/download?id=${encodeURIComponent(id)}`)
  if (!response.ok) return null

  const imported = await parseFormFromExportZip(await response.arrayBuffer())
  return imported?.kind === 'full' ? imported.form : null
}

export const deleteCloudSignature = async (id: string): Promise<boolean> => {
  const response = await authedFetch(apiBase, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id })
  })
  return response.ok
}

export const findCloudSignatureByName = (
  entries: CloudSignatureEntry[],
  name: string
): CloudSignatureEntry | null => {
  const normalized = name.trim().toLowerCase()
  if (!normalized) return null
  return entries.find((entry) => entry.name.trim().toLowerCase() === normalized) ?? null
}
```

Notes:
- `setCloudAuthTokenGetter` is the single seam where React provides the Clerk `getToken` callback. We do this rather than refactoring every call site into hooks.
- `workspaceId` and `getWorkspaceId` are gone from this file.

- [ ] **Step 2: Register the token getter once at app startup**

In `src/components/AuthGate.tsx`, expand the component to register the token getter once the user is signed in:

```tsx
import { SignedIn, SignedOut, useAuth } from '@clerk/clerk-react'
import { useEffect } from 'react'
import App from '../App'
import { SignInScreen } from './SignInScreen'
import { setCloudAuthTokenGetter } from '../lib/cloudSignatures'

const RegisterCloudAuthToken = () => {
  const { getToken, isSignedIn } = useAuth()
  useEffect(() => {
    if (!isSignedIn) return
    setCloudAuthTokenGetter(() => getToken())
  }, [getToken, isSignedIn])
  return null
}

export const AuthGate = () => {
  return (
    <>
      <SignedOut>
        <SignInScreen />
      </SignedOut>
      <SignedIn>
        <RegisterCloudAuthToken />
        <App />
      </SignedIn>
    </>
  )
}
```

- [ ] **Step 3: Verify type-check**

```bash
npx tsc --noEmit
```

Expected: errors about the now-orphan `src/lib/workspaceId.ts` import in `cloudSignatures.ts` are gone. If anything else still imports `workspaceId`, the error will show — fix by removing the import (Task 13 will delete the file entirely).

- [ ] **Step 4: Build and smoke-test**

```bash
npm run build && npm run dev -- --host 127.0.0.1 --port 5173
```

In the browser: sign in, save a signature to cloud, refresh the page, confirm it loads. Sign out, sign in as a user on a different domain, confirm the previous signature is **not** visible. Stop the dev server.

- [ ] **Step 5: Commit**

```bash
git add src/lib/cloudSignatures.ts src/components/AuthGate.tsx
git commit -m "Route cloud signature calls through Clerk-authenticated fetch"
```

---

## Task 13: Delete `src/lib/workspaceId.ts` and verify no references remain

**Files:**
- Delete: `src/lib/workspaceId.ts`

- [ ] **Step 1: Confirm zero remaining references**

```bash
grep -rn "workspaceId\|getWorkspaceId\|signitures-workspace-id" src/ api-src/ scripts/ vite.config.ts vitest.config.ts vercel.json
```

Expected: no matches. If anything still references it (defensive — should be zero after Tasks 9-12), remove those references before deleting the file.

- [ ] **Step 2: Delete the file**

```bash
git rm src/lib/workspaceId.ts
```

- [ ] **Step 3: Verify the full build + test suite is green**

```bash
npx tsc --noEmit && npm test && npm run build
```

Expected: all exit 0.

- [ ] **Step 4: Commit**

```bash
git commit -m "Remove anonymous workspaceId helper (replaced by tenant-derived auth)"
```

---

## Task 14: Preview-deploy smoke test

**Files:** none changed in this task; this is verification only.

- [ ] **Step 1: Push the branch and open a preview**

If working on a feature branch:
```bash
git push -u origin HEAD
```

Vercel creates a preview deployment automatically. Wait for the preview URL.

- [ ] **Step 2: Verify auth gate**

In an incognito window, open the preview URL.
Expected: sign-in card. No designer UI is rendered until sign-in completes.

- [ ] **Step 3: Verify domain-tenant sharing**

Sign in with two different Google accounts that share a verified business domain (e.g. two `@yourcompany.com` accounts). Save a signature in the first, sign out, sign in with the second.
Expected: the second account sees the signature saved by the first.

- [ ] **Step 4: Verify free-email isolation**

Sign out. Sign in with a `@gmail.com` account.
Expected: the signatures from the business domain are not visible. Save a new signature; sign out; sign in with a different `@gmail.com` account.
Expected: the second gmail account sees an empty list.

- [ ] **Step 5: Verify unauthenticated API is rejected**

From a terminal:
```bash
curl -i https://<preview-url>/api/signatures
```

Expected: `HTTP/2 401` with body `{"error":"Not signed in"}`.

- [ ] **Step 6: Verify Microsoft sign-in works**

Open the preview in another incognito window. Click "Continue with Microsoft" and complete the flow.
Expected: lands in the designer UI, header shows the Microsoft avatar.

- [ ] **Step 7: Open a PR**

```bash
gh pr create --title "Add multi-tenant login (Clerk + email-domain tenants)" --body "$(cat <<'EOF'
## Summary
- Adds Clerk-based social sign-in (Google + Microsoft).
- Tenants are derived from the verified email domain. Free-email domains map to a personal tenant of one.
- All cloud endpoints now require auth; `workspaceId` is removed from the client and server.

## Spec
docs/superpowers/specs/2026-06-14-multi-tenant-login-design.md

## Plan
docs/superpowers/plans/2026-06-14-multi-tenant-login.md

## Test plan
- [ ] Unauthenticated `GET /api/signatures` returns 401.
- [ ] Two users on the same business domain share signatures.
- [ ] Two users on different gmail accounts cannot see each other's signatures.
- [ ] Google sign-in works.
- [ ] Microsoft sign-in works.
- [ ] Sign-out returns to the sign-in screen.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```
