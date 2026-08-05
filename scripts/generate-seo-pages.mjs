/**
 * Generates the crawlable surface of the site into dist/ after `vite build`:
 *
 *   /                          English app shell (locale-specific head)
 *   /he                        Hebrew app shell (lang=he, dir=rtl)
 *   /guides, /he/guides        Guide indexes
 *   /guides/<slug>, /he/...    Static guide pages (no JS)
 *   /sitemap.xml               Every URL above, with hreflang alternates
 *
 * The app shells are the Vite-built index.html with the `seo:*` marker regions
 * swapped per locale. The guide pages are standalone HTML so that crawlers and
 * users receive identical markup with no render step.
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { BRAND_COLOR, SITE_URL, guides, locales } from './seo/content.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const distDir = join(root, 'dist')

const LOCALE_KEYS = Object.keys(locales)

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

/** JSON-LD sits inside a <script>, so only `<` needs neutralising. */
const embedJson = (value) => JSON.stringify(value, null, 2).replace(/</g, '\\u003c')

const absoluteUrl = (path) => `${SITE_URL}${path === '/' ? '/' : path}`

/** Every locale variant of one logical page, used for hreflang and the sitemap. */
const alternatesFor = (pathForLocale) => {
  const entries = LOCALE_KEYS.map((key) => ({ locale: key, path: pathForLocale(key) }))
  return entries
}

const renderAlternateLinks = (alternates, canonicalPath) =>
  [
    `<link rel="canonical" href="${absoluteUrl(canonicalPath)}" />`,
    ...alternates.map(
      ({ locale, path }) =>
        `<link rel="alternate" hreflang="${locale}" href="${absoluteUrl(path)}" />`
    ),
    `<link rel="alternate" hreflang="x-default" href="${absoluteUrl(
      alternates.find((entry) => entry.locale === 'en').path
    )}" />`
  ].join('\n    ')

const OG_LOCALE = { en: 'en_US', he: 'he_IL' }

const renderMetaBlock = ({
  localeKey,
  title,
  description,
  path,
  alternates,
  ogType = 'website'
}) => {
  const otherLocales = LOCALE_KEYS.filter((key) => key !== localeKey)
  return [
    `<meta name="description" content="${escapeHtml(description)}" />`,
    renderAlternateLinks(alternates, path),
    `<meta name="robots" content="index, follow, max-image-preview:large" />`,
    `<meta property="og:type" content="${ogType}" />`,
    `<meta property="og:url" content="${absoluteUrl(path)}" />`,
    `<meta property="og:title" content="${escapeHtml(title)}" />`,
    `<meta property="og:description" content="${escapeHtml(description)}" />`,
    `<meta property="og:image" content="${SITE_URL}/og-image.png" />`,
    `<meta property="og:site_name" content="${escapeHtml(locales[localeKey].siteName)}" />`,
    `<meta property="og:locale" content="${OG_LOCALE[localeKey]}" />`,
    ...otherLocales.map(
      (key) => `<meta property="og:locale:alternate" content="${OG_LOCALE[key]}" />`
    ),
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeHtml(title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(description)}" />`,
    `<meta name="twitter:image" content="${SITE_URL}/og-image.png" />`
  ].join('\n    ')
}

/**
 * Re-emits the surrounding markers so the generator stays idempotent — running
 * it twice against the same dist/ must not consume the region it needs.
 */
const replaceRegion = (html, name, replacement) => {
  const pattern = new RegExp(`<!-- seo:${name}[\\s\\S]*?<!-- /seo:${name} -->`)
  if (!pattern.test(html)) {
    throw new Error(`Missing <!-- seo:${name} --> region in index.html`)
  }
  return html.replace(pattern, `<!-- seo:${name} -->\n    ${replacement}\n    <!-- /seo:${name} -->`)
}

// ---------------------------------------------------------------------------
// App shells
// ---------------------------------------------------------------------------

const appAlternates = alternatesFor((key) => locales[key].base || '/')

const buildAppShell = (template, localeKey) => {
  const locale = locales[localeKey]
  const path = locale.base || '/'

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: locale.appTitle,
      description: locale.appDescription,
      url: absoluteUrl(path),
      image: `${SITE_URL}/og-image.png`,
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web browser',
      inLanguage: locale.lang,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: locale.siteName,
      url: absoluteUrl(path),
      inLanguage: locale.lang
    }
  ]

  let html = template
  html = html.replace(
    /<html[^>]*>/,
    `<html lang="${locale.lang}" dir="${locale.dir}" data-ui-theme="classic">`
  )
  html = replaceRegion(
    html,
    'title',
    `<title>${escapeHtml(locale.appTitle)}</title>`
  )
  html = replaceRegion(
    html,
    'meta',
    renderMetaBlock({
      localeKey,
      title: locale.appTitle,
      description: locale.appDescription,
      path,
      alternates: appAlternates
    })
  )
  html = replaceRegion(
    html,
    'jsonld',
    jsonLd
      .map((entry) => `<script type="application/ld+json">\n${embedJson(entry)}\n    </script>`)
      .join('\n    ')
  )
  return html
}

// ---------------------------------------------------------------------------
// Static guide pages
// ---------------------------------------------------------------------------

const PAGE_STYLES = `
  :root { color-scheme: light dark; --brand: ${BRAND_COLOR}; --ink: #16181d; --muted: #5a6070; --line: #e2e6ee; --bg: #ffffff; --panel: #f7f9fc; }
  @media (prefers-color-scheme: dark) { :root { --ink: #eef1f6; --muted: #a3abbd; --line: #2b303c; --bg: #14161b; --panel: #1c1f27; } }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--bg); color: var(--ink); font-family: 'Rubik', 'Assistant', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; line-height: 1.7; font-size: 17px; }
  .wrap { max-width: 720px; margin: 0 auto; padding: 24px 20px 80px; }
  a { color: var(--brand); }
  header.site { border-bottom: 1px solid var(--line); }
  header.site .wrap { padding-block: 16px; display: flex; gap: 16px; align-items: center; justify-content: space-between; }
  .brand { font-weight: 700; text-decoration: none; color: var(--ink); }
  nav.crumbs { font-size: 14px; color: var(--muted); margin: 24px 0 8px; }
  nav.crumbs a { color: var(--muted); }
  h1 { font-size: clamp(28px, 5vw, 40px); line-height: 1.2; letter-spacing: -0.02em; margin: 8px 0 16px; }
  h2 { font-size: clamp(21px, 3vw, 26px); line-height: 1.3; letter-spacing: -0.01em; margin: 44px 0 12px; }
  h3 { font-size: 18px; margin: 28px 0 8px; }
  .lede { font-size: 19px; color: var(--muted); }
  .meta { font-size: 14px; color: var(--muted); margin-bottom: 8px; }
  ol, ul { padding-inline-start: 22px; }
  li { margin: 6px 0; }
  .note { background: var(--panel); border-inline-start: 3px solid var(--brand); padding: 12px 16px; border-radius: 6px; margin: 16px 0; font-size: 16px; }
  .toc { background: var(--panel); border: 1px solid var(--line); border-radius: 10px; padding: 16px 20px; margin: 28px 0; }
  .toc p { margin: 0 0 8px; font-weight: 600; font-size: 15px; }
  .toc ul { margin: 0; }
  .cta { border: 1px solid var(--line); background: var(--panel); border-radius: 12px; padding: 24px; margin: 48px 0 0; }
  .cta h2 { margin-top: 0; }
  .btn { display: inline-block; background: var(--brand); color: #fff; text-decoration: none; font-weight: 600; padding: 12px 22px; border-radius: 8px; margin-top: 8px; }
  .faq h3 { font-size: 17px; }
  .cards { list-style: none; padding: 0; display: grid; gap: 12px; }
  .cards a { font-weight: 600; text-decoration: none; }
  .cards li { border: 1px solid var(--line); border-radius: 10px; padding: 16px 20px; margin: 0; }
  .cards p { margin: 4px 0 0; color: var(--muted); font-size: 15px; }
  footer.site { border-top: 1px solid var(--line); margin-top: 64px; }
  footer.site .wrap { padding-block: 24px; font-size: 14px; color: var(--muted); }
`

const renderDocument = ({
  localeKey,
  title,
  metaTitle,
  description,
  path,
  alternates,
  jsonLd,
  body,
  ogType
}) => {
  const locale = locales[localeKey]
  return `<!doctype html>
<html lang="${locale.lang}" dir="${locale.dir}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(metaTitle ?? title)}</title>
    <meta name="theme-color" content="${BRAND_COLOR}" />
    ${renderMetaBlock({
      localeKey,
      title: metaTitle ?? title,
      description,
      path,
      alternates,
      ogType
    })}
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <link rel="icon" href="/favicon-32.png" sizes="32x32" type="image/png" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Assistant:wght@400;600;700&family=Rubik:wght@400;500;600;700&display=swap"
      rel="stylesheet"
    />
    <style>${PAGE_STYLES}</style>
    ${jsonLd
      .map((entry) => `<script type="application/ld+json">\n${embedJson(entry)}\n    </script>`)
      .join('\n    ')}
  </head>
  <body>
    <header class="site">
      <div class="wrap">
        <a class="brand" href="${locale.base || '/'}">${escapeHtml(locale.siteName)}</a>
        <a href="${locale.base || '/'}">${escapeHtml(locale.backToApp)}</a>
      </div>
    </header>
    <main class="wrap">
${body}
    </main>
    <footer class="site">
      <div class="wrap">
        <a href="${locale.base || '/'}">${escapeHtml(locale.siteName)}</a> ·
        <a href="${locale.base}/guides">${escapeHtml(locale.guides)}</a>
      </div>
    </footer>
  </body>
</html>
`
}

const renderCta = (localeKey) => {
  const locale = locales[localeKey]
  return `      <section class="cta">
        <h2>${escapeHtml(locale.ctaHeading)}</h2>
        <p>${escapeHtml(locale.ctaBody)}</p>
        <a class="btn" href="${locale.base || '/'}">${escapeHtml(locale.ctaButton)}</a>
      </section>`
}

const slugifyHeading = (text, index) => `s${index + 1}`

const renderGuide = (guide, localeKey) => {
  const locale = locales[localeKey]
  const content = guide[localeKey]
  const path = `${locale.base}/guides/${guide.slug}`
  const alternates = alternatesFor((key) => `${locales[key].base}/guides/${guide.slug}`)

  const sectionsHtml = content.sections
    .map((section, index) => {
      const parts = [`      <h2 id="${slugifyHeading(section.h2, index)}">${escapeHtml(section.h2)}</h2>`]
      for (const paragraph of section.paragraphs ?? []) {
        parts.push(`      <p>${escapeHtml(paragraph)}</p>`)
      }
      if (section.steps) {
        parts.push('      <ol>')
        for (const step of section.steps) parts.push(`        <li>${escapeHtml(step)}</li>`)
        parts.push('      </ol>')
      }
      if (section.note) {
        parts.push(`      <p class="note">${escapeHtml(section.note)}</p>`)
      }
      return parts.join('\n')
    })
    .join('\n')

  const tocHtml = `      <nav class="toc" aria-label="${escapeHtml(locale.tocHeading)}">
        <p>${escapeHtml(locale.tocHeading)}</p>
        <ul>
${content.sections
  .map(
    (section, index) =>
      `          <li><a href="#${slugifyHeading(section.h2, index)}">${escapeHtml(
        section.h2
      )}</a></li>`
  )
  .join('\n')}
        </ul>
      </nav>`

  const faqHtml = `      <section class="faq">
        <h2>${escapeHtml(locale.faqHeading)}</h2>
${content.faq
  .map(
    (item) =>
      `        <h3>${escapeHtml(item.q)}</h3>\n        <p>${escapeHtml(item.a)}</p>`
  )
  .join('\n')}
      </section>`

  const related = guides.filter((entry) => entry.slug !== guide.slug)
  const relatedHtml = `      <section>
        <h2>${escapeHtml(locale.relatedHeading)}</h2>
        <ul class="cards">
${related
  .map(
    (entry) =>
      `          <li><a href="${locale.base}/guides/${entry.slug}">${escapeHtml(
        entry[localeKey].h1
      )}</a><p>${escapeHtml(entry[localeKey].description)}</p></li>`
  )
  .join('\n')}
        </ul>
      </section>`

  const body = `      <nav class="crumbs" aria-label="Breadcrumb">
        <a href="${locale.base || '/'}">${escapeHtml(locale.home)}</a> ›
        <a href="${locale.base}/guides">${escapeHtml(locale.guides)}</a>
      </nav>
      <h1>${escapeHtml(content.h1)}</h1>
      <p class="meta">${escapeHtml(locale.updatedLabel)} ${guide.updated}</p>
      <p class="lede">${escapeHtml(content.intro)}</p>
${tocHtml}
${sectionsHtml}
${faqHtml}
${relatedHtml}
${renderCta(localeKey)}`

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: content.h1,
      description: content.description,
      inLanguage: locale.lang,
      datePublished: guide.updated,
      dateModified: guide.updated,
      mainEntityOfPage: absoluteUrl(path),
      image: `${SITE_URL}/og-image.png`,
      publisher: { '@type': 'Organization', name: locale.siteName, url: SITE_URL }
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      inLanguage: locale.lang,
      mainEntity: content.faq.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: { '@type': 'Answer', text: item.a }
      }))
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: locale.home,
          item: absoluteUrl(locale.base || '/')
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: locale.guides,
          item: absoluteUrl(`${locale.base}/guides`)
        },
        { '@type': 'ListItem', position: 3, name: content.h1, item: absoluteUrl(path) }
      ]
    }
  ]

  return {
    path,
    html: renderDocument({
      localeKey,
      title: content.h1,
      metaTitle: content.title,
      description: content.description,
      path,
      alternates,
      jsonLd,
      body,
      ogType: 'article'
    })
  }
}

const renderGuideIndex = (localeKey) => {
  const locale = locales[localeKey]
  const path = `${locale.base}/guides`
  const alternates = alternatesFor((key) => `${locales[key].base}/guides`)

  const body = `      <nav class="crumbs" aria-label="Breadcrumb">
        <a href="${locale.base || '/'}">${escapeHtml(locale.home)}</a>
      </nav>
      <h1>${escapeHtml(locale.guidesTitle)}</h1>
      <p class="lede">${escapeHtml(locale.guidesDescription)}</p>
      <ul class="cards">
${guides
  .map(
    (guide) =>
      `        <li><a href="${locale.base}/guides/${guide.slug}">${escapeHtml(
        guide[localeKey].h1
      )}</a><p>${escapeHtml(guide[localeKey].description)}</p></li>`
  )
  .join('\n')}
      </ul>
${renderCta(localeKey)}`

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: locale.guidesTitle,
      description: locale.guidesDescription,
      url: absoluteUrl(path),
      inLanguage: locale.lang,
      hasPart: guides.map((guide) => ({
        '@type': 'Article',
        headline: guide[localeKey].h1,
        url: absoluteUrl(`${locale.base}/guides/${guide.slug}`)
      }))
    }
  ]

  return {
    path,
    html: renderDocument({
      localeKey,
      title: locale.guidesTitle,
      description: locale.guidesDescription,
      path,
      alternates,
      jsonLd,
      body
    })
  }
}

// ---------------------------------------------------------------------------
// Sitemap
// ---------------------------------------------------------------------------

const renderSitemap = (entries) => {
  const urls = entries
    .map(({ path, alternates, priority }) => {
      const links = alternates
        .map(
          ({ locale, path: altPath }) =>
            `    <xhtml:link rel="alternate" hreflang="${locale}" href="${absoluteUrl(altPath)}" />`
        )
        .join('\n')
      return `  <url>
    <loc>${absoluteUrl(path)}</loc>
${links}
    <xhtml:link rel="alternate" hreflang="x-default" href="${absoluteUrl(
      alternates.find((entry) => entry.locale === 'en').path
    )}" />
    <changefreq>monthly</changefreq>
    <priority>${priority}</priority>
  </url>`
    })
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}
</urlset>
`
}

// ---------------------------------------------------------------------------
// Build
// ---------------------------------------------------------------------------

const writePage = async (path, html) => {
  const target = join(distDir, path === '/' ? '' : path, 'index.html')
  await mkdir(dirname(target), { recursive: true })
  await writeFile(target, html, 'utf8')
}

const template = await readFile(join(distDir, 'index.html'), 'utf8')
const sitemapEntries = []

for (const localeKey of LOCALE_KEYS) {
  const locale = locales[localeKey]

  await writePage(locale.base || '/', buildAppShell(template, localeKey))
  sitemapEntries.push({
    path: locale.base || '/',
    alternates: appAlternates,
    priority: '1.0'
  })

  const index = renderGuideIndex(localeKey)
  await writePage(index.path, index.html)
  sitemapEntries.push({
    path: index.path,
    alternates: alternatesFor((key) => `${locales[key].base}/guides`),
    priority: '0.6'
  })

  for (const guide of guides) {
    const page = renderGuide(guide, localeKey)
    await writePage(page.path, page.html)
    sitemapEntries.push({
      path: page.path,
      alternates: alternatesFor((key) => `${locales[key].base}/guides/${guide.slug}`),
      priority: '0.8'
    })
  }
}

await writeFile(join(distDir, 'sitemap.xml'), renderSitemap(sitemapEntries), 'utf8')

console.log(`Generated ${sitemapEntries.length} SEO pages and sitemap.xml`)
