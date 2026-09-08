import { expect, test } from '@playwright/test'
import { confirmDialog, dbg, field, makeCube, rowAction } from './helpers'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await page.waitForSelector('.timeline')
  await page.waitForLoadState('networkidle')
})

test('undo and redo from the toolbar and the keyboard', async ({ page }) => {
  const undo = page.getByRole('button', { name: 'Undo' })
  const redo = page.getByRole('button', { name: 'Redo' })
  await expect(undo).toBeDisabled()
  await expect(redo).toBeDisabled()

  await makeCube(page)
  await expect(undo).toBeEnabled()
  let d = await dbg(page)
  expect(d.bodies[0]!.bounds.y0).toBe(-384)

  // keys do nothing to the document while a field has focus; the browser's text undo may edit the draft
  await field(page, 'Distance').focus()
  await page.keyboard.press('ControlOrMeta+z')
  d = await dbg(page)
  expect(d.bodies[0]!.bounds.y0).toBe(-384)
  expect(d.history).toEqual({ past: 4, future: 0 })

  // Escape reverts the draft and leaves the field, then undo the distance change
  await page.keyboard.press('Escape')
  await page.keyboard.press('ControlOrMeta+z')
  d = await dbg(page)
  expect(d.bodies[0]!.bounds.y0).toBe(-16)
  await expect(redo).toBeEnabled()
  await page.keyboard.press('ControlOrMeta+Shift+z')
  d = await dbg(page)
  expect(d.bodies[0]!.bounds.y0).toBe(-384)

  // toolbar buttons do the same
  await undo.click()
  d = await dbg(page)
  expect(d.bodies[0]!.bounds.y0).toBe(-16)
  await redo.click()
  d = await dbg(page)
  expect(d.bodies[0]!.bounds.y0).toBe(-384)

  // a cascade delete comes back in one step
  await rowAction(page, /^Sketch 1/, 'Delete')
  await confirmDialog(page, 'Delete')
  d = await dbg(page)
  expect(d.features).toHaveLength(0)
  await undo.click()
  d = await dbg(page)
  expect(d.features).toHaveLength(2)
  expect(d.bodies).toHaveLength(1)
})
