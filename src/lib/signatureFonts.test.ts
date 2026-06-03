import { describe, expect, it } from 'vitest'
import {
  allBundledSignatureFontFileNames,
  buildBundledFontFaceCss,
  getBundledFontCssFamily,
  isBundledWebFont,
  requiredBundledFontFileNames,
  resolveBundledSignatureFonts,
  signatureFontPublicUrl
} from './signatureFonts'

describe('resolveBundledSignatureFonts', () => {
  it('detects Rubik and Cairo stacks', () => {
    expect(resolveBundledSignatureFonts("'Rubik', Arial")).toEqual(['rubik'])
    expect(resolveBundledSignatureFonts("'Cairo', Tahoma")).toEqual(['cairo'])
    expect(resolveBundledSignatureFonts('Arial')).toEqual([])
  })
})

describe('getBundledFontCssFamily', () => {
  it('returns CSS family name for bundled fonts', () => {
    expect(getBundledFontCssFamily("'Rubik', Arial")).toBe('Rubik')
    expect(getBundledFontCssFamily('Arial')).toBeNull()
  })
})

describe('isBundledWebFont', () => {
  it('is true only for Rubik/Cairo stacks', () => {
    expect(isBundledWebFont("'Rubik', Arial")).toBe(true)
    expect(isBundledWebFont('Georgia, serif')).toBe(false)
  })
})

describe('requiredBundledFontFileNames', () => {
  it('includes weight-specific woff2 files', () => {
    const files = requiredBundledFontFileNames("'Rubik', Arial", [400, 700])
    expect(files.some((f) => f.includes('rubik') && f.includes('400'))).toBe(true)
    expect(files.some((f) => f.includes('700'))).toBe(true)
  })
})

describe('allBundledSignatureFontFileNames', () => {
  it('returns all weights for each resolved font', () => {
    const files = allBundledSignatureFontFileNames("'Rubik', Arial")
    expect(files.length).toBeGreaterThan(10)
    expect(files.every((f) => f.endsWith('.woff2'))).toBe(true)
  })
})

describe('buildBundledFontFaceCss', () => {
  it('emits @font-face rules with relative URLs', () => {
    const css = buildBundledFontFaceCss("'Rubik', Arial", 'fonts', ['rubik-latin-400-normal.woff2'])
    expect(css).toContain('@font-face')
    expect(css).toContain('fonts/rubik-latin-400-normal.woff2')
    expect(css).toContain("font-family:'Rubik'")
  })
})

describe('signatureFontPublicUrl', () => {
  it('points at public signature-fonts folder', () => {
    expect(signatureFontPublicUrl('rubik-latin-400-normal.woff2')).toContain(
      '/signature-fonts/rubik-latin-400-normal.woff2'
    )
  })
})
