import { expect, test } from '@playwright/test'

test.describe('live preview', () => {
  test('updates preview with plain text when rasterize is off', async ({ page }) => {
    await page.goto('/')

    const preview = page.locator('.card-preview')
    await expect(preview).toBeVisible()

    const layoutPanel = page.locator('details.panel', {
      has: page.getByText(/פריסה וטיפוגרפיה|Layout & typography/)
    })
    await layoutPanel.locator('summary').click()
    await layoutPanel.locator('input[type="checkbox"]').setChecked(false)

    await page.getByLabel(/שם מלא|Full name/i).fill('Playwright Tester')

    await expect(preview.getByText('Playwright Tester')).toBeVisible({ timeout: 10_000 })
  })

  test('renders rasterized name as an image when enabled', async ({ page }) => {
    await page.goto('/')

    const preview = page.locator('.card-preview')
    await page.getByLabel(/שם מלא|Full name/i).fill('Raster Name')

    await expect(preview.locator('img[alt="Raster Name"]')).toBeVisible({ timeout: 15_000 })
  })
})
