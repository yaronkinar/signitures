import { expect, test } from '@playwright/test'

test.describe('signature text images (browser)', () => {
  test('generateSignatureTextImages produces PNG data URLs', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const result = await page.evaluate(async () => {
      const { createDefaultFormState } = await import('/src/lib/defaultFormState.ts')
      const { getLayoutSettings } = await import('/src/lib/signatureUtils.ts')
      const { generateSignatureTextImages } = await import('/src/lib/signatureTextImages.ts')

      const form = {
        ...createDefaultFormState(),
        rasterizeNameTitle: true,
        fullName: 'Jane Doe',
        jobTitle: 'Manager\nEMEA',
        company: 'Acme Ltd',
        fontFamily: 'Arial, Helvetica, sans-serif'
      }
      const layout = getLayoutSettings(form)
      const images = await generateSignatureTextImages(form, layout)

      return {
        nameDataUrl: images?.name?.dataUrl ?? '',
        nameAlt: images?.name?.alt ?? '',
        titleAlt: images?.titleBlock?.alt ?? ''
      }
    })

    expect(result.nameDataUrl).toMatch(/^data:image\/png;base64,/)
    expect(result.nameAlt).toBe('Jane Doe')
    expect(result.titleAlt).toContain('Manager')
  })
})
