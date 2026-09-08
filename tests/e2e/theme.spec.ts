import { expect, test } from '@playwright/test'
import { makeCube, menu } from './helpers'

test('dark theme applies at once and survives a reload', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await page.waitForSelector('.timeline')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  await makeCube(page)
  await menu(page, /^Dark/)
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await page.reload()
  await page.waitForSelector('.timeline')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  // the document is untouched by the theme
  await expect(page.getByRole('option', { name: 'Extrude 1' })).toBeVisible()
  await menu(page, /^Light/)
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
})
