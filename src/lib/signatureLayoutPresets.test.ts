import { describe, expect, it } from 'vitest'
import { createDefaultFormState } from './defaultFormState'
import {
  applySignatureLayoutPreset,
  detectSignatureLayoutPreset
} from './signatureLayoutPresets'

describe('signatureLayoutPresets', () => {
  it('applies side-right preset', () => {
    const form = createDefaultFormState()
    const patch = applySignatureLayoutPreset('side-right', form)
    expect(patch.logoSide).toBe('right')
    expect(patch.layoutPreset).toBe('side-right')
    expect(patch.textColumnWidth).toBe(252)
  })

  it('applies banner-top-logo-bottom preset', () => {
    const form = createDefaultFormState()
    const patch = applySignatureLayoutPreset('banner-top-logo-bottom', form)
    expect(patch.logoSide).toBe('bottom')
    expect(patch.dividerThickness).toBe(0)
    expect(patch.bannerMaxWidth).toBe(form.signatureWidth)
  })

  it('detects stored layout preset', () => {
    const form = { ...createDefaultFormState(), layoutPreset: 'text-only-banner' as const }
    expect(detectSignatureLayoutPreset(form)).toBe('text-only-banner')
  })
})
