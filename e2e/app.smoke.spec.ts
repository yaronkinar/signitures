import { expect, test } from '@playwright/test'

test.describe('app shell', () => {
  test('loads the signature generator', async ({ page }) => {
    await page.goto('/')

    await expect(page).toHaveTitle(/Outlook|חתימות/i)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByRole('complementary', { name: /תצוגה מקדימה|Preview/i })).toBeVisible()
  })

  test('shows bulk signatures section', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByText(/חתימות בכמות|Bulk signatures/i)).toBeVisible()
  })
})
