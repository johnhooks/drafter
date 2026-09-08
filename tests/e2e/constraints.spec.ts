import { writeFileSync } from 'node:fs'
import { expect, test } from '@playwright/test'
import { type View, clickInches, dbg, drawInches, faceView, field, isoPoint, makeCube } from './helpers'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await page.waitForSelector('.timeline')
  await page.waitForLoadState('networkidle')
})

/** Link tool: click the driven edge, click the anchor edge, type the distance. */
async function link(page: import('@playwright/test').Page, view: View, driven: [number, number], anchor: [number, number], distance: string) {
  await page.click('button:has-text("Link")')
  await clickInches(page, view, driven[0], driven[1])
  await clickInches(page, view, anchor[0], anchor[1])
  const input = page.locator('input.inline-edit')
  await expect(input).toHaveCount(1)
  await input.fill(distance)
  await input.press('Enter')
  await expect(input).toHaveCount(0)
}

test('inset pocket linked to both face edges follows the carcass and refuses a width edit', async ({ page }) => {
  await makeCube(page)
  await page.click('text=Pick face')
  await page.mouse.click(...(await isoPoint(page, 12, -12, 24)))
  let d = await dbg(page)
  expect(d.features[2]).toMatchObject({ kind: 'sketch', handle: 's2', plane: { face: 'vMax' } })
  const view = await faceView(page, { u0: 0, u1: 24, v0: -24, v1: 0 })

  await drawInches(page, view, [4, -20], [20, -4])
  d = await dbg(page)
  expect(d.features[2]!.rects[0]).toMatchObject({ handle: 'r1', u: { min: 64, max: 320 } })

  await test.step('link left and right edges to the face at 2"', async () => {
    await link(page, view, [4, -12], [0, -12], '2')
    d = await dbg(page)
    expect(d.features[2]!.rects[0].u).toEqual({ min: 'face.left + 2', size: 256 })
    // linking min kept the 16" width, so the right edge now sits at 18"
    await link(page, view, [18, -12], [24, -12], '2')
    d = await dbg(page)
    expect(d.features[2]!.rects[0].u).toEqual({ min: 'face.left + 2', max: 'face.right - 2' })
    expect(d.errors).toEqual([])
    // resolved 2" .. 22"
    await expect(page.locator('.rect-list .item')).toContainText('20" x 16" at (2", -20")')
  })

  await test.step('driving dimensions are drawn and editable', async () => {
    await expect(page.locator('[data-dim-slot]')).toHaveCount(2)
    await expect(page.locator('[data-dim-slot] text').first()).toHaveText('2"')
    await page.click('[data-dim-slot] text >> nth=0')
    const input = page.locator('input.inline-edit')
    await input.fill('1 1/2')
    await input.press('Enter')
    d = await dbg(page)
    expect(d.features[2]!.rects[0].u.min).toBe('face.left + 1 1/2')
  })

  await test.step('non-parallel edges are refused and the tool keeps waiting', async () => {
    await page.click('button:has-text("Link")')
    await clickInches(page, view, 12, -20) // bottom edge of r1
    await clickInches(page, view, 0, -12) // face left edge: not parallel
    await expect(page.locator('.notice')).toContainText('not parallel')
    await expect(page.locator('.hint')).toContainText('measure from')
    await page.keyboard.press('Escape')
  })

  await test.step('width edit is refused when both edges are expressions', async () => {
    await page.click('text=Select')
    await page.click('.rect-list .item')
    const width = field(page, 'Width')
    await expect(page.locator('.panel.right label.field:has(span:has-text("Width"))')).toHaveClass(/derived/)
    await width.fill('10')
    await width.press('Enter')
    await expect(page.locator('.notice').last()).toContainText('r1: size is fixed by min (face.left + 1 1/2) and max (face.right - 2)')
    d = await dbg(page)
    expect(d.features[2]!.rects[0].u).toEqual({ min: 'face.left + 1 1/2', max: 'face.right - 2' })
  })

  await test.step('cut the pocket, widen the carcass, pocket follows', async () => {
    await page.click('button:has-text("Extrude")')
    await field(page, 'Distance').fill('1')
    await field(page, 'Distance').press('Enter')
    await page.locator('.panel.right select').nth(0).selectOption('against')
    await page.locator('.panel.right select').nth(1).selectOption('cut')
    d = await dbg(page)
    expect(d.errors).toEqual([])
    expect(d.bodies[0]!.volume).toBe(24 ** 3 - 20.5 * 16 * 1)
    // widen Sketch 1's rectangle to 30"
    await page.click('.timeline .item:has-text("Sketch 1") >> text=Edit')
    await page.click('.rect-list .item')
    await field(page, 'Width').fill('30')
    await field(page, 'Width').press('Enter')
    d = await dbg(page)
    expect(d.errors).toEqual([])
    expect(d.bodies[0]!.volume).toBe(30 * 24 * 24 - 26.5 * 16 * 1)
    await page.click('text=Finish')
  })

  await test.step('select a dimension and delete it: the slot freezes as a number', async () => {
    await page.click('.timeline .item:has-text("Sketch 2") >> text=Edit')
    await page.click('text=Select')
    // a zero-height line is not clickable for Playwright; the label selects the dimension too
    await page.click('[data-dim-slot] text >> nth=0')
    d = await dbg(page)
    expect(d.selection.constraint).toMatchObject({ axis: 'u', slot: 'min' })
    await page.locator('input.inline-edit').press('Escape')
    await page.keyboard.press('Delete')
    d = await dbg(page)
    expect(d.features[2]!.rects[0].u).toEqual({ min: 24, max: 'face.right - 2' })
    await expect(page.locator('[data-dim-slot]')).toHaveCount(1)
    await page.click('text=Dims')
    await expect(page.locator('[data-dim-slot]')).toHaveCount(0)
  })
})

test('parameters drive extrude distance and rectangle size; rename and delete rules', async ({ page }) => {
  await makeCube(page)
  // deselect to reach document properties
  await page.mouse.click(...(await isoPoint(page, -80, 80, 0)))
  await page.locator('.param.add input').nth(0).fill('ply')
  await page.locator('.param.add input').nth(1).fill('3/4')
  await page.click('.param.add button')
  let d = await dbg(page)
  expect(d.params).toEqual([{ name: 'ply', value: 12 }])

  await page.click('.timeline .item:has-text("Extrude 1")')
  await field(page, 'Distance').fill('ply')
  await field(page, 'Distance').press('Enter')
  d = await dbg(page)
  expect(d.features[1]!.distance).toBe('ply')
  expect(d.bodies[0]!.bounds.y0).toBe(-12)
  await expect(page.locator('.panel.right label.field:has(span:has-text("Distance")) .value')).toHaveText('= 3/4"')
  await page.locator('.panel.right select').nth(0).selectOption('against')
  d = await dbg(page)
  expect(d.features[1]!.distance).toBe('-(ply)')
  expect(d.bodies[0]!.bounds.y1).toBe(12)

  // rectangle size by parameter
  await page.click('.timeline .item:has-text("Sketch 1") >> text=Edit')
  await page.click('.rect-list .item')
  await field(page, 'Height').fill('ply * 4')
  await field(page, 'Height').press('Enter')
  d = await dbg(page)
  expect(d.features[0]!.rects[0].v).toEqual({ min: 0, size: 'ply * 4' })
  expect(d.bodies[0]!.bounds.z1).toBe(48)
  await page.click('text=Finish')

  // rename rewrites, delete refused, change value propagates
  await page.mouse.click(...(await isoPoint(page, -80, 80, 0)))
  const name = page.locator('.param input').first()
  await name.fill('stock')
  await name.press('Enter')
  d = await dbg(page)
  expect(d.features[0]!.rects[0].v.size).toBe('stock * 4')
  expect(d.features[1]!.distance).toBe('-(stock)')
  await page.click('.param button.danger')
  await expect(page.locator('.notice')).toContainText('stock is used by')
  await page.locator('.param label.field:has(span:has-text("Value")) input').first().fill('1/2')
  await page.locator('.param label.field:has(span:has-text("Value")) input').first().press('Enter')
  d = await dbg(page)
  expect(d.bodies[0]!.bounds.z1).toBe(32)
  expect(d.bodies[0]!.bounds.y1).toBe(8)
})

test('version 1 file uploads and migrates', async ({ page }, testInfo) => {
  const v1 = testInfo.outputPath('v1.json')
  writeFileSync(
    v1,
    JSON.stringify({
      version: 1,
      title: 'old',
      features: [
        { kind: 'sketch', id: 's1', name: 'Sketch 1', plane: { kind: 'principal', plane: 'XZ', offset: 0, normal: -1 }, rects: [{ id: 'a', u1: 384, v1: 384, u2: 0, v2: 0 }] },
        { kind: 'extrude', id: 'e1', name: 'Extrude 1', sketchId: 's1', rectIds: ['a'], distance: 384, op: 'new' },
      ],
    }),
  )
  await page.setInputFiles('input[type=file]', v1)
  await expect.poll(async () => (await dbg(page)).features.length).toBe(2)
  const d = await dbg(page)
  expect(d.features[0]).toMatchObject({ handle: 's1', rects: [{ handle: 'r1', u: { min: 0, max: 384 } }] })
  expect(d.bodies[0]!.volume).toBe(24 ** 3)
  await expect(page.locator('.timeline')).toContainText('s1')
})
