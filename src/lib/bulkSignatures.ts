import JSZip from 'jszip'
import * as XLSX from 'xlsx'
import type { AppLanguage, I18nKey } from '../i18n'
import type { SignatureFormState, SignatureLayoutSettings, TextAlign } from '../types/signatureForm'
import { bundleSignatureHtmlImages, stripOutlookStoredAssetPathsFromForm } from './signatureImageAssets'
import { buildSignatureHtml } from './signatureHtmlBuilder'
import { generateSignatureTextImages } from './signatureTextImages'
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
import { renderSignatureHtmlToPngBlob } from './signatureImageExport'
import { getLayoutSettings, wrapHtmlDocument } from './signatureUtils'
import { initializeSocialIconDataUrls } from './socialIcons'

export type BulkPersonRow = {
  fullName: string
  jobTitle: string
  company: string
  phone: string
  email: string
  website: string
  outlookSignatureName?: string
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
  outlookSignatureName: [
    'outlook signature name',
    'signature name',
    'outlook name',
    'שם חתימה',
    'שם חתימה ב-outlook'
  ],
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

/** Preserves in-cell line breaks from Excel (Alt+Enter), CSV, or literal \\n in exports. */
export const normalizeBulkMultilineText = (value: string): string =>
  value
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\\n/g, '\n')
    .replace(/\u2028|\u2029/g, '\n')
    .trim()

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
      let value = cellToString(line[colIndex])
      if (field === 'jobTitle' || field === 'company') {
        value = normalizeBulkMultilineText(value)
      }
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
  jobTitle: row.jobTitle.length > 0 ? row.jobTitle : template.jobTitle,
  company: row.company.length > 0 ? row.company : template.company,
  phone: row.phone || template.phone,
  email: row.email || template.email,
  website: row.website || template.website,
  outlookSignatureName: row.outlookSignatureName?.trim() || template.outlookSignatureName
})

export type BulkRowFormOverrides = (SignatureFormState | null)[]

export const cloneSignatureFormState = (form: SignatureFormState): SignatureFormState =>
  JSON.parse(JSON.stringify(form)) as SignatureFormState

export const formToBulkPersonRow = (form: SignatureFormState): BulkPersonRow => ({
  fullName: form.fullName,
  jobTitle: form.jobTitle,
  company: form.company,
  phone: form.phone,
  email: form.email,
  website: form.website,
  outlookSignatureName: form.outlookSignatureName,
  language: form.signatureLanguage
})

export const resolveBulkRowForm = (
  template: SignatureFormState,
  row: BulkPersonRow,
  override: SignatureFormState | null | undefined
): SignatureFormState =>
  override
    ? stripOutlookStoredAssetPathsFromForm(override)
    : mergeBulkRowIntoForm(template, row)

const bulkPreviewLabel = (row: BulkPersonRow, index: number): string =>
  row.fullName.trim() || row.email.trim() || `signature-${index + 1}`

const buildBulkSignaturePreview = async (
  form: SignatureFormState,
  row: BulkPersonRow,
  index: number,
  customized: boolean
): Promise<BulkSignaturePreview> => {
  const { html, layout } = await buildPreviewHtmlForForm(form)
  return {
    id: `bulk-preview-${index}`,
    label: bulkPreviewLabel(row, index),
    html,
    width: layout.signatureWidth,
    minHeight: layout.signatureHeight,
    emailAlign: layout.emailAlign,
    customized
  }
}

export type BulkSignaturePreview = {
  id: string
  label: string
  html: string
  width: number
  minHeight: number
  emailAlign: TextAlign
  /** True when this row was customized in the designer (not template + Excel only). */
  customized?: boolean
}

/** Same HTML pipeline as live preview (embedded images, social icons, text images). */
const buildPreviewHtmlForForm = async (
  form: SignatureFormState
): Promise<{ html: string; layout: SignatureLayoutSettings }> => {
  const installForm = stripOutlookStoredAssetPathsFromForm(form)
  const layout = getLayoutSettings(installForm)
  const textImages = await generateSignatureTextImages(installForm, layout)
  const bodyHtml = buildSignatureHtml(installForm, layout, { textImages })
  const { html: bundledHtml } = await bundleSignatureHtmlImages(bodyHtml, installForm, 'images', {
    embedImages: true
  })
  return { html: bundledHtml, layout }
}

/** Same HTML pipeline as single install / export (full document with font folder). */
const buildBundledSignatureHtmlDocument = async (
  form: SignatureFormState
): Promise<string> => {
  const installForm = stripOutlookStoredAssetPathsFromForm(form)
  const { html: bundledHtml, layout } = await buildPreviewHtmlForForm(installForm)
  return wrapHtmlDocument(bundledHtml, installForm.signatureLanguage, {
    fontFamily: layout.fontFamily,
    bundledFontAssetsBase: 'fonts'
  })
}

export const buildBulkSignaturePreviews = async (
  template: SignatureFormState,
  rows: BulkPersonRow[],
  overrides: BulkRowFormOverrides = []
): Promise<BulkSignaturePreview[]> => {
  await initializeSocialIconDataUrls()
  const exportTemplate = stripOutlookStoredAssetPathsFromForm(template)
  const previews: BulkSignaturePreview[] = []

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index]
    const override = overrides[index] ?? null
    const form = resolveBulkRowForm(exportTemplate, row, override)
    previews.push(await buildBulkSignaturePreview(form, row, index, Boolean(override)))
  }

  return previews
}

export const buildBulkSignaturePreviewAt = async (
  template: SignatureFormState,
  rows: BulkPersonRow[],
  overrides: BulkRowFormOverrides,
  index: number
): Promise<BulkSignaturePreview> => {
  await initializeSocialIconDataUrls()
  const exportTemplate = stripOutlookStoredAssetPathsFromForm(template)
  const row = rows[index]
  const override = overrides[index] ?? null
  const form = resolveBulkRowForm(exportTemplate, row, override)
  return buildBulkSignaturePreview(form, row, index, Boolean(override))
}

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
  rows: BulkPersonRow[],
  overrides: BulkRowFormOverrides = []
): Promise<Blob> => {
  await initializeSocialIconDataUrls()

  const zip = new JSZip()
  const usedNames = new Set<string>()
  const exportTemplate = stripOutlookStoredAssetPathsFromForm(template)

  await addBundledFontsToZip(zip, getLayoutSettings(exportTemplate).fontFamily)

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index]
    const form = resolveBulkRowForm(exportTemplate, row, overrides[index])
    const htmlDocument = await buildBundledSignatureHtmlDocument(form)

    const label = bulkPreviewLabel(row, index)
    const base = sanitizeFileName(label)
    const fileBase = uniqueFileName(base, usedNames)
    zip.file(`${fileBase}.html`, htmlDocument)
  }

  return zip.generateAsync({ type: 'blob' })
}

export const generateBulkSignaturesPngZip = async (
  template: SignatureFormState,
  rows: BulkPersonRow[],
  overrides: BulkRowFormOverrides = []
): Promise<Blob> => {
  await initializeSocialIconDataUrls()

  const zip = new JSZip()
  const usedNames = new Set<string>()
  const exportTemplate = stripOutlookStoredAssetPathsFromForm(template)

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index]
    const form = resolveBulkRowForm(exportTemplate, row, overrides[index])
    const { html, layout } = await buildPreviewHtmlForForm(form)
    const pngBlob = await renderSignatureHtmlToPngBlob(html, layout)

    const label = bulkPreviewLabel(row, index)
    const base = sanitizeFileName(label)
    const fileBase = uniqueFileName(base, usedNames)
    zip.file(`${fileBase}.png`, pngBlob)
  }

  return zip.generateAsync({ type: 'blob' })
}

/** Outlook Signatures folder layout (.htm / .txt / .rtf + *_files) for IT server deploy. */
export const generateBulkOutlookSignaturesZip = async (
  template: SignatureFormState,
  rows: BulkPersonRow[],
  overrides: BulkRowFormOverrides = []
): Promise<Blob> => {
  await initializeSocialIconDataUrls()

  const zip = new JSZip()
  const usedNames = new Set<string>()

  const exportTemplate = stripOutlookStoredAssetPathsFromForm(template)

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index]
    const form = resolveBulkRowForm(exportTemplate, row, overrides[index])
    const fileBase = uniqueFileName(
      toOutlookSignatureFileBase(form.fullName, form.email, form.outlookSignatureName),
      usedNames
    )
    const pkg = await buildOutlookSignaturePackage('', form, fileBase)
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
      ? ['שם מלא', 'תפקיד', 'חברה', 'טלפון', 'דוא"ל', 'אתר', 'שם חתימה ב-Outlook', 'שפה']
      : ['fullName', 'jobTitle', 'company', 'phone', 'email', 'website', 'outlookSignatureName', 'language']

  const sample =
    lang === 'he'
      ? [
          'ישראל ישראלי',
          'מנהל מכירות\nאזור אירופה',
          'חברה בע״מ',
          '050-1234567',
          'israel@example.com',
          'https://example.com',
          'Israel Israeli',
          'he'
        ]
      : [
          'Jane Doe',
          'Sales Manager\nEMEA',
          'Acme Ltd',
          '+1 555 123 4567',
          'jane@acme.com',
          'https://acme.com',
          'Jane Doe',
          'en'
        ]

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
