import { describe, expect, it } from 'vitest'
import { generateSignatureTextImages } from './signatureTextImages'
import { createTestForm, createTestLayout } from '../test/fixtures'

describe('generateSignatureTextImages', () => {
  it('returns undefined when rasterizeNameTitle is disabled', async () => {
    const form = createTestForm({ rasterizeNameTitle: false, fullName: 'Jane' })
    const layout = createTestLayout(form)
    await expect(generateSignatureTextImages(form, layout)).resolves.toBeUndefined()
  })

  it('returns undefined when name and title are empty', async () => {
    const form = createTestForm({
      rasterizeNameTitle: true,
      fullName: '',
      jobTitle: '',
      company: ''
    })
    const layout = createTestLayout(form)
    await expect(generateSignatureTextImages(form, layout)).resolves.toBeUndefined()
  })
})
