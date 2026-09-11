import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { faceView, drawInches, isoPoint, makeCube, menu, tool } from './helpers'

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

test('the sketch canvas follows the theme and exports with its colours', async ({ page }, testInfo) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await page.waitForSelector('.timeline')
  await makeCube(page)
  await page.click('text=Pick face')
  await page.mouse.click(...(await isoPoint(page, 12, -12, 24)))
  const view = await faceView(page, { u0: 0, u1: 24, v0: -24, v1: 0 })
  await drawInches(page, view, [4, -20], [20, -4])
  await tool(page, 'Select')
  const svg = page.locator('.sketch svg')
  const line = page.locator('[data-line-id] line:not([stroke="transparent"])').first()
  const background = () => svg.locator('[data-surface]').getAttribute('fill')
  const token = (name: string) => page.evaluate((n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim(), name)

  const lightBg = await background()
  const lightStroke = await line.getAttribute('stroke')
  await menu(page, /^Dark/)
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await expect.poll(background).not.toBe(lightBg)
  await expect(line).not.toHaveAttribute('stroke', lightStroke!)
  const darkStroke = await line.getAttribute('stroke')
  expect(darkStroke).toBe(await token('--kit-canvas-line'))

  await test.step('an export from the dark theme carries a background and the dark colours', async () => {
    const surface = await token('--kit-canvas-surface')
    const [dl] = await Promise.all([page.waitForEvent('download'), menu(page, 'Export sketch as SVG')])
    const file = testInfo.outputPath('dark.svg')
    await dl.saveAs(file)
    const text = readFileSync(file, 'utf8')
    // the surface rect must cover the centred viewBox, not start at the user-space origin
    const viewBox = /viewBox="([^"]+)"/.exec(text)![1]!.split(' ').map(Number)
    const firstRect = text.indexOf('<rect')
    expect(firstRect).toBeGreaterThan(0)
    const rect = text.slice(firstRect, text.indexOf('>', firstRect))
    expect(rect).toContain(`fill="${surface}"`)
    const attr = (n: string) => Number(new RegExp(` ${n}="([^"]+)"`).exec(rect)![1])
    expect([attr('x'), attr('y'), attr('width'), attr('height')]).toEqual(viewBox)
    expect(text).toContain(`stroke="${darkStroke}"`)
    expect(text).not.toContain('var(--')
  })

  await menu(page, /^Light/)
  await expect.poll(background).toBe(lightBg)
  await expect(line).toHaveAttribute('stroke', lightStroke!)
})
