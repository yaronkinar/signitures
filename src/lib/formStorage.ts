import JSZip from 'jszip'
import { createDefaultFormState } from './defaultFormState'
import { buildExportBaseName, buildFormParamsExportZip, buildNamedExportZip } from './buildFormExportZip'
import {
  resolveFormImageUrlsFromZip
} from './signatureImageAssets'
import { getLayoutSettings } from './signatureUtils'
import type { AppLanguage } from '../i18n'
import type { LinkImage, SignatureFormState } from '../types/signatureForm'

const STORAGE_KEY = 'signitures-form-state'
const STYLE_EXPORT_TYPE = 'style'

const STYLE_FIELD_KEYS = [
  'signatureLanguage',
  'logoUrl',
  'bannerUrl',
  'bannerLink',
  'facebookIconUrl',
  'facebookIconVariant',
  'instagramIconUrl',
  'instagramIconVariant',
  'linkedinIconUrl',
  'linkedinIconVariant',
  'xIconUrl',
  'xIconVariant',
  'youtubeIconUrl',
  'youtubeIconVariant',
  'fontFamily',
  'rasterizeNameTitle',
  'nameFontWeight',
  'titleFontWeight',
  'bodyFontWeight',
  'nameFontSize',
  'titleFontSize',
  'bodyFontSize',
  'lineSpacing',
  'signatureWidth',
  'signatureHeight',
  'textColumnWidth',
  'logoMaxWidth',
  'textAlign',
  'nameTitleAlign',
  'emailAlign',
  'logoAlign',
  'logoSide',
  'verticalAlign',
  'textOffsetX',
  'textOffsetY',
  'logoOffsetX',
  'logoOffsetY',
  'dividerThickness',
  'socialIconGap',
  'accentColor',
  'textColor',
  'secondaryTextColor',
  'dividerColor',
  'linkColor',
  'backgroundColor',
  'nameColor',
  'jobTitleColor',
  'companyColor',
  'contactLabelColor',
  'phoneColor',
  'emailColor',
  'websiteColor'
] as const satisfies readonly (keyof SignatureFormState)[]

export type SignatureStyleExport = {
  exportType: typeof STYLE_EXPORT_TYPE
} & Pick<SignatureFormState, (typeof STYLE_FIELD_KEYS)[number]>

export type ParsedFormImport =
  | { kind: 'full'; form: SignatureFormState }
  | { kind: 'style'; style: Partial<SignatureStyleExport> }

const parseLinkImages = (value: unknown, fallback: LinkImage[]): LinkImage[] => {
  if (!Array.isArray(value) || value.length === 0) return fallback

  return value.map((item) => {
    if (!item || typeof item !== 'object') {
      return { id: crypto.randomUUID(), imageUrl: '', href: '', alt: '' }
    }

    const row = item as Partial<LinkImage>
    return {
      id: typeof row.id === 'string' && row.id.trim() ? row.id : crypto.randomUUID(),
      imageUrl: typeof row.imageUrl === 'string' ? row.imageUrl : '',
      href: typeof row.href === 'string' ? row.href : '',
      alt: typeof row.alt === 'string' ? row.alt : ''
    }
  })
}

const parseStoredFormState = (value: unknown): SignatureFormState | null => {
  if (!value || typeof value !== 'object') return null

  const parsed = value as Partial<SignatureFormState>
  const defaults = createDefaultFormState()
  const signatureLanguage: AppLanguage = parsed.signatureLanguage === 'en' ? 'en' : 'he'

  const merged: SignatureFormState = {
    ...defaults,
    ...parsed,
    signatureLanguage,
    linkImages: parseLinkImages(parsed.linkImages, defaults.linkImages)
  }

  return { ...merged, ...getLayoutSettings(merged) }
}

export const loadStoredFormState = (): SignatureFormState | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return parseStoredFormState(JSON.parse(raw))
  } catch {
    return null
  }
}

export const storeFormState = (form: SignatureFormState): boolean => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(form))
    return true
  } catch {
    return false
  }
}

export const clearStoredFormState = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // localStorage may be unavailable in restricted contexts
  }
}

export const createInitialFormState = (): SignatureFormState =>
  loadStoredFormState() ?? createDefaultFormState()

export const parseFormStateJson = (raw: string): SignatureFormState | null => {
  try {
    return parseStoredFormState(JSON.parse(raw))
  } catch {
    return null
  }
}

const pickStyleFields = (value: Record<string, unknown>): Partial<SignatureStyleExport> => {
  const style: Partial<SignatureStyleExport> = {}
  for (const key of STYLE_FIELD_KEYS) {
    if (key in value) {
      style[key] = value[key] as SignatureStyleExport[typeof key]
    }
  }
  return style
}

export const extractStyleExport = (form: SignatureFormState): SignatureStyleExport => ({
  exportType: STYLE_EXPORT_TYPE,
  ...pickStyleFields(form as unknown as Record<string, unknown>)
})

export const applyStyleImport = (
  current: SignatureFormState,
  style: Partial<SignatureStyleExport>
): SignatureFormState => {
  const stylePatch = pickStyleFields(style as unknown as Record<string, unknown>)
  const merged: SignatureFormState = { ...current, ...stylePatch }
  return { ...merged, ...getLayoutSettings(merged) }
}

export const parseFormImportJson = (raw: string): ParsedFormImport | null => {
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>
    if (!parsed || typeof parsed !== 'object') return null

    if (parsed.exportType === STYLE_EXPORT_TYPE) {
      const style = pickStyleFields(parsed)
      return Object.keys(style).length > 0 ? { kind: 'style', style } : null
    }

    const form = parseStoredFormState(parsed)
    return form ? { kind: 'full', form } : null
  } catch {
    return null
  }
}

const downloadTextFile = (content: string, filename: string, mimeType: string): void => {
  const url = URL.createObjectURL(new Blob([content], { type: mimeType }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

const findJsonEntryName = (zip: JSZip): string | null => {
  const jsonEntries = Object.keys(zip.files).filter(
    (name) => !name.endsWith('/') && name.toLowerCase().endsWith('.json')
  )
  if (!jsonEntries.length) return null
  const preferred =
    jsonEntries.find((name) => /-(params|style)\.json$/i.test(name)) ??
    jsonEntries.find((name) => !name.includes('/')) ??
    jsonEntries[0]
  return preferred ?? null
}

const downloadBlobFile = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export const parseFormFromExportZip = async (zipData: ArrayBuffer): Promise<ParsedFormImport | null> => {
  const zip = await JSZip.loadAsync(zipData)
  const jsonEntryName = findJsonEntryName(zip)
  if (!jsonEntryName) return null

  const jsonEntry = zip.file(jsonEntryName)
  if (!jsonEntry) return null

  const parsed = parseFormImportJson(await jsonEntry.async('string'))
  if (!parsed || parsed.kind !== 'full') return null

  return {
    kind: 'full',
    form: await resolveFormImageUrlsFromZip(parsed.form, zip)
  }
}

export const downloadFormStateExport = async (form: SignatureFormState): Promise<void> => {
  const baseName = buildExportBaseName(form)
  const blob = await buildFormParamsExportZip(form)
  const hasZipImages = blob.type !== 'application/json'
  downloadBlobFile(blob, hasZipImages ? `${baseName}-params.zip` : `${baseName}-params.json`)
}

export const downloadFormStyleExport = async (form: SignatureFormState): Promise<void> => {
  const baseName = buildExportBaseName(form)
  const styleExport = extractStyleExport(form)
  const blob = await buildNamedExportZip(
    `${baseName}-style.json`,
    styleExport as unknown as Record<string, unknown>,
    form
  )
  const hasZipImages = blob.type !== 'application/json'
  downloadBlobFile(blob, hasZipImages ? `${baseName}-style.zip` : `${baseName}-style.json`)
}

export const parseFormImportFile = async (file: File): Promise<ParsedFormImport | null> => {
  const lowerName = file.name.toLowerCase()

  if (lowerName.endsWith('.zip')) {
    const zip = await JSZip.loadAsync(await file.arrayBuffer())
    const jsonEntryName = findJsonEntryName(zip)
    if (!jsonEntryName) return null

    const jsonEntry = zip.file(jsonEntryName)
    if (!jsonEntry) return null

    const parsed = parseFormImportJson(await jsonEntry.async('string'))
    if (!parsed) return null

    if (parsed.kind === 'style') {
      const defaults = createDefaultFormState()
      const merged = { ...defaults, ...parsed.style }
      const resolved = await resolveFormImageUrlsFromZip(merged, zip)
      return { kind: 'style', style: pickStyleFields(resolved as unknown as Record<string, unknown>) }
    }

    return {
      kind: 'full',
      form: await resolveFormImageUrlsFromZip(parsed.form, zip)
    }
  }

  return parseFormImportJson(await file.text())
}
