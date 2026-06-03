import { describe, expect, it } from 'vitest'
import { sanitizeFileName, uniqueFileName } from './fileNames'

describe('sanitizeFileName', () => {
  it('replaces unsafe characters and collapses spaces', () => {
    expect(sanitizeFileName('Jane Doe / Acme')).toBe('Jane-Doe-Acme')
    expect(sanitizeFileName('   ')).toBe('signature')
  })
})

describe('uniqueFileName', () => {
  it('appends numeric suffix for duplicates', () => {
    const used = new Set<string>()
    expect(uniqueFileName('jane', used)).toBe('jane')
    expect(uniqueFileName('jane', used)).toBe('jane-2')
    expect(uniqueFileName('Jane', used)).toBe('Jane-3')
  })
})
