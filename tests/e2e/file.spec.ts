import { expect, test } from '@playwright/test'
import { dbg, makeCube, rowAction } from './helpers'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await page.waitForSelector('.timeline')
  await page.waitForLoadState('networkidle')
})

test('the view is saved with the model: zoom and pan survive a reload and the open sketch reopens', async ({ page }) => {
  await makeCube(page)
  const cb = (await page.locator('.centre canvas').boundingBox())!
  const cx = cb.x + cb.width / 2
  const cy = cb.y + cb.height / 2
  // zoom in, then pan with the middle button
  await page.mouse.move(cx, cy)
  for (let i = 0; i < 5; i++) await page.mouse.wheel(0, -400)
  await page.mouse.move(cx, cy)
  await page.mouse.down({ button: 'middle' })
  await page.mouse.move(cx + 120, cy + 40, { steps: 6 })
  await page.mouse.up({ button: 'middle' })
  await expect.poll(async () => (await dbg(page)).view.camera.zoom).toBeGreaterThan(7)
  const before = (await dbg(page)).view.camera
  expect(before.center.some((c) => c !== 0)).toBe(true)

  // undo does not touch the view
  await page.getByRole('button', { name: 'Undo' }).click()
  expect((await dbg(page)).view.camera).toEqual(before)
  await page.getByRole('button', { name: 'Redo' }).click()

  // reopen the sketch, reload: same camera, and the sketch is open again
  await rowAction(page, /^Sketch 1/, 'Edit')
  await page.waitForTimeout(400)
  await page.reload()
  await page.waitForSelector('.timeline')
  const d = await dbg(page)
  expect(d.mode).toEqual({ kind: 'sketch', sketchId: d.features[0]!.id })
  expect(d.view.camera).toEqual(before)
  await page.getByRole('button', { name: 'Finish' }).click()
  // and the 3D view remounts at the stored camera
  await expect.poll(async () => (await dbg(page)).view.camera.zoom).toBe(before.zoom)
})

test('a document saved under the old storage key loads and is saved under the new one', async ({ page }) => {
  await makeCube(page)
  const saved = await page.evaluate(() => localStorage.getItem('drafter.document.v1'))
  expect(saved).toBeTruthy()
  await page.evaluate((text) => {
    localStorage.clear()
    localStorage.setItem('drawing.document.v1', text!)
  }, saved)
  await page.reload()
  await page.waitForSelector('.timeline')
  const d = await dbg(page)
  expect(d.features).toHaveLength(2)
  await expect.poll(async () => page.evaluate(() => localStorage.getItem('drafter.document.v1') !== null)).toBe(true)
})
