import { expect, test } from '@playwright/test'
import { type View, clickInches, dbg, drawInches, faceView, field, hoverInches, isoPoint, lineInches, linesOf, makeCube, newSketch, regionAt, regionsOf, tool } from './helpers'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await page.waitForSelector('.timeline')
  await page.waitForLoadState('networkidle')
})

// an empty sketch opens centred on (12, 12) at 12 px per inch
const v1: View = { cu: 12, cv: 12, scale: 12, su: 1 }

test('lines enclose regions: three sides show no fill, the fourth closes one region', async ({ page }) => {
  await newSketch(page)
  await lineInches(page, v1, [
    [0, 0],
    [24, 0],
    [24, 16],
    [0, 16],
  ])
  let d = await dbg(page)
  expect(linesOf(d, 0)).toHaveLength(3)
  expect(regionsOf(d, 0)).toEqual([])
  await expect(page.locator('[data-region]')).toHaveCount(0)
  // the chain continues from the last point; the closing line attaches to the first line's start
  await lineInches(page, v1, [
    [0, 16],
    [0, 0],
  ])
  d = await dbg(page)
  expect(linesOf(d, 0)).toHaveLength(4)
  expect(regionsOf(d, 0)).toHaveLength(1)
  expect(regionsOf(d, 0)[0]!.bounds).toEqual({ u0: 0, u1: 384, v0: 0, v1: 256 })
  await expect(page.locator('[data-region]')).toHaveCount(1)
  // every corner is an attachment, so the loop stays closed when a side moves
  for (const l of linesOf(d, 0)) {
    expect(typeof l.run.min).toBe('string')
    expect(typeof l.run.max).toBe('string')
  }
  // no region is extruded from an empty selection with nothing enclosed; with one region the button is live
  await expect(page.getByRole('button', { name: /^Extrude/ })).toBeEnabled()
})

test('a line across a rectangle attaches at both ends and splits it; a diagonal click projects', async ({ page }) => {
  await newSketch(page)
  await drawInches(page, v1, [0, 0], [24, 16])
  await lineInches(page, v1, [
    [10, 0],
    [10, 16],
  ])
  let d = await dbg(page)
  const split = linesOf(d, 0)[4]!
  expect(split).toMatchObject({ handle: 'l5', dir: 'v', at: 160, run: { min: 'l2.at', max: 'l4.at' } })
  expect(regionsOf(d, 0).map((r) => [r.bounds.u0, r.bounds.u1])).toEqual([
    [0, 160],
    [160, 384],
  ])
  // a second click that is mostly horizontal makes a horizontal line and the chain goes on from its end
  await lineInches(page, v1, [
    [28, 4],
    [36, 6],
  ])
  d = await dbg(page)
  expect(linesOf(d, 0)[5]).toMatchObject({ dir: 'h', at: 64, run: { min: 448, max: 576 } })
  // the diagonal click left the chain at (36, 4); escape ended it, so nothing else was added
  expect(linesOf(d, 0)).toHaveLength(6)
  // a free line shows its length label when hovered
  await tool(page, 'Select')
  await expect(page.locator('text[data-dim="len"]')).toHaveCount(0)
  await hoverInches(page, v1, 32, 4)
  await expect(page.locator('text[data-dim="len"]')).toHaveCount(1)
})

test('nothing is labelled unasked: hover, selection, expression focus, and the display toggles', async ({ page }) => {
  await newSketch(page)
  await drawInches(page, v1, [0, 0], [24, 16])
  await tool(page, 'Select')
  await expect(page.locator('[data-handle]')).toHaveCount(0)
  await expect(page.locator('[data-dim]')).toHaveCount(0)

  await test.step('hover shows the region sizes and keeps them across the gap to the label', async () => {
    await hoverInches(page, v1, 12, 8)
    await expect(page.locator('text[data-dim="w"]')).toHaveCount(1)
    await expect(page.locator('text[data-dim="h"]')).toHaveCount(1)
    await page.click('text[data-dim="w"]')
    await expect(page.locator('input.inline-edit')).toHaveCount(1)
    await page.locator('input.inline-edit').press('Escape')
    // hovering a bounding line keeps the region's labels too
    await hoverInches(page, v1, 24, 8)
    await expect(page.locator('text[data-dim="w"]')).toHaveCount(1)
    await page.mouse.move(5, 5)
    await expect(page.locator('[data-dim]')).toHaveCount(0)
  })

  await test.step('a selected line shows its handle', async () => {
    await clickInches(page, v1, 24, 8)
    const d = await dbg(page)
    expect(d.selection.lineIds).toHaveLength(1)
    await page.mouse.move(5, 5)
    await expect(page.locator('[data-handle]')).toHaveText(['l3'])
    await page.getByRole('button', { name: /^Lines/ }).click()
  })

  await test.step('focusing a length field shows every handle', async () => {
    await field(page, 'Position').focus()
    await expect(page.locator('[data-handle]')).toHaveCount(4)
    expect((await dbg(page)).exprFocus).toBe(true)
    await page.getByRole('textbox', { name: 'Name' }).focus()
    await expect(page.locator('[data-handle]')).toHaveText(['l3'])
  })

  await test.step('the toggles show everything and survive a reload; the grid can go', async () => {
    await clickInches(page, v1, 40, 40)
    await page.getByRole('button', { name: 'Sizes' }).click()
    await page.getByRole('button', { name: 'Handles' }).click()
    await page.mouse.move(5, 5)
    await expect(page.locator('[data-dim]')).toHaveCount(2)
    await expect(page.locator('[data-handle]')).toHaveCount(4)
    expect((await page.locator('[data-grid] line').count()) > 0).toBe(true)
    await page.getByRole('button', { name: 'Grid' }).click()
    await expect(page.locator('[data-grid] line')).toHaveCount(0)
    await tool(page, 'Rectangle')
    await drawInches(page, v1, [30, 0], [40, 10.03])
    const d = await dbg(page)
    expect(regionsOf(d, 0)[1]!.bounds).toEqual({ u0: 480, u1: 640, v0: 0, v1: 160 })
    await page.reload()
    await page.waitForSelector('.timeline')
    expect((await dbg(page)).display).toEqual({ grid: false, constraints: true, handles: true, sizes: true })
    await expect(page.locator('[data-handle]')).toHaveCount(8)
  })
})

test('regions select alone or together, X makes a splitting line construction, the region list follows the view', async ({ page }) => {
  await newSketch(page)
  await drawInches(page, v1, [0, 0], [24, 16])
  await lineInches(page, v1, [
    [10, 0],
    [10, 16],
  ])
  await regionAt(page, v1, 5, 8)
  let d = await dbg(page)
  expect(d.selection.regions).toHaveLength(1)
  expect(d.selection.regions[0]!.horizontal).toBe(linesOf(d, 0)[1]!.id)
  await expect(page.getByRole('listbox', { name: 'Shapes' }).getByRole('option', { selected: true })).toHaveCount(1)
  await regionAt(page, v1, 18, 8, true)
  d = await dbg(page)
  expect(d.selection.regions).toHaveLength(2)
  await expect(page.getByRole('button', { name: 'Extrude (2)' })).toBeVisible()
  await expect(page.getByRole('listbox', { name: 'Shapes' }).getByRole('option', { selected: true })).toHaveCount(2)

  // select the splitting line and make it construction: the regions merge
  await clickInches(page, v1, 10, 8)
  d = await dbg(page)
  expect(d.selection.lineIds).toEqual([linesOf(d, 0)[4]!.id])
  expect(d.selection.regions).toEqual([])
  await page.keyboard.press('x')
  d = await dbg(page)
  expect(linesOf(d, 0)[4]!.construction).toBe(true)
  expect(regionsOf(d, 0)).toHaveLength(1)
  await expect(page.locator('[data-region]')).toHaveCount(1)
  // and back, from the checkbox in the line properties
  await page.getByText('Construction', { exact: true }).click()
  d = await dbg(page)
  expect(linesOf(d, 0)[4]!.construction).toBeUndefined()
  expect(regionsOf(d, 0)).toHaveLength(2)
})

test('the halves of a split rectangle extrude to different depths, sharing the splitting plane', async ({ page }) => {
  await newSketch(page)
  await drawInches(page, v1, [0, 0], [24, 16])
  await lineInches(page, v1, [
    [10, 0],
    [10, 16],
  ])
  await regionAt(page, v1, 5, 8)
  await page.getByRole('button', { name: 'Extrude (1)' }).click()
  await field(page, 'Distance').fill('12')
  await field(page, 'Distance').press('Enter')
  let d = await dbg(page)
  expect(d.bodies).toHaveLength(1)
  expect(d.bodies[0]!.bounds).toMatchObject({ x0: 0, x1: 160, y0: -192, y1: 0 })
  await page.getByRole('option', { name: /^Sketch 1/ }).hover()
  await page.getByRole('option', { name: /^Sketch 1/ }).getByRole('button', { name: 'Edit' }).click()
  await regionAt(page, v1, 18, 8)
  await page.getByRole('button', { name: 'Extrude (1)' }).click()
  await field(page, 'Distance').fill('24')
  await field(page, 'Distance').press('Enter')
  d = await dbg(page)
  expect(d.errors).toEqual([])
  expect(d.bodies).toHaveLength(2)
  expect(d.bodies[1]!.bounds).toMatchObject({ x0: 160, x1: 384, y0: -384, y1: 0 })
  expect(d.features[2]).toMatchObject({ regions: [{ vertical: linesOf(d, 0)[4]!.id, horizontal: linesOf(d, 0)[1]!.id }] })
  // the extrude panel counts regions
  await expect(page.getByText('Sketch 1, 1 region')).toBeVisible()
})

test('a drawn line snaps onto a face edge and its end attaches nowhere on the face', async ({ page }) => {
  await makeCube(page)
  await page.click('text=Pick face')
  await page.mouse.click(...(await isoPoint(page, 12, -12, 24)))
  const view = await faceView(page, { u0: 0, u1: 24, v0: -24, v1: 0 })
  // end the line 4 px short of the face's right edge: it snaps to u = 24
  const px = 4 / view.scale
  await lineInches(page, view, [
    [4, -12],
    [24 - px, -12],
  ])
  const d = await dbg(page)
  expect(linesOf(d, 2)[0]).toMatchObject({ dir: 'h', at: -192, run: { min: 64, max: 384 } })
  expect(regionsOf(d, 2)).toEqual([])
  await tool(page, 'Select')
})
