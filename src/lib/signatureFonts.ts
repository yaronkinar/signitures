export const SIGNATURE_FONT_WEIGHTS = [300, 400, 500, 600, 700, 800] as const

export type BundledSignatureFont = 'rubik' | 'cairo'

/** Subset unicode-range values aligned with @fontsource/google-fonts metadata. */
const SUBSET_UNICODE_RANGE: Record<string, string> = {
  latin:
    'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD',
  hebrew: 'U+0307-0308,U+0590-05FF,U+200C-2010,U+20AA,U+25CC,U+FB1D-FB4F',
  arabic:
    'U+0600-06FF,U+0750-077F,U+0870-088E,U+0890-0891,U+0897-08E1,U+08E3-08FF,U+200C-200E,U+2010-2011,U+204F,U+2E41,U+FB50-FDFF,U+FE70-FE74,U+FE76-FEFC'
}

const BUNDLED_FONT_META: Record<
  BundledSignatureFont,
  { match: RegExp; cssFamily: string; subsets: readonly string[] }
> = {
  rubik: { match: /rubik/i, cssFamily: 'Rubik', subsets: ['latin', 'hebrew'] },
  cairo: { match: /cairo/i, cssFamily: 'Cairo', subsets: ['latin', 'arabic'] }
}

export const resolveBundledSignatureFonts = (fontFamily: string): BundledSignatureFont[] =>
  (Object.entries(BUNDLED_FONT_META) as [BundledSignatureFont, (typeof BUNDLED_FONT_META)[BundledSignatureFont]][])
    .filter(([, meta]) => meta.match.test(fontFamily))
    .map(([id]) => id)

export const bundledSignatureFontFileNames = (font: BundledSignatureFont): string[] => {
  const { subsets } = BUNDLED_FONT_META[font]
  return SIGNATURE_FONT_WEIGHTS.flatMap((weight) =>
    subsets.map((subset) => `${font}-${subset}-${weight}-normal.woff2`)
  )
}

export const allBundledSignatureFontFileNames = (fontFamily: string): string[] => {
  const seen = new Set<string>()
  const names: string[] = []
  for (const font of resolveBundledSignatureFonts(fontFamily)) {
    for (const file of bundledSignatureFontFileNames(font)) {
      if (seen.has(file)) continue
      seen.add(file)
      names.push(file)
    }
  }
  return names
}

export const isBundledWebFont = (fontFamily: string): boolean =>
  resolveBundledSignatureFonts(fontFamily).length > 0

export const getBundledFontCssFamily = (fontFamily: string): string | null => {
  for (const font of resolveBundledSignatureFonts(fontFamily)) {
    return BUNDLED_FONT_META[font].cssFamily
  }
  return null
}


const GOOGLE_FONT_DOWNLOAD_NAMES: Record<BundledSignatureFont, string> = {
  rubik: 'Rubik',
  cairo: 'Cairo'
}

export const googleFontDownloadUrl = (fontFamily: string): string | null => {
  for (const font of resolveBundledSignatureFonts(fontFamily)) {
    const name = GOOGLE_FONT_DOWNLOAD_NAMES[font]
    return `https://fonts.google.com/specimen/${encodeURIComponent(name)}`
  }
  return null
}

export const requiredWindowsFontTtfFileNames = (fontFamily: string): string[] =>
  resolveBundledSignatureFonts(fontFamily).map((font) => `${font}.ttf`)

export const signatureFontTtfPublicUrl = (fileName: string): string => {
  const base = import.meta.env.BASE_URL ?? '/'
  return `${base}signature-fonts-ttf/${fileName}`
}

export const requiredBundledFontFileNames = (
  fontFamily: string,
  weights: number[]
): string[] => {
  const fonts = resolveBundledSignatureFonts(fontFamily)
  if (!fonts.length) return []

  const weightSet = new Set<number>([400, ...weights])
  const names: string[] = []

  for (const font of fonts) {
    const { subsets } = BUNDLED_FONT_META[font]
    for (const weight of weightSet) {
      if (!SIGNATURE_FONT_WEIGHTS.includes(weight as (typeof SIGNATURE_FONT_WEIGHTS)[number])) {
        continue
      }
      for (const subset of subsets) {
        names.push(`${font}-${subset}-${weight}-normal.woff2`)
      }
    }
  }

  return names
}

export const signatureFontPublicUrl = (fileName: string): string => {
  const base = import.meta.env.BASE_URL ?? '/'
  return `${base}signature-fonts/${fileName}`
}

const buildFontFaceRule = (
  font: BundledSignatureFont,
  fileName: string,
  assetsBase: string
): string => {
  const { cssFamily, subsets } = BUNDLED_FONT_META[font]
  const weightMatch = fileName.match(/-(\d+)-normal\.woff2$/)
  const weight = weightMatch?.[1] ?? '400'
  const subsetMatch = fileName.match(new RegExp(`^${font}-([a-z]+)-\\d+`))
  const subset = subsetMatch?.[1] ?? subsets[0]
  const unicodeRange = SUBSET_UNICODE_RANGE[subset]
  const src = `${assetsBase.replace(/\/$/, '')}/${fileName}`
  const rangeCss = unicodeRange ? `unicode-range:${unicodeRange};` : ''
  return `@font-face{font-family:'${cssFamily}';font-style:normal;font-weight:${weight};font-display:swap;${rangeCss}src:url('${src}') format('woff2');}`
}

export const buildBundledFontFaceCss = (
  fontFamily: string,
  assetsBase: string,
  fileNames?: string[]
): string => {
  const rules: string[] = []
  const allowed = fileNames ? new Set(fileNames) : null

  for (const font of resolveBundledSignatureFonts(fontFamily)) {
    const candidates = allowed
      ? fileNames!.filter((fileName) => fileName.startsWith(`${font}-`))
      : bundledSignatureFontFileNames(font)
    for (const fileName of candidates) {
      if (allowed && !allowed.has(fileName)) continue
      rules.push(buildFontFaceRule(font, fileName, assetsBase))
    }
  }

  if (!rules.length) return ''
  return `    <style>\n${rules.join('\n')}\n    </style>\n`
}
