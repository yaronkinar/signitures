import type { SignatureFormState, SignatureLayoutSettings } from '../types/signatureForm'
import {
  getBundledFontCssFamily,
  requiredBundledFontFileNames,
  signatureFontPublicUrl
} from './signatureFonts'
import { hasHebrew } from './signatureUtils'

export type SignatureTextImageSlot = {
  dataUrl: string
  width: number
  height: number
  alt: string
}

export type SignatureTextImages = {
  name?: SignatureTextImageSlot
  titleBlock?: SignatureTextImageSlot
}

const WEB_SAFE_FONT_RE =
  /^(Arial|Helvetica|Tahoma|Verdana|Times New Roman|Georgia|Calibri|Segoe UI|Trebuchet MS|Rubik|Cairo)$/i

const stripInlineHtmlToPlainText = (value: string): string =>
  value
    .trim()
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/span>/gi, '')
    .replace(/<[^>]+>/g, '')

const primaryCssFontFamily = (fontFamily: string): string => {
  const bundled = getBundledFontCssFamily(fontFamily)
  if (bundled) return bundled

  const first = fontFamily.split(',')[0]?.trim().replace(/^['"]|['"]$/g, '') ?? 'Arial'
  return first || 'Arial'
}

const loadedFontFamilies = new Set<string>()

const loadBundledFontForCanvas = async (
  fontFamily: string,
  fontWeight: number
): Promise<void> => {
  const cssFamily = getBundledFontCssFamily(fontFamily)
  if (!cssFamily || loadedFontFamilies.has(cssFamily)) return

  const fileNames = requiredBundledFontFileNames(fontFamily, [fontWeight])
  for (const fileName of fileNames) {
    const face = new FontFace(
      cssFamily,
      `url(${signatureFontPublicUrl(fileName)}) format('woff2')`,
      { weight: String(fontWeight), style: 'normal' }
    )
    await face.load()
    document.fonts.add(face)
  }

  loadedFontFamilies.add(cssFamily)
}

const ensureCanvasFont = async (
  fontFamily: string,
  fontWeight: number,
  fontSize: number
): Promise<string> => {
  const cssFamily = primaryCssFontFamily(fontFamily)
  if (!WEB_SAFE_FONT_RE.test(cssFamily)) {
    await loadBundledFontForCanvas(fontFamily, fontWeight)
  }

  const fontSpec = `${fontWeight} ${fontSize}px "${cssFamily}"`
  try {
    await document.fonts.load(fontSpec)
  } catch {
    // Fall back to system fonts if loading fails.
  }

  return cssFamily
}

type RenderTextBlockOptions = {
  lines: string[]
  fontFamily: string
  fontWeight: number
  fontSize: number
  lineHeight: number
  colors: string[]
  direction: 'ltr' | 'rtl'
  align: 'left' | 'center' | 'right'
  maxWidth: number
}

const renderTextBlockToImage = async (
  options: RenderTextBlockOptions
): Promise<SignatureTextImageSlot | null> => {
  const nonEmpty = options.lines.map((line) => line.trim()).filter(Boolean)
  if (!nonEmpty.length) return null

  const cssFamily = await ensureCanvasFont(
    options.fontFamily,
    options.fontWeight,
    options.fontSize
  )

  const measureCanvas = document.createElement('canvas')
  const measureCtx = measureCanvas.getContext('2d')
  if (!measureCtx) return null

  measureCtx.font = `${options.fontWeight} ${options.fontSize}px "${cssFamily}", Arial, Helvetica, sans-serif`

  const lineGap = options.fontSize * options.lineHeight
  let maxLineWidth = 0
  for (const line of nonEmpty) {
    maxLineWidth = Math.max(maxLineWidth, measureCtx.measureText(line).width)
  }

  const width = Math.min(Math.ceil(maxLineWidth) + 2, options.maxWidth)
  const height = Math.ceil(options.fontSize + (nonEmpty.length - 1) * lineGap + 2)

  const canvas = document.createElement('canvas')
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  canvas.width = Math.max(1, Math.ceil(width * dpr))
  canvas.height = Math.max(1, Math.ceil(height * dpr))

  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  ctx.scale(dpr, dpr)
  ctx.clearRect(0, 0, width, height)
  ctx.font = `${options.fontWeight} ${options.fontSize}px "${cssFamily}", Arial, Helvetica, sans-serif`
  ctx.direction = options.direction
  ctx.textBaseline = 'top'
  ctx.textAlign = options.align

  const x =
    options.align === 'left' ? 0 : options.align === 'center' ? width / 2 : width

  nonEmpty.forEach((line, index) => {
    ctx.fillStyle = options.colors[index] ?? options.colors[0] ?? '#000000'
    ctx.fillText(line, x, 1 + index * lineGap)
  })

  return {
    dataUrl: canvas.toDataURL('image/png'),
    width,
    height,
    alt: nonEmpty.join(' — ')
  }
}

export const generateSignatureTextImages = async (
  form: SignatureFormState,
  layout: SignatureLayoutSettings
): Promise<SignatureTextImages | undefined> => {
  if (!form.rasterizeNameTitle) return undefined

  const rtlContent =
    form.signatureLanguage === 'he' ||
    [form.fullName, form.jobTitle, form.company].some((value) => hasHebrew(value))
  const direction: 'ltr' | 'rtl' = rtlContent ? 'rtl' : 'ltr'
  const align = layout.nameTitleAlign

  const maxWidth = Math.max(120, layout.textColumnWidth - 16)
  const nameLineHeight = Math.max(1, layout.lineSpacing - 0.35)
  const titleLineHeight = Math.max(1, layout.lineSpacing - 0.3)

  const fullName = stripInlineHtmlToPlainText(form.fullName)
  const jobTitle = stripInlineHtmlToPlainText(form.jobTitle)
  const company = stripInlineHtmlToPlainText(form.company)

  const titleLines = [jobTitle, company].filter(Boolean)
  const titleColors =
    jobTitle && company
      ? [layout.jobTitleColor, layout.companyColor]
      : jobTitle
        ? [layout.jobTitleColor]
        : [layout.companyColor]

  const [name, titleBlock] = await Promise.all([
    fullName
      ? renderTextBlockToImage({
          lines: [fullName],
          fontFamily: layout.fontFamily,
          fontWeight: layout.nameFontWeight,
          fontSize: layout.nameFontSize,
          lineHeight: nameLineHeight,
          colors: [layout.nameColor],
          direction,
          align,
          maxWidth
        })
      : Promise.resolve(null),
    titleLines.length
      ? renderTextBlockToImage({
          lines: titleLines,
          fontFamily: layout.fontFamily,
          fontWeight: layout.titleFontWeight,
          fontSize: layout.titleFontSize,
          lineHeight: titleLineHeight,
          colors: titleColors,
          direction,
          align,
          maxWidth
        })
      : Promise.resolve(null)
  ])

  const images: SignatureTextImages = {}
  if (name) images.name = name
  if (titleBlock) images.titleBlock = titleBlock
  return Object.keys(images).length ? images : undefined
}
