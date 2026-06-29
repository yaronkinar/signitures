# Google SEO Visibility — Design

## Goal

Improve general discoverability and search-result legitimacy for the public landing page at `https://signitures.dev/`. This is not tied to a specific conversion funnel — the aim is to be properly indexed by Google, render a clean rich snippet/social preview, and avoid looking unfinished in search results.

## Scope

- The single public, indexable route at `/` (the SPA has no other public routes).
- `/admin` is excluded from indexing.
- No multi-page sitemap or per-route metadata — this is a single-page app.

## Changes

### 1. `index.html` meta tags

Add to `<head>`, alongside the existing title/description/theme-color tags:

- `<link rel="canonical" href="https://signitures.dev/">`
- `<meta name="robots" content="index, follow">`
- Open Graph: `og:type` (website), `og:url`, `og:title`, `og:description`, `og:image`, `og:site_name`, `og:locale` (en_US)
- Twitter Card: `twitter:card` (summary_large_image), `twitter:title`, `twitter:description`, `twitter:image`
- JSON-LD (`<script type="application/ld+json">`) describing the app as a `WebApplication`:
  - `name`: "Outlook Signature Generator"
  - `description`: existing meta description
  - `url`: `https://signitures.dev/`
  - `image`: the new OG image
  - `applicationCategory`: "BusinessApplication"
  - `offers`: price `0` (free tier available; the app has a paid Pro tier on top, but core use is free — the JSON-LD `offers` block reflects the free entry point, not a comprehensive pricing model)

Existing `<title>` and `<meta name="description">` content stays as-is (already reasonably descriptive); only new tags are added, no rewording.

### 2. `public/robots.txt`

```
User-agent: *
Disallow: /admin
Sitemap: https://signitures.dev/sitemap.xml
```

### 3. `public/sitemap.xml`

Static file with a single `<url>` entry for `https://signitures.dev/` (no per-route entries needed — SPA has one indexable route).

### 4. OG image generation

New script `scripts/generate-og-image.mjs`, following the existing pattern in `scripts/generate-pwa-icons.mjs` (build an SVG, rasterize with `sharp`):

- 1200×630 canvas
- Background: brand color `#88236f`
- Existing icon mark (`public/icon.svg`) composited on the left/center
- App name "Outlook Signature Generator" as text
- Output: `public/og-image.png`

Wired into the `build` npm script alongside the existing `icons` step, so the image regenerates on every build (matching how `generate-pwa-icons.mjs` is already wired in).

## Out of scope

- No new routes, blog, or additional pages.
- No changes to the PWA manifest (`vite.config.ts`) — that's a separate concern from SEO meta tags.
- No Google Search Console verification meta tag — can be added later if/when the user registers the property (would need a verification token from Search Console, which isn't available yet).
