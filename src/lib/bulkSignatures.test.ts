import * as XLSX from 'xlsx'
import { describe, expect, it } from 'vitest'
import {
  bulkErrorMessageKey,
  buildBulkTemplateWorkbook,
  mergeBulkRowIntoForm,
  normalizeBulkMultilineText,
  parseBulkErrorCode,
  parseBulkSpreadsheet
} from './bulkSignatures'
import { createTestForm } from '../test/fixtures'

const workbookToBuffer = (rows: unknown[][]): ArrayBuffer => {
  const sheet = XLSX.utils.aoa_to_sheet(rows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, sheet, 'Signatures')
  return XLSX.write(workbook, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer
}

describe('normalizeBulkMultilineText', () => {
  it('normalizes line endings and literal \\n', () => {
    expect(normalizeBulkMultilineText('a\r\nb')).toBe('a\nb')
    expect(normalizeBulkMultilineText('a\\nb')).toBe('a\nb')
    expect(normalizeBulkMultilineText('  spaced  ')).toBe('spaced')
  })
})

describe('parseBulkSpreadsheet', () => {
  it('parses English headers and rows', () => {
    const buffer = workbookToBuffer([
      ['fullName', 'jobTitle', 'company', 'phone', 'email', 'website', 'language'],
      ['Jane Doe', 'Manager\nEMEA', 'Acme', '555', 'jane@acme.com', 'https://acme.com', 'en']
    ])

    const rows = parseBulkSpreadsheet(buffer, 'he')
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({
      fullName: 'Jane Doe',
      jobTitle: 'Manager\nEMEA',
      company: 'Acme',
      email: 'jane@acme.com',
      language: 'en'
    })
  })

  it('recognizes Hebrew column aliases', () => {
    const buffer = workbookToBuffer([
      ['שם מלא', 'תפקיד', 'דוא"ל'],
      ['ישראל', 'מנהל', 'a@b.com']
    ])

    const rows = parseBulkSpreadsheet(buffer, 'he')
    expect(rows[0].fullName).toBe('ישראל')
    expect(rows[0].jobTitle).toBe('מנהל')
    expect(rows[0].email).toBe('a@b.com')
  })

  it('skips empty rows and rows without name or email', () => {
    const buffer = workbookToBuffer([
      ['fullName', 'email'],
      ['', ''],
      ['Only Name', ''],
      ['', 'only@mail.com'],
      ['Both', 'ok@mail.com']
    ])

    const rows = parseBulkSpreadsheet(buffer, 'en')
    expect(rows.map((r) => r.fullName)).toEqual(['Only Name', '', 'Both'])
    expect(rows.map((r) => r.email)).toEqual(['', 'only@mail.com', 'ok@mail.com'])
  })

  it('throws NO_RECOGNIZED_COLUMNS when headers do not match', () => {
    const buffer = workbookToBuffer([
      ['foo', 'bar'],
      ['a', 'b']
    ])
    expect(() => parseBulkSpreadsheet(buffer, 'en')).toThrow('NO_RECOGNIZED_COLUMNS')
  })

  it('throws TOO_MANY_ROWS when over 500 rows', () => {
    const header = ['fullName', 'email']
    const data = Array.from({ length: 501 }, (_, i) => [`Person ${i}`, `p${i}@x.com`])
    const buffer = workbookToBuffer([header, ...data])
    expect(() => parseBulkSpreadsheet(buffer, 'en')).toThrow('TOO_MANY_ROWS')
  })
})

describe('mergeBulkRowIntoForm', () => {
  it('overrides template fields from row', () => {
    const template = createTestForm({ fullName: 'Template', company: 'TemplateCo' })
    const merged = mergeBulkRowIntoForm(template, {
      fullName: 'Jane',
      jobTitle: '',
      company: 'Acme',
      phone: '',
      email: 'jane@x.com',
      website: '',
      language: 'en'
    })

    expect(merged.fullName).toBe('Jane')
    expect(merged.company).toBe('Acme')
    expect(merged.email).toBe('jane@x.com')
    expect(merged.signatureLanguage).toBe('en')
    expect(merged.jobTitle).toBe(template.jobTitle)
  })

  it('keeps template job title when row job title is empty', () => {
    const template = createTestForm({ jobTitle: 'Default Title' })
    const merged = mergeBulkRowIntoForm(template, {
      fullName: 'Jane',
      jobTitle: '',
      company: '',
      phone: '',
      email: 'j@x.com',
      website: ''
    })
    expect(merged.jobTitle).toBe('Default Title')
  })
})

describe('bulk error helpers', () => {
  it('maps error codes to i18n keys', () => {
    expect(bulkErrorMessageKey('NO_SHEETS')).toBe('bulkErrorNoSheets')
    expect(bulkErrorMessageKey('TOO_MANY_ROWS')).toBe('bulkErrorTooManyRows')
    expect(bulkErrorMessageKey('UNKNOWN')).toBe('bulkErrorUnknown')
  })

  it('parseBulkErrorCode extracts known codes', () => {
    expect(parseBulkErrorCode(new Error('NO_VALID_ROWS'))).toBe('NO_VALID_ROWS')
    expect(parseBulkErrorCode(new Error('other'))).toBe('UNKNOWN')
  })
})

describe('buildBulkTemplateWorkbook', () => {
  it('produces a readable xlsx with headers and sample row', () => {
    const buffer = buildBulkTemplateWorkbook('en')
    const workbook = XLSX.read(buffer, { type: 'array' })
    const sheet = workbook.Sheets[workbook.SheetNames[0]!]
    const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1 }) as unknown[][]

    expect(matrix[0]).toContain('fullName')
    expect(String(matrix[1]?.[0])).toContain('Jane')
  })
})
