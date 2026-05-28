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

export const signatureFontPublicUrl = (fileName: string): string => {
  const base = import.meta.env.BASE_URL ?? '/'
  return `${base}signature-fonts/${fileName}`
}

export const buildBundledFontFaceCss = (fontFamily: string, assetsBase: string): string => {
  const rules: string[] = []

  for (const font of resolveBundledSignatureFonts(fontFamily)) {
    const { cssFamily, subsets } = BUNDLED_FONT_META[font]
    for (const fileName of bundledSignatureFontFileNames(font)) {
      const weightMatch = fileName.match(/-(\d+)-normal\.woff2$/)
      const weight = weightMatch?.[1] ?? '400'
      const subsetMatch = fileName.match(new RegExp(`^${font}-([a-z]+)-\\d+`))
      const subset = subsetMatch?.[1] ?? subsets[0]
      const unicodeRange = SUBSET_UNICODE_RANGE[subset]
      const src = `${assetsBase.replace(/\/$/, '')}/${fileName}`
      const rangeCss = unicodeRange ? `unicode-range:${unicodeRange};` : ''
      rules.push(
        `@font-face{font-family:'${cssFamily}';font-style:normal;font-weight:${weight};font-display:swap;${rangeCss}src:url('${src}') format('woff2');}`
      )
    }
  }

  if (!rules.length) return ''
  return `    <style>\n${rules.join('\n')}\n    </style>\n`
}
