import { toBlob } from 'html-to-image'
import { buildExportBaseName } from './buildFormExportZip'
import { bundleSignatureHtmlImages } from './signatureImageAssets'
import type { SignatureFormState, SignatureLayoutSettings } from '../types/signatureForm'

export type RenderHtmlToPngOptions = {
  width?: number
  minHeight?: number
  backgroundColor?: string
  fontFamily?: string
  pixelRatio?: number
}

const triggerDownload = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

const waitForImages = async (root: HTMLElement): Promise<void> => {
  const images = Array.from(root.querySelectorAll('img'))
  await Promise.all(
    images.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete && img.naturalWidth > 0) {
            resolve()
            return
          }
          const done = () => resolve()
          img.addEventListener('load', done, { once: true })
          img.addEventListener('error', done, { once: true })
        })
    )
  )
}

const waitForFonts = async (fontFamily: string): Promise<void> => {
  await document.fonts.ready
  const primary = fontFamily.split(',')[0]?.trim().replace(/^['"]|['"]$/g, '') ?? 'Arial'
  await Promise.allSettled([
    document.fonts.load(`400 12px "${primary}"`),
    document.fonts.load(`600 19px "${primary}"`),
    document.fonts.load(`700 28px "${primary}"`)
  ])
}

const nextFrame = (): Promise<void> =>
  new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  })

const createExportMount = (
  html: string,
  options: RenderHtmlToPngOptions
): { mount: HTMLDivElement; container: HTMLDivElement } => {
  const backgroundColor = options.backgroundColor ?? '#ffffff'
  const fontFamily = options.fontFamily ?? 'Arial, Helvetica, sans-serif'

  const mount = document.createElement('div')
  mount.style.cssText =
    'position:fixed;left:0;top:0;overflow:hidden;opacity:0;pointer-events:none;z-index:-1;'

  const container = document.createElement('div')
  container.className = 'preview'
  if (options.width) container.style.width = `${options.width}px`
  if (options.minHeight) container.style.minHeight = `${options.minHeight}px`
  container.style.height = 'auto'
  container.style.display = 'inline-block'
  container.style.background = backgroundColor
  container.style.fontFamily = fontFamily
  container.innerHTML = html

  mount.appendChild(container)
  document.body.appendChild(mount)
  return { mount, container }
}

export const renderHtmlToPngBlob = async (
  html: string,
  options: RenderHtmlToPngOptions = {}
): Promise<Blob> => {
  const pixelRatio = options.pixelRatio ?? Math.min(window.devicePixelRatio || 1, 2)
  const backgroundColor = options.backgroundColor ?? '#ffffff'
  const fontFamily = options.fontFamily ?? 'Arial, Helvetica, sans-serif'

  const { mount, container } = createExportMount(html, options)

  try {
    await waitForFonts(fontFamily)
    await waitForImages(container)
    await nextFrame()

    const width = Math.max(1, Math.ceil(container.scrollWidth))
    const height = Math.max(1, Math.ceil(container.scrollHeight))

    const blob = await toBlob(container, {
      type: 'image/png',
      pixelRatio,
      backgroundColor,
      width,
      height,
      cacheBust: true,
      includeQueryParams: true
    })

    if (!blob) throw new Error('PNG export failed')
    return blob
  } finally {
    document.body.removeChild(mount)
  }
}

export const renderSignatureHtmlToPngBlob = async (
  html: string,
  layout: SignatureLayoutSettings
): Promise<Blob> =>
  renderHtmlToPngBlob(html, {
    width: layout.signatureWidth,
    minHeight: layout.signatureHeight,
    backgroundColor: layout.backgroundColor,
    fontFamily: layout.fontFamily
  })

export const downloadSignaturePng = async (
  htmlBody: string,
  form: SignatureFormState,
  layout: SignatureLayoutSettings
): Promise<void> => {
  const { html: bundledHtml } = await bundleSignatureHtmlImages(htmlBody, form, 'images', {
    embedImages: true
  })
  const blob = await renderSignatureHtmlToPngBlob(bundledHtml, layout)
  triggerDownload(blob, `${buildExportBaseName(form)}.png`)
}
