import type { AppLanguage } from '../i18n'
import type { SignatureFormState, SignatureLayoutSettings, TextAlign } from '../types/signatureForm'
import type { SignatureFormSnapshot } from '../aiSignatureDesign'
import { buildBundledFontFaceCss } from './signatureFonts'

export const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')

export const hasHebrew = (value: string): boolean => /[\u0590-\u05FF]/.test(value)

export const sanitizeFontFamily = (value: string): string => {
  const cleaned = value.replace(/[;{}<>]/g, '').trim()
  return cleaned || "'Rubik', Arial, Helvetica, sans-serif"
}

/** First web-safe face in the stack — used for Outlook `mso-font-alt` when the primary font is missing. */
export const getOutlookFontAlt = (fontFamily: string): string => {
  const parts = fontFamily
    .split(',')
    .map((part) => part.trim().replace(/^['"]|['"]$/g, ''))
    .filter(Boolean)

  const webSafe =
    parts.find((part) =>
      /^(Arial|Helvetica|Tahoma|Verdana|Times New Roman|Georgia|Calibri|Segoe UI|Trebuchet MS)$/i.test(
        part
      )
    ) ?? parts[parts.length - 1]

  return webSafe || 'Arial'
}

export const outlookFontFamilyStyle = (fontFamily: string): string => {
  const css = escapeHtml(sanitizeFontFamily(fontFamily))
  const alt = escapeHtml(getOutlookFontAlt(fontFamily))
  return `font-family:${css};mso-font-alt:${alt};`
}

export const parseNumberInput = (
  value: string | number,
  fallback: number,
  min: number,
  max: number,
  decimals = 0
): number => {
  const parsed = typeof value === 'number' ? value : Number.parseFloat(value)
  if (!Number.isFinite(parsed)) return fallback
  const clamped = Math.min(max, Math.max(min, parsed))
  if (decimals <= 0) return Math.round(clamped)
  return Number(clamped.toFixed(decimals))
}

export const parseEnumInput = <T extends string>(
  value: string,
  allowed: readonly T[],
  fallback: T
): T => (allowed.includes(value as T) ? (value as T) : fallback)

export const normalizeHexColor = (value: string): string | null => {
  const trimmed = value.trim()
  if (!trimmed) return null
  const withHash = trimmed.startsWith('#') ? trimmed : `#${trimmed}`
  if (/^#[0-9a-fA-F]{6}$/.test(withHash)) return withHash.toLowerCase()
  if (/^#[0-9a-fA-F]{3}$/.test(withHash)) {
    const h = withHash.slice(1)
    return `#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`.toLowerCase()
  }
  return null
}

const parseInlineStyleColor = (style: string): string | null => {
  const match = style.match(/(?:^|;)\s*color\s*:\s*([^;]+)/i)
  if (!match) return null
  return normalizeHexColor(match[1].trim())
}

/** Allows plain text, line breaks, and span color tags for signature text fields. */
export const sanitizeSignatureInlineHtml = (raw: string): string => {
  const trimmed = raw.trim()
  if (!trimmed) return ''
  if (!/[<>]/.test(trimmed)) return escapeHtml(trimmed)

  const out: string[] = []
  const openSpanCount = { value: 0 }
  const tagRegex = /<\/?([a-zA-Z]+)(?:\s+style\s*=\s*['"]([^'"]*)['"])?\s*\/?>/gi
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = tagRegex.exec(trimmed)) !== null) {
    if (match.index > lastIndex) {
      out.push(escapeHtml(trimmed.slice(lastIndex, match.index)))
    }

    const [full, tagName, styleAttr = ''] = match
    const tag = tagName.toLowerCase()
    const isClose = full.startsWith('</')

    if (tag === 'br' && !isClose) {
      out.push('<br />')
    } else if (tag === 'span') {
      if (isClose) {
        if (openSpanCount.value > 0) {
          openSpanCount.value -= 1
          out.push('</span>')
        }
      } else if (!/\/>\s*$/.test(full)) {
        const color = parseInlineStyleColor(styleAttr)
        if (color) {
          openSpanCount.value += 1
          out.push(`<span style="color:${color};">`)
        }
      }
    }

    lastIndex = tagRegex.lastIndex
  }

  if (lastIndex < trimmed.length) {
    out.push(escapeHtml(trimmed.slice(lastIndex)))
  }

  while (openSpanCount.value > 0) {
    openSpanCount.value -= 1
    out.push('</span>')
  }

  return out.join('')
}

export const parseColorInput = (value: string, fallback: string): string =>
  normalizeHexColor(value) ?? fallback

export const parseFontWeightInput = (value: string | number, fallback: number): number =>
  Number(parseEnumInput(String(value), ['300', '400', '500', '600', '700', '800'] as const, String(fallback)))

export const normalizeUrl = (value: string): string => {
  const trimmed = value.trim()
  if (!trimmed) return ''
  if (/^data:image\//i.test(trimmed)) return trimmed
  if (/^https?:\/\//i.test(trimmed) || /^mailto:/i.test(trimmed) || /^tel:/i.test(trimmed)) {
    return trimmed
  }
  return `https://${trimmed}`
}

export const fileToDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '')
    reader.onerror = () => reject(new Error('Cannot read file'))
    reader.readAsDataURL(file)
  })

const SIGNATURE_GOOGLE_FONT_STYLESHEETS: { match: RegExp; href: string }[] = [
  {
    match: /rubik/i,
    href: 'https://fonts.googleapis.com/css2?family=Rubik:wght@300;400;500;600;700;800&display=swap'
  },
  {
    match: /cairo/i,
    href: 'https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800&display=swap'
  }
]

export type WrapHtmlDocumentOptions = {
  fontFamily?: string
  /** Relative folder for bundled .woff2 files (e.g. "fonts" in bulk ZIP). */
  bundledFontAssetsBase?: string
  /** Limit @font-face rules to these bundled files. */
  bundledFontFileNames?: string[]
}

export const getSignatureFontHeadContent = (
  fontFamily: string,
  options: { bundledFontAssetsBase?: string; bundledFontFileNames?: string[] } = {}
): string => {
  const seen = new Set<string>()
  const parts: string[] = []

  for (const { match, href } of SIGNATURE_GOOGLE_FONT_STYLESHEETS) {
    if (!match.test(fontFamily) || seen.has(href)) continue
    seen.add(href)
    parts.push(`    <link rel="stylesheet" href="${href}" />`)
  }

  if (options.bundledFontAssetsBase) {
    const bundledCss = buildBundledFontFaceCss(
      fontFamily,
      options.bundledFontAssetsBase,
      options.bundledFontFileNames
    )
    if (bundledCss) parts.push(bundledCss.trimEnd())
  }

  return parts.length ? `${parts.join('\n')}\n` : ''
}

export const wrapHtmlDocument = (
  bodyHtml: string,
  lang: AppLanguage,
  fontFamilyOrOptions?: string | WrapHtmlDocumentOptions
): string => {
  const options: WrapHtmlDocumentOptions =
    typeof fontFamilyOrOptions === 'string'
      ? { fontFamily: fontFamilyOrOptions }
      : (fontFamilyOrOptions ?? {})

  const fontHead = options.fontFamily
    ? getSignatureFontHeadContent(options.fontFamily, {
        bundledFontAssetsBase: options.bundledFontAssetsBase,
        bundledFontFileNames: options.bundledFontFileNames
      })
    : ''

  return `<!doctype html>
<html lang="${lang}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Outlook Signature</title>
${fontHead}  </head>
  <body dir="ltr" style="margin:0;padding:0;direction:ltr;">
${bodyHtml}
  </body>
</html>`
}

export const getLayoutSettings = (form: SignatureFormState): SignatureLayoutSettings => ({
  fontFamily: sanitizeFontFamily(form.fontFamily),
  nameFontWeight: parseFontWeightInput(form.nameFontWeight, 700),
  titleFontWeight: parseFontWeightInput(form.titleFontWeight, 600),
  bodyFontWeight: parseFontWeightInput(form.bodyFontWeight, 400),
  nameFontSize: parseNumberInput(form.nameFontSize, 28, 14, 72),
  titleFontSize: parseNumberInput(form.titleFontSize, 19, 10, 48),
  bodyFontSize: parseNumberInput(form.bodyFontSize, 12, 9, 24),
  lineSpacing: parseNumberInput(form.lineSpacing, 1.1, 1, 2, 2),
  signatureWidth: parseNumberInput(form.signatureWidth, 400, 250, 900),
  signatureHeight: parseNumberInput(form.signatureHeight, 200, 120, 500),
  textColumnWidth: parseNumberInput(form.textColumnWidth, 252, 120, 760),
  logoMaxWidth: parseNumberInput(form.logoMaxWidth, 122, 60, 400),
  textAlign: parseEnumInput(form.textAlign, ['left', 'center', 'right'] as const, 'right'),
  nameTitleAlign: parseEnumInput(
    form.nameTitleAlign,
    ['left', 'center', 'right'] as const,
    'right'
  ),
  emailAlign: parseEnumInput(form.emailAlign, ['left', 'center', 'right'] as const, 'right'),
  logoAlign: parseEnumInput(form.logoAlign, ['left', 'center', 'right'] as const, 'right'),
  logoSide: parseEnumInput(form.logoSide, ['left', 'right'] as const, 'right'),
  verticalAlign: parseEnumInput(
    form.verticalAlign,
    ['top', 'middle', 'bottom'] as const,
    'top'
  ),
  textOffsetX: parseNumberInput(form.textOffsetX, 0, -120, 120),
  textOffsetY: parseNumberInput(form.textOffsetY, 0, -120, 120),
  logoOffsetX: parseNumberInput(form.logoOffsetX, 10, -120, 120),
  logoOffsetY: parseNumberInput(form.logoOffsetY, 6, -120, 120),
  dividerThickness: parseNumberInput(form.dividerThickness, 2, 0, 10),
  socialIconGap: parseNumberInput(form.socialIconGap, 5, 0, 20),
  accentColor: parseColorInput(form.accentColor, '#88236f'),
  textColor: parseColorInput(form.textColor, '#4c4c4e'),
  secondaryTextColor: parseColorInput(form.secondaryTextColor, '#4d4c4f'),
  dividerColor: parseColorInput(form.dividerColor, '#30bbed'),
  linkColor: parseColorInput(form.linkColor, '#33ccff'),
  backgroundColor: parseColorInput(form.backgroundColor, '#ffffff'),
  nameColor: parseColorInput(form.nameColor, parseColorInput(form.accentColor, '#88236f')),
  jobTitleColor: parseColorInput(
    form.jobTitleColor,
    parseColorInput(form.secondaryTextColor, '#4d4c4f')
  ),
  companyColor: parseColorInput(
    form.companyColor,
    parseColorInput(form.secondaryTextColor, '#4d4c4f')
  ),
  contactLabelColor: parseColorInput(
    form.contactLabelColor,
    parseColorInput(form.secondaryTextColor, '#4d4c4f')
  ),
  phoneColor: parseColorInput(form.phoneColor, parseColorInput(form.accentColor, '#88236f')),
  emailColor: parseColorInput(form.emailColor, parseColorInput(form.accentColor, '#88236f')),
  websiteColor: parseColorInput(form.websiteColor, parseColorInput(form.linkColor, '#33ccff'))
})

export const formToSnapshot = (form: SignatureFormState): SignatureFormSnapshot => {
  const layout = getLayoutSettings(form)
  return {
    signatureLanguage: form.signatureLanguage,
    fullName: form.fullName.trim(),
    jobTitle: form.jobTitle.trim(),
    company: form.company.trim(),
    phone: form.phone.trim(),
    email: form.email.trim(),
    website: form.website.trim(),
    fontFamily: layout.fontFamily,
    nameFontWeight: layout.nameFontWeight,
    titleFontWeight: layout.titleFontWeight,
    bodyFontWeight: layout.bodyFontWeight,
    nameFontSize: layout.nameFontSize,
    titleFontSize: layout.titleFontSize,
    bodyFontSize: layout.bodyFontSize,
    lineSpacing: layout.lineSpacing,
    signatureWidth: layout.signatureWidth,
    signatureHeight: layout.signatureHeight,
    textColumnWidth: layout.textColumnWidth,
    logoMaxWidth: layout.logoMaxWidth,
    textAlign: layout.textAlign,
    nameTitleAlign: layout.nameTitleAlign,
    emailAlign: layout.emailAlign,
    logoAlign: layout.logoAlign,
    logoSide: layout.logoSide,
    verticalAlign: layout.verticalAlign,
    accentColor: layout.accentColor,
    secondaryTextColor: layout.secondaryTextColor,
    socialIconGap: layout.socialIconGap,
    dividerThickness: layout.dividerThickness
  }
}

export const getDefaultDesignSnapshot = (lang: AppLanguage): SignatureFormSnapshot => ({
  signatureLanguage: lang,
  fullName: '',
  jobTitle: '',
  company: '',
  phone: '',
  email: '',
  website: '',
  fontFamily: "'Rubik', Arial, Helvetica, sans-serif",
  nameFontWeight: 700,
  titleFontWeight: 600,
  bodyFontWeight: 400,
  nameFontSize: 28,
  titleFontSize: 19,
  bodyFontSize: 12,
  lineSpacing: 1.1,
  signatureWidth: 400,
  signatureHeight: 200,
  textColumnWidth: 252,
  logoMaxWidth: 122,
  textAlign: 'right',
  nameTitleAlign: 'right',
  emailAlign: 'right',
  logoAlign: 'right',
  logoSide: 'right',
  verticalAlign: 'top',
  accentColor: '#88236f',
  secondaryTextColor: '#4d4c4f',
  socialIconGap: 5,
  dividerThickness: 2
})

export const alignForHebrew = (form: SignatureFormState): SignatureFormState => ({
  ...form,
  textAlign: 'right',
  nameTitleAlign: 'right',
  emailAlign: 'right'
})
