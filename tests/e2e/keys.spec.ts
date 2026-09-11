import { expect, test } from '@playwright/test'
import { type View, clickInches, dbg, drawInches, field, linesOf, newSketch, tool } from './helpers'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await page.waitForSelector('.timeline')
  await page.waitForLoadState('networkidle')
})

const v1: View = { cu: 12, cv: 12, scale: 12, su: 1 }

test('tool keys switch tools, are scoped to the sketch, and stay out of text fields', async ({ page }) => {
  await newSketch(page)
  await drawInches(page, v1, [0, 0], [24, 16])
  const box = (await page.locator('.sketch svg').boundingBox())!
  await page.mouse.move(box.x + 50, box.y + 50)
  let d = await dbg(page)
  expect(d.tool).toBe('rect')

  await test.step('A, L, R, D', async () => {
    for (const [key, name] of [
      ['a', 'select'],
      ['l', 'line'],
      ['r', 'rect'],
      ['d', 'link'],
    ] as const) {
      await page.keyboard.press(key)
      d = await dbg(page)
      expect(d.tool).toBe(name)
      await expect(page.getByRole('radio', { name: new RegExp(`^${name === 'rect' ? 'Rectangle' : name[0]!.toUpperCase() + name.slice(1)}$`) })).toHaveAttribute('aria-checked', 'true')
    }
  })

  await test.step('the tooltip shows the key', async () => {
    await page.mouse.move(box.x + 50, box.y + 50)
    await page.getByRole('radio', { name: 'Select' }).hover()
    await expect(page.locator('.kit-tooltip')).toHaveText('Select (A)', { timeout: 3000 })
    await page.mouse.move(box.x + 50, box.y + 50)
  })

  await test.step('A during a line chain ends the chain without adding a line', async () => {
    await page.keyboard.press('l')
    await clickInches(page, v1, 30, 0)
    await page.mouse.move(box.x + 300, box.y + 100)
    await expect(page.locator('.hint')).toContainText('Click to end the line')
    await page.keyboard.press('a')
    d = await dbg(page)
    expect(d.tool).toBe('select')
    expect(linesOf(d, 0)).toHaveLength(4)
  })

  await test.step('a model view key does nothing in the sketch', async () => {
    const cam = (await dbg(page)).view.camera
    await page.keyboard.press('1')
    expect((await dbg(page)).view.camera).toEqual(cam)
  })

  await test.step('keys type into fields', async () => {
    await clickInches(page, v1, 24, 8)
    await page.getByRole('button', { name: /^Lines/ }).click()
    const position = field(page, 'Position')
    await position.click()
    await position.press('End')
    await page.keyboard.type('a')
    expect((await dbg(page)).tool).toBe('select')
    await expect(position).toHaveValue(/a$/)
    await position.press('Escape')
  })
})

test('keys can be rebound, conflicts are refused, and reset restores the defaults', async ({ page }) => {
  await newSketch(page)
  await page.getByRole('button', { name: 'Finish' }).click()
  await page.getByRole('option', { name: /^Untitled/ }).click()
  await page.getByRole('button', { name: /^Keys/ }).click()
  const pick = async (label: string) => {
    await page.getByRole('listbox', { name: 'Keys' }).getByRole('option', { name: label, exact: true }).click()
    return field(page, `${label} key`)
  }

  await test.step('rebind Select to V', async () => {
    const f = await pick('Select')
    await f.fill('v')
    await f.press('Enter')
    expect((await dbg(page)).keys).toEqual({ 'tool.select': 'V' })
    await expect(f).toHaveValue('V')
    await expect(page.getByRole('option', { name: 'Select', exact: true })).toContainText('V, sketch')
  })

  await test.step('a conflict is refused naming the other command', async () => {
    const f = await pick('Line')
    await f.fill('v')
    await f.press('Enter')
    await expect(page.locator('.kit-field-error')).toContainText('already Select')
    expect((await dbg(page)).keys).toEqual({ 'tool.select': 'V' })
    await f.press('Escape')
  })

  await test.step('the same key in another view is allowed', async () => {
    const f = await pick('Fit')
    await f.fill('v')
    await f.press('Enter')
    expect((await dbg(page)).keys).toEqual({ 'tool.select': 'V', 'view.fit': 'V' })
  })

  await test.step('the rebinding survives a reload and works', async () => {
    await page.reload()
    await page.waitForSelector('.timeline')
    expect((await dbg(page)).keys).toEqual({ 'tool.select': 'V', 'view.fit': 'V' })
    await page.getByRole('option', { name: /^Sketch 1/ }).hover()
    await page.getByRole('option', { name: /^Sketch 1/ }).getByRole('button', { name: 'Edit' }).click()
    const box = (await page.locator('.sketch svg').boundingBox())!
    await page.mouse.move(box.x + 50, box.y + 50)
    await tool(page, 'Rectangle')
    await page.keyboard.press('a')
    expect((await dbg(page)).tool).toBe('rect')
    await page.keyboard.press('v')
    expect((await dbg(page)).tool).toBe('select')
    // the tooltip opens for a hover that starts from elsewhere; hovering the button the key just selected is not a hover start
    await page.getByRole('radio', { name: 'Line' }).hover()
    await page.mouse.move(box.x + 50, box.y + 50)
    await page.getByRole('radio', { name: 'Select' }).hover()
    await expect(page.locator('.kit-tooltip')).toHaveText('Select (V)', { timeout: 3000 })
  })

  await test.step('reset', async () => {
    await page.getByRole('button', { name: 'Finish' }).click()
    await page.getByRole('option', { name: /^Untitled/ }).click()
    await page.getByRole('button', { name: /^Keys/ }).click()
    await page.getByRole('button', { name: 'Reset keys' }).click()
    expect((await dbg(page)).keys).toEqual({})
    await expect(page.getByRole('listbox', { name: 'Keys' }).getByRole('option', { name: 'Select', exact: true })).toContainText('A, sketch')
  })
})
