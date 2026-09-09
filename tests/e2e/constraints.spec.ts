import { writeFileSync } from 'node:fs'
import { expect, test } from '@playwright/test'
import { type View, choose, clickInches, dbg, drawInches, faceView, field, isoPoint, linesOf, makeCube, regionsOf, rowAction, tool } from './helpers'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await page.waitForSelector('.timeline')
  await page.waitForLoadState('networkidle')
})

/** Link tool: click the driven edge, click the anchor edge, type the distance. */
async function link(page: import('@playwright/test').Page, view: View, driven: [number, number], anchor: [number, number], distance: string) {
  await tool(page, 'Link')
  await clickInches(page, view, driven[0], driven[1])
  await expect(page.locator('[data-link-label]')).toHaveText(['constrain'])
  await clickInches(page, view, anchor[0], anchor[1])
  await expect(page.locator('[data-link-label]')).toHaveText(['constrain', 'anchor'])
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
  expect(d.features[2]).toMatchObject({ kind: 'sketch', handle: 's2', plane: { face: 'side', outward: 1 } })
  const view = await faceView(page, { u0: 0, u1: 24, v0: -24, v1: 0 })

  await drawInches(page, view, [4, -20], [20, -4])
  d = await dbg(page)
  expect(linesOf(d, 2)[0]).toMatchObject({ handle: 'l1', dir: 'v', at: 64 })
  expect(regionsOf(d, 2)[0]!.bounds).toMatchObject({ u0: 64, u1: 320 })
  const left = linesOf(d, 2)[0]!.id
  const leftDim = `[data-dim-slot="L:${left}:at"]`

  await test.step('link left and right lines to the face at 2"', async () => {
    await link(page, view, [4, -12], [0, -12], '2')
    d = await dbg(page)
    expect(linesOf(d, 2)[0]!.at).toBe('face.left + 2')
    // the right line stays where it was drawn
    await link(page, view, [20, -12], [24, -12], '2')
    d = await dbg(page)
    expect(linesOf(d, 2)[2]!.at).toBe('face.right - 2')
    expect(d.errors).toEqual([])
    // resolved 2" .. 22"
    await expect(page.getByRole('option', { name: /^Rectangle 20" x 16"/ })).toContainText('at (2", -20"), lines l1 l2 l3 l4')
    const constraints = page.getByRole('listbox', { name: 'Constraints' }).getByRole('option')
    await expect(constraints).toContainText(['l1.at = face.left + 2', 'l3.at = face.right - 2'])
    await expect(constraints.first()).toContainText('2"')
  })

  await test.step('driving dimensions are drawn and editable; attachments draw nothing', async () => {
    await expect(page.locator('[data-dim-slot^="L:"]:not([data-dim-slot$=":size"])')).toHaveCount(2)
    await expect(page.locator(`${leftDim} text`)).toHaveText('2"')
    await page.click(`${leftDim} text`)
    const input = page.locator('input.inline-edit')
    await input.fill('1 1/2')
    await input.press('Enter')
    d = await dbg(page)
    expect(linesOf(d, 2)[0]!.at).toBe('face.left + 1 1/2')
  })

  await test.step('non-parallel lines are refused and the tool keeps waiting', async () => {
    await tool(page, 'Link')
    await clickInches(page, view, 12, -20) // bottom line
    await clickInches(page, view, 0, -12) // face left edge: not parallel
    await expect(page.locator('.kit-toast')).toContainText('not parallel')
    await expect(page.locator('.hint')).toContainText('measure from')
    await page.keyboard.press('Escape')
    await page.locator('.kit-toast').getByRole('button', { name: 'Dismiss' }).click()
  })

  await test.step('a width edit is refused when the far line is an expression', async () => {
    await tool(page, 'Select')
    await page.click('text[data-dim="w"]')
    const input = page.locator('input.inline-edit')
    await input.fill('10')
    await input.press('Enter')
    await expect(page.locator('.kit-toast', { hasText: 'l3 is fixed by face.right - 2' })).toBeVisible()
    await page.locator('.kit-toast').getByRole('button', { name: 'Dismiss' }).click()
    d = await dbg(page)
    expect(linesOf(d, 2)[2]!.at).toBe('face.right - 2')
    expect(regionsOf(d, 2)[0]!.bounds).toMatchObject({ u0: 24, u1: 352 })
  })

  await test.step('cut the pocket, widen the carcass, pocket follows', async () => {
    await page.getByRole('button', { name: /^Extrude/ }).click()
    await field(page, 'Distance').fill('1')
    await field(page, 'Distance').press('Enter')
    await choose(page, 'Direction', /Against/)
    await choose(page, 'Operation', 'Cut')
    d = await dbg(page)
    expect(d.errors).toEqual([])
    expect(d.bodies[0]!.volume).toBe(24 ** 3 - 20.5 * 16 * 1)
    // widen Sketch 1's region to 30" through its width label
    await rowAction(page, /^Sketch 1/, 'Edit')
    await page.click('text[data-dim="w"]')
    await page.locator('input.inline-edit').fill('30')
    await page.locator('input.inline-edit').press('Enter')
    d = await dbg(page)
    expect(d.errors).toEqual([])
    expect(d.bodies[0]!.volume).toBe(30 * 24 * 24 - 26.5 * 16 * 1)
    await page.getByRole('button', { name: 'Finish' }).click()
  })

  await test.step('select a dimension and delete it: the slot freezes as a number', async () => {
    await rowAction(page, /^Sketch 2/, 'Edit')
    await tool(page, 'Select')
    // a zero-height line is not clickable for Playwright; the label selects the dimension too
    await page.click(`${leftDim} text`)
    d = await dbg(page)
    expect(d.selection.constraint).toMatchObject({ lineId: left, slot: 'at' })
    await page.locator('input.inline-edit').press('Escape')
    await page.keyboard.press('Delete')
    d = await dbg(page)
    expect(linesOf(d, 2)[0]!.at).toBe(24)
    await expect(page.locator('[data-dim-slot^="L:"]:not([data-dim-slot$=":size"])')).toHaveCount(1)
    await page.getByRole('button', { name: 'Dims' }).click()
    await expect(page.locator('[data-dim-slot^="L:"]:not([data-dim-slot$=":size"])')).toHaveCount(0)
    // remove the remaining link from the list: after widening, face.right is 30, so the line freezes at 28
    const list = page.getByRole('listbox', { name: 'Constraints' })
    await expect(list.getByRole('option')).toHaveCount(1)
    await rowAction(page, /l3\.at/, 'Remove')
    d = await dbg(page)
    expect(linesOf(d, 2)[2]!.at).toBe(28 * 16)
    await expect(list).toHaveCount(0)
  })
})

test('parameters drive extrude distance and line position; rename and delete rules', async ({ page }) => {
  await makeCube(page)
  // deselect to reach document properties
  await page.mouse.click(...(await isoPoint(page, -80, 80, 0)))
  // typed, not committed with Enter: the Add button must enable from what is typed
  const add = page.getByRole('button', { name: 'Add parameter' })
  await expect(add).toBeDisabled()
  await page.getByRole('textbox', { name: 'New name' }).fill('ply')
  await page.locator('.param-add').getByRole('textbox', { name: 'Value' }).fill('3/4')
  await expect(add).toBeEnabled()
  await add.click()
  let d = await dbg(page)
  expect(d.params).toEqual([{ name: 'ply', value: 12 }])

  await page.getByRole('option', { name: 'Extrude 1' }).click()
  await field(page, 'Distance').fill('ply')
  await field(page, 'Distance').press('Enter')
  d = await dbg(page)
  expect(d.features[1]!.distance).toBe('ply')
  expect(d.bodies[0]!.bounds.y0).toBe(-12)
  await expect(page.locator('.kit-textfield:has(label:has-text("Distance")) .kit-field-description')).toHaveText('= 3/4"')
  await choose(page, 'Direction', /Against/)
  d = await dbg(page)
  expect(d.features[1]!.distance).toBe('-(ply)')
  expect(d.bodies[0]!.bounds.y1).toBe(12)

  // the top line's position by parameter
  await rowAction(page, /^Sketch 1/, 'Edit')
  await page.getByRole('button', { name: /^Lines/ }).click()
  await page.getByRole('option', { name: 'l4', exact: true }).click()
  await field(page, 'Position').fill('ply * 4')
  await field(page, 'Position').press('Enter')
  d = await dbg(page)
  expect(linesOf(d, 0)[3]!.at).toBe('ply * 4')
  expect(d.bodies[0]!.bounds.z1).toBe(48)
  await page.getByRole('button', { name: 'Finish' }).click()

  // rename rewrites, delete refused, change value propagates
  await page.mouse.click(...(await isoPoint(page, -80, 80, 0)))
  await page.getByRole('option', { name: 'ply' }).click()
  const name = page.getByRole('textbox', { name: 'Name', exact: true })
  await name.fill('stock')
  await name.press('Enter')
  d = await dbg(page)
  expect(linesOf(d, 0)[3]!.at).toBe('stock * 4')
  expect(d.features[1]!.distance).toBe('-(stock)')
  await rowAction(page, 'stock', 'Delete')
  await expect(page.locator('.kit-toast')).toContainText('stock is used by')
  const valueField = page.getByRole('textbox', { name: 'Value' }).first()
  await valueField.fill('1/2')
  await valueField.press('Enter')
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
  expect(d.features[0]).toMatchObject({ handle: 's1' })
  expect(linesOf(d, 0).map((l) => [l.handle, l.at])).toEqual([
    ['l1', 0],
    ['l2', 0],
    ['l3', 384],
    ['l4', 384],
  ])
  expect(d.features[1]).toMatchObject({ regions: [{ vertical: 'a_l', horizontal: 'a_b' }] })
  expect(d.bodies[0]!.volume).toBe(24 ** 3)
  await expect(page.locator('.timeline')).toContainText('s1')
})
