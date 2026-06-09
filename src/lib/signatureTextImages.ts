import { signatureStrings } from '../i18n'
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

export type SignatureContactLabelImages = {
  phone?: SignatureTextImageSlot
  email?: SignatureTextImageSlot
  website?: SignatureTextImageSlot
}

export type SignatureTextImages = {
  name?: SignatureTextImageSlot
  titleBlock?: SignatureTextImageSlot
  contactLabels?: SignatureContactLabelImages
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

const measureLineWidth = (ctx: CanvasRenderingContext2D, line: string): number =>
  ctx.measureText(line).width

const wrapLineByChars = (
  ctx: CanvasRenderingContext2D,
  line: string,
  maxWidth: number
): string[] => {
  const chars = [...line]
  if (!chars.length) return []

  const lines: string[] = []
  let current = ''
  for (const char of chars) {
    const candidate = current + char
    if (measureLineWidth(ctx, candidate) <= maxWidth) {
      current = candidate
      continue
    }

    if (current) lines.push(current)
    current = measureLineWidth(ctx, char) <= maxWidth ? char : ''
  }

  if (current) lines.push(current)
  return lines.length ? lines : [line]
}

const wrapLineToMaxWidth = (
  ctx: CanvasRenderingContext2D,
  line: string,
  maxWidth: number
): string[] => {
  const trimmed = line.trim()
  if (!trimmed) return []
  if (measureLineWidth(ctx, trimmed) <= maxWidth) return [trimmed]

  const words = trimmed.split(/\s+/).filter(Boolean)
  if (words.length <= 1) return wrapLineByChars(ctx, trimmed, maxWidth)

  const lines: string[] = []
  let current = ''
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word
    if (measureLineWidth(ctx, candidate) <= maxWidth) {
      current = candidate
      continue
    }

    if (current) lines.push(current)
    if (measureLineWidth(ctx, word) > maxWidth) {
      lines.push(...wrapLineByChars(ctx, word, maxWidth))
      current = ''
    } else {
      current = word
    }
  }

  if (current) lines.push(current)
  return lines.length ? lines : wrapLineByChars(ctx, trimmed, maxWidth)
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

  const fontCss = `${options.fontWeight} ${options.fontSize}px "${cssFamily}", Arial, Helvetica, sans-serif`
  measureCtx.font = fontCss

  const wrappedLines: string[] = []
  const lineColors: string[] = []
  nonEmpty.forEach((line, sourceIndex) => {
    const segments = wrapLineToMaxWidth(measureCtx, line, options.maxWidth)
    const color = options.colors[sourceIndex] ?? options.colors[0] ?? '#000000'
    for (const segment of segments) {
      wrappedLines.push(segment)
      lineColors.push(color)
    }
  })

  if (!wrappedLines.length) return null

  const lineGap = options.fontSize * options.lineHeight
  let maxLineWidth = 0
  for (const line of wrappedLines) {
    maxLineWidth = Math.max(maxLineWidth, measureLineWidth(measureCtx, line))
  }

  const usedFullColumnWidth =
    wrappedLines.length > nonEmpty.length || maxLineWidth >= options.maxWidth - 1
  const width = usedFullColumnWidth
    ? options.maxWidth
    : Math.min(Math.ceil(maxLineWidth) + 2, options.maxWidth)
  const height = Math.ceil(options.fontSize + (wrappedLines.length - 1) * lineGap + 2)

  const canvas = document.createElement('canvas')
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  canvas.width = Math.max(1, Math.ceil(width * dpr))
  canvas.height = Math.max(1, Math.ceil(height * dpr))

  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  ctx.scale(dpr, dpr)
  ctx.clearRect(0, 0, width, height)
  ctx.font = fontCss
  ctx.direction = options.direction
  ctx.textBaseline = 'top'
  ctx.textAlign = options.align

  const x =
    options.align === 'left' ? 0 : options.align === 'center' ? width / 2 : width

  wrappedLines.forEach((line, index) => {
    ctx.fillStyle = lineColors[index] ?? options.colors[0] ?? '#000000'
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
  const jobTitleLines = stripInlineHtmlToPlainText(form.jobTitle)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
  const company = stripInlineHtmlToPlainText(form.company)

  const titleLines = [...jobTitleLines, ...(company ? [company] : [])]
  const titleColors = [
    ...jobTitleLines.map(() => layout.jobTitleColor),
    ...(company ? [layout.companyColor] : [])
  ]

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

  const showContactLabels = form.showContactLabels !== false
  const labelStrings = signatureStrings[form.signatureLanguage]
  const renderLabel = (
    value: string,
    text: string
  ): Promise<SignatureTextImageSlot | null> =>
    showContactLabels && value.trim()
      ? renderTextBlockToImage({
          lines: [text],
          fontFamily: layout.fontFamily,
          fontWeight: layout.titleFontWeight,
          fontSize: layout.bodyFontSize,
          lineHeight: 1,
          colors: [layout.contactLabelColor],
          direction,
          align,
          maxWidth: Math.max(40, layout.textColumnWidth)
        })
      : Promise.resolve(null)

  const [phoneLabel, emailLabel, websiteLabel] = await Promise.all([
    renderLabel(form.phone, labelStrings.phoneLabel),
    renderLabel(form.email, labelStrings.emailLabel),
    renderLabel(form.website, labelStrings.websiteLabel)
  ])

  const contactLabels: SignatureContactLabelImages = {}
  if (phoneLabel) contactLabels.phone = phoneLabel
  if (emailLabel) contactLabels.email = emailLabel
  if (websiteLabel) contactLabels.website = websiteLabel

  const images: SignatureTextImages = {}
  if (name) images.name = name
  if (titleBlock) images.titleBlock = titleBlock
  if (Object.keys(contactLabels).length) images.contactLabels = contactLabels
  return Object.keys(images).length ? images : undefined
}
