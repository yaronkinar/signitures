import { describe, expect, it } from 'vitest'
import {
  collectDataImageUrlsFromHtml,
  decodeDataImageUrl,
  extensionForImageMime,
  isDataImageUrl,
  isOutlookStoredAssetPath,
  rewriteUrlsInHtml,
  stripOutlookStoredAssetPathsFromForm
} from './signatureImageAssets'
import { createTestForm } from '../test/fixtures'

const TINY_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='

describe('isDataImageUrl', () => {
  it('detects data image URLs', () => {
    expect(isDataImageUrl(TINY_PNG)).toBe(true)
    expect(isDataImageUrl('https://x.com/a.png')).toBe(false)
  })
})

describe('extensionForImageMime', () => {
  it('maps known mime types', () => {
    expect(extensionForImageMime('image/png')).toBe('png')
    expect(extensionForImageMime('image/jpeg')).toBe('jpg')
    expect(extensionForImageMime('unknown/type')).toBe('png')
  })
})

describe('decodeDataImageUrl', () => {
  it('round-trips a tiny PNG data URL', () => {
    const decoded = decodeDataImageUrl(TINY_PNG)
    expect(decoded?.mimeType).toBe('image/png')
    expect(decoded?.bytes.length).toBeGreaterThan(0)
  })

  it('returns null for invalid data URLs', () => {
    expect(decodeDataImageUrl('not-data')).toBeNull()
  })
})

describe('collectDataImageUrlsFromHtml', () => {
  it('finds unique embedded images in HTML', () => {
    const html = `<img src="${TINY_PNG}" /><img src="${TINY_PNG}" />`
    expect(collectDataImageUrlsFromHtml(html)).toEqual([TINY_PNG])
  })
})

describe('rewriteUrlsInHtml', () => {
  it('replaces src attributes using the map', () => {
    const html = `<img src="old" />`
    const map = new Map([['old', 'new.png']])
    expect(rewriteUrlsInHtml(html, map)).toContain('src="new.png"')
  })
})

describe('isOutlookStoredAssetPath', () => {
  it('detects Outlook _files paths', () => {
    expect(isOutlookStoredAssetPath('MySig_files/image001.png')).toBe(true)
    expect(isOutlookStoredAssetPath('https://cdn.example.com/logo.png')).toBe(false)
  })
})

describe('stripOutlookStoredAssetPathsFromForm', () => {
  it('clears logo and social icons that use Outlook stored paths', () => {
    const form = createTestForm({
      logoUrl: 'Jane_files/logo.png',
      facebookIconUrl: 'Jane_files/icon.png',
      facebookUrl: 'https://facebook.com/x'
    })
    const stripped = stripOutlookStoredAssetPathsFromForm(form)
    expect(stripped.logoUrl).toBe('')
    expect(stripped.facebookIconUrl).toBe('')
    expect(stripped.facebookUrl).toBe('https://facebook.com/x')
  })
})
