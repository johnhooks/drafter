import { expect, test } from '@playwright/test'
import { clickInches, dbg, drawInches, expectTickAt, faceView, field, hoverInches, isoPoint, linesOf, link, makeCube, px, rowAction, tool } from './helpers'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await page.waitForSelector('.timeline')
  await page.waitForLoadState('networkidle')
})

const drawnConstraints = '[data-dim-slot^="L:"]:not([data-dim-slot$=":size"])'

test('constraints show on demand, tick at rest, and keep their placement and editing when shown by hover', async ({ page }) => {
  await makeCube(page)
  await page.click('text=Pick face')
  await page.mouse.click(...(await isoPoint(page, 12, -12, 24)))
  const view = await faceView(page, { u0: 0, u1: 24, v0: -24, v1: 0 })
  await drawInches(page, view, [4, -20], [20, -4])
  await link(page, view, [4, -12], [0, -12], '2')
  await link(page, view, [20, -12], [24, -12], '2')
  let d = await dbg(page)
  const left = linesOf(d, 2)[0]!.id
  const right = linesOf(d, 2)[2]!.id
  const bottom = linesOf(d, 2)[1]!.id
  const leftDim = `[data-dim-slot="L:${left}:at"]`
  const rightDim = `[data-dim-slot="L:${right}:at"]`
  await tool(page, 'Select')
  await page.mouse.move(5, 5)
  await expect(page.locator(drawnConstraints)).toHaveCount(2)
  await expect(page.locator('[data-tick]')).toHaveCount(0)

  await test.step('toggle off: nothing drawn, a tick on each driven position and none on the attached corners', async () => {
    await page.getByRole('button', { name: 'Constraints', exact: true }).click()
    await expect(page.locator(drawnConstraints)).toHaveCount(0)
    await expect(page.locator('[data-tick]')).toHaveCount(2)
    // the tick sits at the run midpoint of the left line
    await expectTickAt(page, view, `[data-tick="${left}:at"]`, 2, -12)
  })

  await test.step('hovering a line draws its constraint in place of its tick and lights its anchor; leaving hides both', async () => {
    await hoverInches(page, view, 2, -12)
    await expect(page.locator(leftDim)).toHaveCount(1)
    await expect(page.locator('[data-anchor="face:left"]')).toHaveCount(1)
    await expect(page.locator('[data-anchor]')).toHaveCount(1)
    await expect(page.locator(`[data-tick="${left}:at"]`)).toHaveCount(0)
    await expect(page.locator(rightDim)).toHaveCount(0)
    await expect(page.locator(`[data-tick="${right}:at"]`)).toHaveCount(1)
    await page.mouse.move(5, 5)
    await expect(page.locator(drawnConstraints)).toHaveCount(0)
    await expect(page.locator('[data-anchor]')).toHaveCount(0)
    await expect(page.locator('[data-tick]')).toHaveCount(2)
  })

  await test.step('a hover-shown constraint stays drawn while it is dragged', async () => {
    await hoverInches(page, view, 2, -12)
    const stepIn = 22 / view.scale
    const box = (await page.locator('.sketch svg').boundingBox())!
    const a = px(view, 1, -4 + stepIn)
    const b = px(view, 1, -4 + stepIn + 2)
    await page.mouse.move(box.x + box.width / 2 + a[0], box.y + box.height / 2 + a[1])
    await page.mouse.down()
    await page.mouse.move(box.x + box.width / 2 + b[0], box.y + box.height / 2 + b[1], { steps: 6 })
    // longer than the hover grace, so a cleared hover would have unmounted it by now
    await page.waitForTimeout(300)
    await expect(page.locator(leftDim)).toHaveCount(1)
    await page.mouse.up()
    d = await dbg(page)
    expect(linesOf(d, 2)[0]!.layout.at.offset).toBeGreaterThan(Math.round(stepIn * 16))
    await page.keyboard.press('ControlOrMeta+z')
    d = await dbg(page)
    expect(linesOf(d, 2)[0]!.layout).toBeUndefined()
    await page.mouse.move(5, 5)
  })

  await test.step('selecting from the constraints list draws it as the selected one', async () => {
    await page.getByRole('listbox', { name: 'Constraints' }).getByRole('option', { name: /l1\.at/ }).click()
    await page.mouse.move(5, 5)
    await expect(page.locator(leftDim)).toHaveCount(1)
    await expect(page.locator(`${leftDim}[data-dim-selected]`)).toHaveCount(1)
    await clickInches(page, view, 12, -2)
    await expect(page.locator(drawnConstraints)).toHaveCount(0)
  })

  await test.step('a driven run end ticks at that end', async () => {
    await clickInches(page, view, 12, -20)
    // the rectangle form above the line fields has a Right side too; the line's run end is the last one
    await field(page, 'Right').last().fill('l3.at - 1')
    await field(page, 'Right').last().press('Enter')
    d = await dbg(page)
    expect(linesOf(d, 2)[1]!.run.max).toBe('l3.at - 1')
    await clickInches(page, view, 12, -2)
    await page.mouse.move(5, 5)
    await expectTickAt(page, view, `[data-tick="${bottom}:max"]`, 21, -20)
  })

  await test.step('toggle on: every constraint drawn, no anchor lit, the hovered line highlights its own', async () => {
    await page.getByRole('button', { name: 'Constraints', exact: true }).click()
    await expect(page.locator(drawnConstraints)).toHaveCount(3)
    await expect(page.locator('[data-tick]')).toHaveCount(0)
    await expect(page.locator('[data-anchor]')).toHaveCount(0)
    await hoverInches(page, view, 2, -12)
    await expect(page.locator(`${leftDim}[data-dim-highlight]`)).toHaveCount(1)
    await expect(page.locator(`${rightDim}[data-dim-highlight]`)).toHaveCount(0)
    await expect(page.locator(rightDim)).toHaveCount(1)
    await page.mouse.move(5, 5)
    await expect(page.locator('[data-dim-highlight]')).toHaveCount(0)
    // the picked constraint is told apart from the rest of its line's: select the bottom line, then pick l1.at
    await clickInches(page, view, 12, -20)
    await expect(page.locator(`[data-dim-slot="L:${bottom}:max"][data-dim-highlight]`)).toHaveCount(1)
    // the selected bottom line's run end follows l3, so l3 lights as its anchor
    await expect(page.locator(`[data-anchor="line:${right}"]`)).toHaveCount(1)
    await page.getByRole('listbox', { name: 'Constraints' }).getByRole('option', { name: /^l1\.at/ }).click()
    await page.mouse.move(5, 5)
    await expect(page.locator('[data-dim-selected]')).toHaveCount(1)
    await expect(page.locator(`${leftDim}[data-dim-selected]`)).toHaveCount(1)
    await expect(page.locator(`[data-dim-slot="L:${bottom}:max"][data-dim-highlight]:not([data-dim-selected])`)).toHaveCount(1)
    await clickInches(page, view, 12, -2)
  })

  await test.step('a stored placement applies when shown by hover', async () => {
    const stepIn = 22 / view.scale
    await drawInches(page, view, [1, -4 + stepIn], [1, -4 + stepIn + 2])
    d = await dbg(page)
    expect(linesOf(d, 2)[0]!.layout.at.offset).toBeGreaterThan(Math.round(stepIn * 16))
    await page.mouse.move(5, 5)
    const placed = (await page.locator(`${leftDim} text`).boundingBox())!
    await page.getByRole('button', { name: 'Constraints', exact: true }).click()
    await hoverInches(page, view, 2, -12)
    const hovered = (await page.locator(`${leftDim} text`).boundingBox())!
    expect(Math.abs(hovered.y - placed.y)).toBeLessThan(1)
    expect(Math.abs(hovered.x - placed.x)).toBeLessThan(1)
  })

  await test.step('a hover-shown constraint edits inline and deletes', async () => {
    await hoverInches(page, view, 2, -12)
    await page.click(`${leftDim} text`)
    const input = page.locator('input.inline-edit')
    await input.fill('1 1/2')
    await input.press('Enter')
    d = await dbg(page)
    expect(linesOf(d, 2)[0]!.at).toBe('face.left + 1 1/2')
    await hoverInches(page, view, 1.5, -12)
    await page.click(`${leftDim} text`)
    await page.locator('input.inline-edit').press('Escape')
    d = await dbg(page)
    expect(d.selection.constraint).toMatchObject({ lineId: left, slot: 'at' })
    await page.keyboard.press('Delete')
    d = await dbg(page)
    expect(linesOf(d, 2)[0]!.at).toBe(24)
    await page.mouse.move(5, 5)
    await expect(page.locator(`[data-tick="${left}:at"]`)).toHaveCount(0)
    await expect(page.locator(`[data-tick="${right}:at"]`)).toHaveCount(1)
  })

  await test.step('the list entry still removes a hidden constraint', async () => {
    await rowAction(page, /^l3\.at/, 'Remove')
    d = await dbg(page)
    expect(linesOf(d, 2)[2]!.at).toBe(22 * 16)
    await expect(page.locator('[data-tick]')).toHaveCount(1)
  })
})
