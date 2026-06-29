# Google SEO Visibility Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `https://signitures.dev/` properly indexable and present a clean, complete result in Google search and social link previews.

**Architecture:** This is a single-page Vite/React app with one indexable route (`/`) and an excluded admin route (`/admin`). All changes are static: new meta tags in `index.html`, a generated OG image, and two new static files (`robots.txt`, `sitemap.xml`) in `public/`. No application code, routing, or runtime behavior changes.

**Tech Stack:** Vite, `sharp` (already a devDependency, used by `scripts/generate-pwa-icons.mjs`), plain HTML/SVG/XML.

---

### Task 1: OG image generation script

**Files:**
- Create: `scripts/generate-og-image.mjs`
- Modify: `package.json:9` (build script)

- [ ] **Step 1: Write the script**

Create `scripts/generate-og-image.mjs`:

```js
import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const publicDir = join(root, 'public')
const iconSvg = await readFile(join(publicDir, 'icon.svg'), 'utf8')

const WIDTH = 1200
const HEIGHT = 630
const BRAND_COLOR = '#88236f'
const ICON_SIZE = 220
const ICON_X = 140
const ICON_Y = (HEIGHT - ICON_SIZE) / 2

const iconDataUri = `data:image/svg+xml;base64,${Buffer.from(iconSvg).toString('base64')}`

const ogSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <rect width="${WIDTH}" height="${HEIGHT}" fill="${BRAND_COLOR}"/>
  <image href="${iconDataUri}" x="${ICON_X}" y="${ICON_Y}" width="${ICON_SIZE}" height="${ICON_SIZE}"/>
  <text x="${ICON_X + ICON_SIZE + 60}" y="${HEIGHT / 2 - 20}" font-family="Arial, sans-serif" font-size="56" font-weight="700" fill="#ffffff">Outlook Signature</text>
  <text x="${ICON_X + ICON_SIZE + 60}" y="${HEIGHT / 2 + 50}" font-family="Arial, sans-serif" font-size="56" font-weight="700" fill="#ffffff">Generator</text>
</svg>
`

await sharp(Buffer.from(ogSvg)).png().toFile(join(publicDir, 'og-image.png'))

console.log('Generated public/og-image.png')
```

- [ ] **Step 2: Run the script and verify output**

Run: `node scripts/generate-og-image.mjs`
Expected: prints `Generated public/og-image.png`, and `public/og-image.png` exists.

Verify dimensions:
```bash
node -e "import('sharp').then(({default: sharp}) => sharp('public/og-image.png').metadata().then(m => console.log(m.width, m.height)))"
```
Expected output: `1200 630`

- [ ] **Step 3: Wire into the build script**

Modify `package.json` build script (currently):
```json
"build": "node scripts/generate-pwa-icons.mjs && node scripts/copy-signature-fonts.mjs && vite build && node scripts/bundle-api.mjs",
```

Change to:
```json
"build": "node scripts/generate-pwa-icons.mjs && node scripts/generate-og-image.mjs && node scripts/copy-signature-fonts.mjs && vite build && node scripts/bundle-api.mjs",
```

- [ ] **Step 4: Commit**

```bash
git add scripts/generate-og-image.mjs package.json public/og-image.png
git commit -m "Add OG image generation script for social/search previews"
```

---

### Task 2: SEO meta tags and structured data in `index.html`

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Add canonical link, robots meta, Open Graph, Twitter Card, and JSON-LD tags**

In `index.html`, after the existing `<meta name="theme-color" ...>` line (line 7) and before the font preconnect links, insert:

```html
    <link rel="canonical" href="https://signitures.dev/" />
    <meta name="robots" content="index, follow" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://signitures.dev/" />
    <meta property="og:title" content="Outlook Signature Generator" />
    <meta property="og:description" content="Create Outlook email signatures with AI design and bulk Excel export." />
    <meta property="og:image" content="https://signitures.dev/og-image.png" />
    <meta property="og:site_name" content="Outlook Signature Generator" />
    <meta property="og:locale" content="en_US" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="Outlook Signature Generator" />
    <meta name="twitter:description" content="Create Outlook email signatures with AI design and bulk Excel export." />
    <meta name="twitter:image" content="https://signitures.dev/og-image.png" />
```

Before the closing `</head>` tag, insert the JSON-LD block:

```html
    <script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Outlook Signature Generator",
        "description": "Create Outlook email signatures with AI design and bulk Excel export.",
        "url": "https://signitures.dev/",
        "image": "https://signitures.dev/og-image.png",
        "applicationCategory": "BusinessApplication",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "USD"
        }
      }
    </script>
```

- [ ] **Step 2: Verify the HTML is well-formed**

Run: `npx vite build --mode development 2>&1 | tail -20` or simply start the dev server and check the page loads without console errors:

```bash
npm run dev
```

Open `http://localhost:5173/` in a browser, view page source (or use browser devtools `document.head.innerHTML`), and confirm:
- The new `<link>`, `<meta>`, and `<script type="application/ld+json">` tags are present
- The JSON-LD parses as valid JSON: `JSON.parse(document.querySelector('script[type="application/ld+json"]').textContent)` in the browser console returns the object without throwing

Stop the dev server after verifying (Ctrl+C).

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "Add canonical, Open Graph, Twitter Card, and JSON-LD meta tags"
```

---

### Task 3: `robots.txt` and `sitemap.xml`

**Files:**
- Create: `public/robots.txt`
- Create: `public/sitemap.xml`

- [ ] **Step 1: Create `public/robots.txt`**

```
User-agent: *
Disallow: /admin
Sitemap: https://signitures.dev/sitemap.xml
```

- [ ] **Step 2: Create `public/sitemap.xml`**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://signitures.dev/</loc>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
```

- [ ] **Step 3: Verify both files are served correctly after build**

Run:
```bash
npm run build
```

Confirm both files were copied into `dist/`:
```bash
ls dist/robots.txt dist/sitemap.xml dist/og-image.png
```
Expected: all three paths print without "No such file" errors.

- [ ] **Step 4: Commit**

```bash
git add public/robots.txt public/sitemap.xml
git commit -m "Add robots.txt and sitemap.xml"
```

---

### Task 4: Full build verification

**Files:** none (verification only)

- [ ] **Step 1: Run the full build**

```bash
npm run build
```
Expected: exits 0, no errors. Confirms the new `generate-og-image.mjs` step doesn't break the existing build chain (icons → OG image → fonts → vite build → bundle-api).

- [ ] **Step 2: Run existing test suite to confirm no regressions**

```bash
npm test
```
Expected: all existing tests still pass (these changes don't touch any tested application code, so this should be unaffected — this step is a safety check).

- [ ] **Step 3: Spot-check the built `dist/index.html`**

```bash
grep -c "og:image\|canonical\|application/ld+json" dist/index.html
```
Expected: a non-zero count, confirming the new tags survived the Vite build/minification.
