import JSZip from 'jszip'
import type { LinkImage, SignatureFormState } from '../types/signatureForm'
import { uniqueFileName } from './fileNames'

export type ImageAssetFile = {
  relativePath: string
  fileName: string
  bytes: Uint8Array
}

const DATA_IMAGE_URL_RE = /^data:(image\/[a-z0-9.+-]+);base64,([a-z0-9+/=\s]+)$/i
const HTML_SRC_DATA_IMAGE_RE = /src=(["'])(data:image\/[^"']+)\1/gi

export const isDataImageUrl = (value: string): boolean => DATA_IMAGE_URL_RE.test(value.trim())

export const extensionForImageMime = (mimeType: string): string => {
  switch (mimeType.toLowerCase()) {
    case 'image/jpeg':
      return 'jpg'
    case 'image/png':
      return 'png'
    case 'image/gif':
      return 'gif'
    case 'image/webp':
      return 'webp'
    case 'image/svg+xml':
      return 'svg'
    default:
      return 'png'
  }
}

export const mimeTypeForImagePath = (path: string): string => {
  const extension = path.split('.').pop()?.toLowerCase()
  switch (extension) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg'
    case 'png':
      return 'image/png'
    case 'gif':
      return 'image/gif'
    case 'webp':
      return 'image/webp'
    case 'svg':
      return 'image/svg+xml'
    default:
      return 'image/png'
  }
}

const bytesToBase64 = (bytes: Uint8Array): string => {
  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary)
}

export const bytesToDataUrl = (bytes: Uint8Array, mimeType: string): string =>
  `data:${mimeType};base64,${bytesToBase64(bytes)}`

export const decodeDataImageUrl = (dataUrl: string): { mimeType: string; bytes: Uint8Array } | null => {
  const match = dataUrl.trim().match(DATA_IMAGE_URL_RE)
  if (!match) return null

  const mimeType = match[1].toLowerCase()
  const base64 = match[2].replace(/\s+/g, '')
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }
  return { mimeType, bytes }
}

type ImageSource = {
  url: string
  baseName: string
}

const addImageSource = (sources: ImageSource[], url: string | undefined, baseName: string): void => {
  const trimmed = url?.trim()
  if (trimmed) {
    sources.push({ url: trimmed, baseName })
  }
}

export const collectFormImageSources = (form: SignatureFormState): ImageSource[] => {
  const sources: ImageSource[] = []
  addImageSource(sources, form.logoUrl, 'logo')
  addImageSource(sources, form.bannerUrl, 'banner')
  addImageSource(sources, form.facebookIconUrl, 'facebook-icon')
  addImageSource(sources, form.instagramIconUrl, 'instagram-icon')
  addImageSource(sources, form.linkedinIconUrl, 'linkedin-icon')
  addImageSource(sources, form.xIconUrl, 'x-icon')
  addImageSource(sources, form.youtubeIconUrl, 'youtube-icon')

  form.linkImages.forEach((row, index) => {
    addImageSource(sources, row.imageUrl, `linked-image-${index + 1}`)
  })

  return sources
}

export const collectDataImageUrlsFromHtml = (html: string): string[] => {
  const urls = new Set<string>()
  for (const match of html.matchAll(HTML_SRC_DATA_IMAGE_RE)) {
    urls.add(match[2])
  }
  return [...urls]
}

const encodeOutlookAssetPath = (relativePath: string): string =>
  relativePath.replace(/\\/g, '/').replace(/ /g, '%20')

const isRemoteImageUrl = (value: string): boolean => /^https?:\/\//i.test(value.trim())

const fetchRemoteImage = async (url: string): Promise<{ mimeType: string; bytes: Uint8Array } | null> => {
  try {
    const response = await fetch(url)
    if (!response.ok) return null
    const blob = await response.blob()
    const bytes = new Uint8Array(await blob.arrayBuffer())
    if (!bytes.length) return null
    const mimeType = blob.type || mimeTypeForImagePath(url)
    return { mimeType, bytes }
  } catch {
    return null
  }
}

export type ImageAssetOutputMode = 'files' | 'embed'

export const buildImageAssets = async (
  sources: ImageSource[],
  assetsFolder: string,
  outputMode: ImageAssetOutputMode = 'files'
): Promise<{ urlMap: Map<string, string>; files: ImageAssetFile[] }> => {
  const urlMap = new Map<string, string>()
  const files: ImageAssetFile[] = []
  const usedNames = new Set<string>()

  for (const source of sources) {
    if (urlMap.has(source.url)) continue

    let mimeType: string | null = null
    let bytes: Uint8Array | null = null

    if (isDataImageUrl(source.url)) {
      const decoded = decodeDataImageUrl(source.url)
      if (!decoded) continue
      mimeType = decoded.mimeType
      bytes = decoded.bytes
    } else if (isRemoteImageUrl(source.url)) {
      const fetched = await fetchRemoteImage(source.url)
      if (!fetched) continue
      mimeType = fetched.mimeType
      bytes = fetched.bytes
    } else {
      continue
    }

    if (outputMode === 'embed') {
      urlMap.set(source.url, bytesToDataUrl(bytes, mimeType))
      continue
    }

    const extension = extensionForImageMime(mimeType)
    const fileName = uniqueFileName(`${source.baseName}.${extension}`, usedNames)
    const relativePath = encodeOutlookAssetPath(`${assetsFolder}/${fileName}`)

    urlMap.set(source.url, relativePath)
    files.push({ relativePath, fileName, bytes })
  }

  return { urlMap, files }
}

export const rewriteUrlsInHtml = (html: string, urlMap: Map<string, string>): string => {
  if (!urlMap.size) return html

  let result = html
  for (const [from, to] of urlMap) {
    result = result.split(from).join(to)
  }
  return result
}

const rewriteStringField = (value: string, urlMap: Map<string, string>): string =>
  urlMap.get(value.trim()) ?? value

const rewriteLinkImages = (rows: LinkImage[], urlMap: Map<string, string>): LinkImage[] =>
  rows.map((row) => ({
    ...row,
    imageUrl: rewriteStringField(row.imageUrl, urlMap)
  }))

export const rewriteFormImageUrls = (
  form: SignatureFormState,
  urlMap: Map<string, string>
): SignatureFormState => ({
  ...form,
  logoUrl: rewriteStringField(form.logoUrl, urlMap),
  bannerUrl: rewriteStringField(form.bannerUrl, urlMap),
  facebookIconUrl: rewriteStringField(form.facebookIconUrl, urlMap),
  instagramIconUrl: rewriteStringField(form.instagramIconUrl, urlMap),
  linkedinIconUrl: rewriteStringField(form.linkedinIconUrl, urlMap),
  xIconUrl: rewriteStringField(form.xIconUrl, urlMap),
  youtubeIconUrl: rewriteStringField(form.youtubeIconUrl, urlMap),
  linkImages: rewriteLinkImages(form.linkImages, urlMap)
})

export const rewriteRecordImageUrls = (
  payload: Record<string, unknown>,
  urlMap: Map<string, string>
): Record<string, unknown> => {
  if (!urlMap.size) return payload

  const next: Record<string, unknown> = { ...payload }
  for (const [key, value] of Object.entries(next)) {
    if (typeof value === 'string') {
      const rewritten = urlMap.get(value.trim())
      if (rewritten) next[key] = rewritten
      continue
    }

    if (key === 'linkImages' && Array.isArray(value)) {
      next.linkImages = value.map((item) => {
        if (!item || typeof item !== 'object') return item
        const row = item as LinkImage
        return {
          ...row,
          imageUrl: urlMap.get(row.imageUrl.trim()) ?? row.imageUrl
        }
      })
    }
  }

  return next
}

export const bundleSignatureHtmlImages = async (
  htmlBody: string,
  form: SignatureFormState,
  assetsFolder: string,
  options: { embedImages?: boolean } = {}
): Promise<{ html: string; files: ImageAssetFile[]; urlMap: Map<string, string> }> => {
  const outputMode: ImageAssetOutputMode = options.embedImages ? 'embed' : 'files'
  const sources = [
    ...collectFormImageSources(form),
    ...collectDataImageUrlsFromHtml(htmlBody).map((url, index) => ({
      url,
      baseName: `embedded-image-${index + 1}`
    }))
  ]
  const { urlMap, files } = await buildImageAssets(sources, assetsFolder, outputMode)
  return {
    html: rewriteUrlsInHtml(htmlBody, urlMap),
    files,
    urlMap
  }
}

export const resolveStoredImageUrl = async (url: string, zip: JSZip): Promise<string> => {
  const trimmed = url.trim()
  if (!trimmed || isDataImageUrl(trimmed) || /^https?:\/\//i.test(trimmed)) {
    return trimmed
  }

  const normalizedPath = trimmed.replace(/\\/g, '/')
  const zipEntry = zip.file(normalizedPath)
  if (!zipEntry) return trimmed

  const bytes = await zipEntry.async('uint8array')
  return bytesToDataUrl(bytes, mimeTypeForImagePath(normalizedPath))
}

export const resolveFormImageUrlsFromZip = async (
  form: SignatureFormState,
  zip: JSZip
): Promise<SignatureFormState> => {
  const linkImages = await Promise.all(
    form.linkImages.map(async (row) => ({
      ...row,
      imageUrl: await resolveStoredImageUrl(row.imageUrl, zip)
    }))
  )

  return {
    ...form,
    logoUrl: await resolveStoredImageUrl(form.logoUrl, zip),
    bannerUrl: await resolveStoredImageUrl(form.bannerUrl, zip),
    facebookIconUrl: await resolveStoredImageUrl(form.facebookIconUrl, zip),
    instagramIconUrl: await resolveStoredImageUrl(form.instagramIconUrl, zip),
    linkedinIconUrl: await resolveStoredImageUrl(form.linkedinIconUrl, zip),
    xIconUrl: await resolveStoredImageUrl(form.xIconUrl, zip),
    youtubeIconUrl: await resolveStoredImageUrl(form.youtubeIconUrl, zip),
    linkImages
  }
}

export const imageAssetsToWritePayloads = (
  files: ImageAssetFile[]
): { fileName: string; base64: string }[] =>
  files.map(({ fileName, bytes }) => ({
    fileName,
    base64: bytesToBase64(bytes)
  }))

export const addImageAssetsToZip = (zip: JSZip, assetsFolder: string, files: ImageAssetFile[]): void => {
  if (!files.length) return

  const folder = zip.folder(assetsFolder)
  if (!folder) return

  for (const file of files) {
    folder.file(file.fileName, file.bytes)
  }
}
