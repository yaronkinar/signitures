import JSZip from 'jszip'
import * as XLSX from 'xlsx'
import type { AppLanguage, I18nKey } from '../i18n'
import type { SignatureFormState } from '../types/signatureForm'
import {
  addImageAssetsToZip,
  buildImageAssets,
  collectDataImageUrlsFromHtml,
  collectFormImageSources,
  rewriteFormImageUrls,
  rewriteUrlsInHtml
} from './signatureImageAssets'
import { buildSignatureHtml } from './signatureHtmlBuilder'
import { sanitizeFileName, uniqueFileName } from './fileNames'
import {
  addOutlookSignaturePackageToZip,
  buildOutlookSignaturePackage,
  toOutlookSignatureFileBase
} from './outlookSignaturePackage'
import {
  allBundledSignatureFontFileNames,
  signatureFontPublicUrl
} from './signatureFonts'
import { getLayoutSettings, wrapHtmlDocument } from './signatureUtils'
import { initializeSocialIconDataUrls } from './socialIcons'

export type BulkPersonRow = {
  fullName: string
  jobTitle: string
  company: string
  phone: string
  email: string
  website: string
  language?: AppLanguage
}

type BulkField = keyof BulkPersonRow

const COLUMN_ALIASES: Record<BulkField, string[]> = {
  fullName: ['full name', 'fullname', 'name', 'employee', 'שם', 'שם מלא'],
  jobTitle: ['job title', 'title', 'position', 'role', 'תפקיד'],
  company: ['company', 'organization', 'organisation', 'חברה', 'ארגון'],
  phone: ['phone', 'mobile', 'tel', 'telephone', 'נייד', 'טלפון'],
  email: ['email', 'e-mail', 'mail', 'דואל', 'דוא"ל', 'אימייל'],
  website: ['website', 'web', 'url', 'אתר'],
  language: ['language', 'lang', 'שפה']
}

const normalizeHeader = (value: unknown): string =>
  String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')

const cellToString = (value: unknown): string => {
  if (value == null) return ''
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return String(value).trim()
}

const matchField = (header: string): BulkField | null => {
  for (const [field, aliases] of Object.entries(COLUMN_ALIASES) as [BulkField, string[]][]) {
    if (aliases.some((alias) => header === alias || header.includes(alias))) {
      return field
    }
  }
  return null
}

const parseLanguage = (value: string, fallback: AppLanguage): AppLanguage => {
  const normalized = value.trim().toLowerCase()
  if (normalized === 'he' || normalized === 'hebrew' || normalized === 'עברית') return 'he'
  if (normalized === 'en' || normalized === 'english' || normalized === 'אנגלית') return 'en'
  return fallback
}

const rowHasContact = (row: BulkPersonRow): boolean =>
  [row.fullName, row.jobTitle, row.company, row.phone, row.email, row.website].some(
    (value) => value.trim().length > 0
  )

export const parseBulkSpreadsheet = (
  file: ArrayBuffer,
  defaultLanguage: AppLanguage
): BulkPersonRow[] => {
  const workbook = XLSX.read(file, { type: 'array' })
  const sheetName = workbook.SheetNames[0]
  if (!sheetName) {
    throw new Error('NO_SHEETS')
  }

  const sheet = workbook.Sheets[sheetName]
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: '',
    raw: false
  }) as unknown[][]

  if (matrix.length < 2) {
    throw new Error('NO_DATA_ROWS')
  }

  const headerRow = matrix[0] ?? []
  const columnMap = new Map<number, BulkField>()
  headerRow.forEach((cell, index) => {
    const field = matchField(normalizeHeader(cell))
    if (field) columnMap.set(index, field)
  })

  if (!columnMap.size) {
    throw new Error('NO_RECOGNIZED_COLUMNS')
  }

  const rows: BulkPersonRow[] = []
  for (let rowIndex = 1; rowIndex < matrix.length; rowIndex += 1) {
    const line = matrix[rowIndex] ?? []
    const row: BulkPersonRow = {
      fullName: '',
      jobTitle: '',
      company: '',
      phone: '',
      email: '',
      website: ''
    }

    columnMap.forEach((field, colIndex) => {
      const value = cellToString(line[colIndex])
      if (field === 'language') {
        row.language = parseLanguage(value, defaultLanguage)
      } else {
        row[field] = value
      }
    })

    if (!rowHasContact(row)) continue
    if (!row.fullName.trim() && !row.email.trim()) continue

    rows.push(row)
  }

  if (!rows.length) {
    throw new Error('NO_VALID_ROWS')
  }

  if (rows.length > 500) {
    throw new Error('TOO_MANY_ROWS')
  }

  return rows
}

export const mergeBulkRowIntoForm = (
  template: SignatureFormState,
  row: BulkPersonRow
): SignatureFormState => ({
  ...template,
  signatureLanguage: row.language ?? template.signatureLanguage,
  fullName: row.fullName || template.fullName,
  jobTitle: row.jobTitle || template.jobTitle,
  company: row.company || template.company,
  phone: row.phone || template.phone,
  email: row.email || template.email,
  website: row.website || template.website
})

const addBundledFontsToZip = async (zip: JSZip, fontFamily: string): Promise<void> => {
  const fileNames = allBundledSignatureFontFileNames(fontFamily)
  if (!fileNames.length) return

  const folder = zip.folder('fonts')
  if (!folder) return

  await Promise.all(
    fileNames.map(async (fileName) => {
      const response = await fetch(signatureFontPublicUrl(fileName))
      if (!response.ok) {
        throw new Error(`Missing bundled font: ${fileName}`)
      }
      folder.file(fileName, await response.arrayBuffer())
    })
  )
}

export const generateBulkSignaturesZip = async (
  template: SignatureFormState,
  rows: BulkPersonRow[]
): Promise<Blob> => {
  await initializeSocialIconDataUrls()

  const zip = new JSZip()
  const usedNames = new Set<string>()
  const templateLayout = getLayoutSettings(template)
  const assetsFolder = 'images'
  const templateAssets = await buildImageAssets(collectFormImageSources(template), assetsFolder)
  const exportTemplate = templateAssets.files.length
    ? rewriteFormImageUrls(template, templateAssets.urlMap)
    : template

  let sharedImageAssets = [...templateAssets.files]
  let htmlUrlMap = templateAssets.urlMap

  if (rows.length > 0) {
    const sampleForm = mergeBulkRowIntoForm(exportTemplate, rows[0])
    const sampleLayout = getLayoutSettings(sampleForm)
    const sampleHtml = buildSignatureHtml(sampleForm, sampleLayout)
    const bundledSample = await buildImageAssets(
      [
        ...collectFormImageSources(sampleForm),
        ...collectDataImageUrlsFromHtml(sampleHtml).map((url, index) => ({
          url,
          baseName: `embedded-image-${index + 1}`
        }))
      ],
      assetsFolder
    )
    sharedImageAssets = bundledSample.files
    htmlUrlMap = bundledSample.urlMap
  }

  await addBundledFontsToZip(zip, templateLayout.fontFamily)
  addImageAssetsToZip(zip, assetsFolder, sharedImageAssets)

  for (const row of rows) {
    const form = mergeBulkRowIntoForm(exportTemplate, row)
    const layout = getLayoutSettings(form)
    const bodyHtml = rewriteUrlsInHtml(buildSignatureHtml(form, layout), htmlUrlMap)
    const htmlDocument = wrapHtmlDocument(bodyHtml, form.signatureLanguage, {
      fontFamily: layout.fontFamily,
      bundledFontAssetsBase: 'fonts'
    })

    const label = row.fullName.trim() || row.email.trim() || 'signature'
    const base = sanitizeFileName(label)
    const fileBase = uniqueFileName(base, usedNames)
    zip.file(`${fileBase}.html`, htmlDocument)
  }

  return zip.generateAsync({ type: 'blob' })
}

/** Outlook Signatures folder layout (.htm / .txt / .rtf + *_files) for IT server deploy. */
export const generateBulkOutlookSignaturesZip = async (
  template: SignatureFormState,
  rows: BulkPersonRow[]
): Promise<Blob> => {
  await initializeSocialIconDataUrls()

  const zip = new JSZip()
  const usedNames = new Set<string>()
  const assetsFolder = 'images'
  const templateAssets = await buildImageAssets(collectFormImageSources(template), assetsFolder)
  const exportTemplate = templateAssets.files.length
    ? rewriteFormImageUrls(template, templateAssets.urlMap)
    : template

  let htmlUrlMap = templateAssets.urlMap

  if (rows.length > 0) {
    const sampleForm = mergeBulkRowIntoForm(exportTemplate, rows[0])
    const sampleLayout = getLayoutSettings(sampleForm)
    const sampleHtml = buildSignatureHtml(sampleForm, sampleLayout)
    const bundledSample = await buildImageAssets(
      [
        ...collectFormImageSources(sampleForm),
        ...collectDataImageUrlsFromHtml(sampleHtml).map((url, index) => ({
          url,
          baseName: `embedded-image-${index + 1}`
        }))
      ],
      assetsFolder
    )
    htmlUrlMap = bundledSample.urlMap
  }

  for (const row of rows) {
    const form = mergeBulkRowIntoForm(exportTemplate, row)
    const layout = getLayoutSettings(form)
    const bodyHtml = rewriteUrlsInHtml(buildSignatureHtml(form, layout), htmlUrlMap)
    const fileBase = uniqueFileName(
      toOutlookSignatureFileBase(form.fullName, form.email, ''),
      usedNames
    )
    const pkg = await buildOutlookSignaturePackage(bodyHtml, form, fileBase)
    addOutlookSignaturePackageToZip(zip, pkg)
  }

  return zip.generateAsync({ type: 'blob' })
}

export const downloadBlob = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export const buildBulkTemplateWorkbook = (lang: AppLanguage): ArrayBuffer => {
  const headers =
    lang === 'he'
      ? ['שם מלא', 'תפקיד', 'חברה', 'טלפון', 'דוא"ל', 'אתר', 'שפה']
      : ['fullName', 'jobTitle', 'company', 'phone', 'email', 'website', 'language']

  const sample =
    lang === 'he'
      ? ['ישראל ישראלי', 'מנהל מכירות', 'חברה בע״מ', '050-1234567', 'israel@example.com', 'https://example.com', 'he']
      : ['Jane Doe', 'Sales Manager', 'Acme Ltd', '+1 555 123 4567', 'jane@acme.com', 'https://acme.com', 'en']

  const sheet = XLSX.utils.aoa_to_sheet([headers, sample])
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, sheet, 'Signatures')
  return XLSX.write(workbook, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer
}

export const downloadBulkTemplate = (lang: AppLanguage): void => {
  const buffer = buildBulkTemplateWorkbook(lang)
  downloadBlob(
    new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    }),
    lang === 'he' ? 'signature-bulk-template.xlsx' : 'signature-bulk-template.xlsx'
  )
}

export type BulkErrorCode =
  | 'NO_SHEETS'
  | 'NO_DATA_ROWS'
  | 'NO_RECOGNIZED_COLUMNS'
  | 'NO_VALID_ROWS'
  | 'TOO_MANY_ROWS'
  | 'UNKNOWN'

export const bulkErrorMessageKey = (code: BulkErrorCode): I18nKey => {
  switch (code) {
    case 'NO_SHEETS':
      return 'bulkErrorNoSheets'
    case 'NO_DATA_ROWS':
      return 'bulkErrorNoDataRows'
    case 'NO_RECOGNIZED_COLUMNS':
      return 'bulkErrorNoColumns'
    case 'NO_VALID_ROWS':
      return 'bulkErrorNoValidRows'
    case 'TOO_MANY_ROWS':
      return 'bulkErrorTooManyRows'
    default:
      return 'bulkErrorUnknown'
  }
}

export const parseBulkErrorCode = (error: unknown): BulkErrorCode => {
  if (error instanceof Error) {
    if (
      error.message === 'NO_SHEETS' ||
      error.message === 'NO_DATA_ROWS' ||
      error.message === 'NO_RECOGNIZED_COLUMNS' ||
      error.message === 'NO_VALID_ROWS' ||
      error.message === 'TOO_MANY_ROWS'
    ) {
      return error.message
    }
  }
  return 'UNKNOWN'
}
