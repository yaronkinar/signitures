import { describe, expect, it } from 'vitest'
import { resolveSocialIconUrl } from './socialIcons'

describe('resolveSocialIconUrl', () => {
  it('returns custom icon URL when set', () => {
    expect(resolveSocialIconUrl('Facebook', 'https://cdn.example.com/fb.png', 'mono')).toBe(
      'https://cdn.example.com/fb.png'
    )
  })

  it('normalizes custom URLs without a scheme', () => {
    expect(resolveSocialIconUrl('Instagram', 'cdn.example.com/ig.png', 'brand')).toBe(
      'https://cdn.example.com/ig.png'
    )
  })

  it('returns empty string when no custom URL and icons are not initialized', () => {
    expect(resolveSocialIconUrl('X', '', 'brand')).toBe('')
  })
})
