import { expect, test } from '@playwright/test'
import { type View, clickInches, dbg, drawInches, faceView, isoPoint, makeCube, px, rowAction, tool } from './helpers'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await page.waitForSelector('.timeline')
  await page.waitForLoadState('networkidle')
})

async function dragInches(page: import('@playwright/test').Page, view: View, from: [number, number], to: [number, number]) {
  const box = (await page.locator('.sketch svg').boundingBox())!
  const a = px(view, from[0], from[1])
  const b = px(view, to[0], to[1])
  await page.mouse.move(box.x + box.width / 2 + a[0], box.y + box.height / 2 + a[1])
  await page.mouse.down()
  await page.mouse.move(box.x + box.width / 2 + b[0], box.y + box.height / 2 + b[1], { steps: 6 })
  await page.mouse.up()
}

test('dimensions can be dragged, flipped, relabelled, undone, and kept', async ({ page }) => {
  await makeCube(page)
  await page.click('text=Pick face')
  await page.mouse.click(...(await isoPoint(page, 12, -12, 24)))
  const view = await faceView(page, { u0: 0, u1: 24, v0: -24, v1: 0 })
  await drawInches(page, view, [4, -20], [20, -4])
  // link the left edge to the face at 2"
  await tool(page, 'Link')
  await clickInches(page, view, 4, -12)
  await clickInches(page, view, 0, -12)
  await page.locator('input.inline-edit').fill('2')
  await page.locator('input.inline-edit').press('Enter')
  let d = await dbg(page)
  const rect = () => d.features[2]!.rects[0]
  expect(rect().layout).toBeUndefined()

  // the automatic dimension sits 22 px above the top edge (v = -4)
  const stepIn = 22 / view.scale
  const lineV = -4 + stepIn
  await tool(page, 'Select')

  await test.step('click without moving selects, no placement stored', async () => {
    await clickInches(page, view, 1, lineV)
    d = await dbg(page)
    expect(d.selection.constraint).toMatchObject({ axis: 'u', slot: 'min' })
    expect(rect().layout).toBeUndefined()
  })

  await test.step('drag the line up by 2"', async () => {
    await dragInches(page, view, [1, lineV], [1, lineV + 2])
    d = await dbg(page)
    const offset = rect().layout.u.min.offset
    expect(offset).toBeGreaterThanOrEqual(Math.round(stepIn * 16) + 32 - 1)
    expect(offset).toBeLessThanOrEqual(Math.round(stepIn * 16) + 32 + 1)
  })

  await test.step('drag across the rectangle flips it below', async () => {
    d = await dbg(page)
    const cur = -4 + rect().layout.u.min.offset / 16
    await dragInches(page, view, [1, cur], [1, -22])
    d = await dbg(page)
    expect(rect().layout.u.min.offset).toBeLessThan(0)
    // drawn below the bottom edge now
    const labelY = await page.locator('[data-dim-slot$=":min"] text').boundingBox()
    const bottomY = (await page.locator('.sketch svg').boundingBox())!.y
    expect(labelY!.y).toBeGreaterThan(bottomY)
  })

  await test.step('drag the label to the driven end', async () => {
    d = await dbg(page)
    const at = -20 + rect().layout.u.min.offset / 16
    const label = page.locator('[data-dim-slot$=":min"] text')
    const lb = (await label.boundingBox())!
    await page.mouse.move(lb.x + lb.width / 2, lb.y + lb.height / 2)
    await page.mouse.down()
    const box = (await page.locator('.sketch svg').boundingBox())!
    const target = px(view, 2, at)
    await page.mouse.move(box.x + box.width / 2 + target[0], box.y + box.height / 2 + target[1], { steps: 6 })
    await page.mouse.up()
    d = await dbg(page)
    expect(rect().layout.u.min.label).toBeGreaterThan(0.9)
  })

  await test.step('a press on the label without moving still opens the editor', async () => {
    await page.click('[data-dim-slot$=":min"] text')
    await expect(page.locator('input.inline-edit')).toHaveCount(1)
    await page.locator('input.inline-edit').press('Escape')
  })

  await test.step('undo steps back one drag; reload keeps the rest', async () => {
    await page.mouse.click(400, 800)
    await page.keyboard.press('ControlOrMeta+z')
    d = await dbg(page)
    expect(rect().layout.u.min.label).toBeUndefined()
    expect(rect().layout.u.min.offset).toBeLessThan(0)
    await page.reload()
    await page.waitForSelector('.timeline')
    d = await dbg(page)
    expect(rect().layout.u.min.offset).toBeLessThan(0)
    // a reload opens in the model view; reopen the sketch for the last step
    await rowAction(page, /^Sketch 2/, 'Edit')
    await tool(page, 'Select')
  })

  await test.step('size labels move too', async () => {
    const before = (await page.locator('text[data-dim="w"]').boundingBox())!
    await page.mouse.move(before.x + before.width / 2, before.y + before.height / 2)
    await page.mouse.down()
    await page.mouse.move(before.x + before.width / 2, before.y + before.height / 2 + 40, { steps: 5 })
    await page.mouse.up()
    d = await dbg(page)
    expect(rect().layout.u.size.offset).toBeGreaterThan(Math.round(14 / (view.scale / 16)))
    const after = (await page.locator('text[data-dim="w"]').boundingBox())!
    expect(after.y - before.y).toBeGreaterThan(30)
  })
})
