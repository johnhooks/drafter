import { expect, test, type Page } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import { addSheet, choose, dbg, makeCube, menu, newSketch } from './helpers'

async function openSheet(page: Page) {
  await page.goto('/')
  await makeCube(page)
  await page.getByRole('button', { name: 'Sheets', exact: true }).click()
  await addSheet(page)
  await expect(page.locator('.sheet-paper > svg')).toBeVisible()
}

async function paperPoint(page: Page, x: number, y: number) {
  return page.locator('.sheet-paper > svg').evaluate((element, point) => {
    const mapped = new DOMPoint(...point).matrixTransform((element as SVGSVGElement).getScreenCTM()!)
    return { x: mapped.x, y: mapped.y }
  }, [x, y])
}

async function clickPaper(page: Page, x: number, y: number) {
  const point = await paperPoint(page, x, y)
  await page.mouse.click(point.x, point.y)
}

async function bottomEdge(page: Page) {
  return page.locator('[data-sheet-view]').evaluate((element) => {
    const lines = [...element.querySelectorAll('line')].filter((line) => line.y1.baseVal.value === line.y2.baseVal.value)
    const bottom = lines.sort((first, second) => second.y1.baseVal.value - first.y1.baseVal.value)[0]!
    const matrix = bottom.getScreenCTM()!
    const first = new DOMPoint(bottom.x1.baseVal.value, bottom.y1.baseVal.value).matrixTransform(matrix)
    const second = new DOMPoint(bottom.x2.baseVal.value, bottom.y2.baseVal.value).matrixTransform(matrix)
    return { first: { x: first.x, y: first.y }, second: { x: second.x, y: second.y } }
  })
}

test('dimension placement, preview, movement, scale, and undo', async ({ page }) => {
  await openSheet(page)
  await page.keyboard.press('d')
  await expect(page.getByRole('radio', { name: 'Dimension', exact: true })).toBeChecked()
  const edge = await bottomEdge(page)
  await page.mouse.click(edge.first.x, edge.first.y)
  await page.mouse.click(edge.second.x, edge.second.y)
  await page.mouse.move((edge.first.x + edge.second.x) / 2, edge.first.y + 20)
  const dimension = page.locator('.sheet-paper [data-annotation-kind="dimension"]')
  await expect(dimension).toContainText('24"')
  await page.mouse.click((edge.first.x + edge.second.x) / 2, edge.first.y + 20)
  await page.keyboard.press('a')
  const label = dimension.locator('text')
  await expect(label).toBeVisible()
  const start = (await label.boundingBox())!
  const history = (await dbg(page)).history.past
  await page.mouse.move(start.x + start.width / 2, start.y + start.height / 2)
  await page.mouse.down()
  await page.mouse.move(start.x + start.width / 2, start.y + start.height / 2 + 18, { steps: 8 })
  await page.mouse.up()
  await expect(dimension).toContainText('24"')
  expect((await label.boundingBox())!.y).toBeGreaterThan(start.y + 10)
  expect((await dbg(page)).history.past).toBe(history + 1)
  await page.keyboard.press('Meta+z')
  expect((await label.boundingBox())!.y).toBeCloseTo(start.y, 0)
  const position = page.getByRole('textbox', { name: 'Line position', exact: true })
  await expect(position).toBeVisible()
  const beforeEdit = (await dbg(page)).history.past
  await position.fill('-1')
  await position.press('Enter')
  await expect(dimension).toContainText('24"')
  expect((await dbg(page)).history.past).toBe(beforeEdit + 1)
  await choose(page, 'Scale', '1:8')
  await expect(dimension).toContainText('24"')
  await page.reload()
  await page.getByRole('button', { name: 'Sheets', exact: true }).click()
  await page.getByRole('option', { name: 'Sheet 1', exact: true }).click()
  await expect(dimension).toContainText('24"')
})

test('note entry, cancellation, leader, editing, deletion, and undo', async ({ page }) => {
  await openSheet(page)
  await page.keyboard.press('n')
  await expect(page.getByRole('radio', { name: 'Note', exact: true })).toBeChecked()
  await clickPaper(page, 1, 1)
  const input = page.getByRole('textbox', { name: 'Note text', exact: true })
  await input.fill('3/4 ply')
  await input.press('Enter')
  const note = page.locator('.sheet-paper [data-annotation-kind="note"]')
  await expect(note).toContainText('3/4 ply')
  await clickPaper(page, 2, 1)
  await input.fill('Cancelled')
  await input.press('Escape')
  await expect(input).toHaveCount(0)
  await expect(note).toHaveCount(1)
  await page.keyboard.press('a')
  const label = note.locator('text')
  await label.dblclick()
  await input.fill('3/4 ply\nFinish both sides')
  await input.press('Enter')
  await expect(note).toContainText('Finish both sides')
  await label.click()
  const paperX = page.getByRole('textbox', { name: 'Paper X', exact: true })
  await paperX.fill('1 1/2')
  await paperX.press('Enter')
  await expect(paperX).toHaveValue('1.5')
  const origin = (await label.boundingBox())!
  const edge = await bottomEdge(page)
  await page.keyboard.down('Shift')
  await page.mouse.move(origin.x + origin.width / 2, origin.y + origin.height / 2)
  await page.mouse.down()
  await page.mouse.move(edge.first.x, edge.first.y, { steps: 8 })
  await page.mouse.up()
  await page.keyboard.up('Shift')
  await expect(note.locator('polygon')).toHaveCount(1)
  await label.click()
  await page.keyboard.press('Delete')
  await expect(note).toHaveCount(0)
  await page.keyboard.press('Meta+z')
  await expect(note).toHaveCount(1)
  await expect(note).toContainText('Finish both sides')
  const downloadPromise = page.waitForEvent('download')
  await menu(page, 'Export sheet as SVG')
  const download = await downloadPromise
  const exported = await readFile((await download.path())!, 'utf8')
  expect(exported).toContain('Finish both sides')
  expect(exported).toContain('<polygon')
  expect(exported).not.toContain('data-selected')
})

test('dimension cancellation and sheet shortcut isolation', async ({ page }) => {
  await openSheet(page)
  await page.keyboard.press('d')
  const edge = await bottomEdge(page)
  await page.mouse.click(edge.first.x, edge.first.y)
  await page.keyboard.press('Escape')
  await expect(page.locator('.sheet-paper > svg')).toBeVisible()
  await expect(page.locator('[data-annotation-kind="dimension"]')).toHaveCount(0)
  await page.getByRole('button', { name: 'Model', exact: true }).click()
  await newSketch(page)
  const before = await dbg(page)
  await page.keyboard.press('n')
  expect((await dbg(page)).tool).toBe(before.tool)
  expect((await dbg(page)).mode).toEqual(before.mode)
})

test('sheet keys are listed, rebindable, and protect the delete alias', async ({ page }) => {
  await openSheet(page)
  await page.keyboard.press('Meta+/')
  const dialog = page.getByRole('dialog', { name: 'Keyboard shortcuts' })
  const dimension = dialog.getByRole('row', { name: /^Dimension sheets / })
  await dimension.getByRole('button', { name: 'Edit Dimension key, currently D' }).click()
  const input = dimension.getByRole('textbox', { name: 'Dimension key', exact: true })
  await input.fill('B')
  await input.press('Enter')
  const note = dialog.getByRole('row', { name: /^Note sheets / })
  await note.getByRole('button', { name: 'Edit Note key, currently N' }).click()
  const noteKey = note.getByRole('textbox', { name: 'Note key', exact: true })
  await noteKey.fill('Backspace')
  await noteKey.press('Enter')
  await expect(note).toContainText('already Delete annotation (sheets)')
  await noteKey.press('Escape')
  await dialog.getByRole('button', { name: 'Close', exact: true }).click()
  await page.keyboard.press('b')
  await expect(page.getByRole('radio', { name: 'Dimension', exact: true })).toBeChecked()
})

test('outer dimensions do not intercept inner dimension labels', async ({ page }) => {
  await openSheet(page)
  await choose(page, 'Scale', '1:8')
  await page.keyboard.press('d')
  const edge = await bottomEdge(page)
  for (const offset of [24, 64]) {
    await page.mouse.click(edge.first.x, edge.first.y)
    await page.mouse.click(edge.second.x, edge.second.y)
    await page.mouse.click((edge.first.x + edge.second.x) / 2, edge.first.y + offset)
  }
  await page.keyboard.press('a')
  const dimensions = page.locator('.sheet-paper [data-annotation-kind="dimension"]')
  await expect(dimensions).toHaveCount(2)
  const inner = dimensions.nth(0)
  const outer = dimensions.nth(1)
  const label = inner.locator('text')
  const before = (await label.boundingBox())!
  const outerBefore = (await outer.locator('text').boundingBox())!
  await page.mouse.click(before.x + before.width / 2, before.y + before.height / 2)
  await expect(inner).toHaveAttribute('data-selected', 'true')
  await expect(outer).not.toHaveAttribute('data-selected')
  await page.mouse.move(before.x + before.width / 2, before.y + before.height / 2)
  await page.mouse.down()
  await page.mouse.move(before.x + before.width / 2, before.y + before.height / 2 + 12, { steps: 8 })
  await page.mouse.up()
  await expect.poll(async () => (await label.boundingBox())!.y).toBeGreaterThan(before.y + 8)
  expect((await outer.locator('text').boundingBox())!.y).toBeCloseTo(outerBefore.y, 0)
})

test('picked dimension geometry stays blue until completion or cancellation and is never exported', async ({ page }) => {
  await openSheet(page)
  await page.keyboard.press('d')
  const edge = await bottomEdge(page)
  const points = page.locator('[data-dimension-picked-point]')
  const edges = page.locator('[data-dimension-picked-edge]')
  await page.mouse.click(edge.first.x, edge.first.y)
  await expect(points).toHaveCount(1)
  await expect(edges).toHaveCount(2)
  const marker = (await points.first().boundingBox())!
  expect(marker.x + marker.width / 2).toBeCloseTo(edge.first.x, 0)
  expect(marker.y + marker.height / 2).toBeCloseTo(edge.first.y, 0)
  const color = await points.first().evaluate((element) => getComputedStyle(element).fill)
  const expected = await page.evaluate(() => {
    const probe = document.createElement('span')
    probe.style.color = 'var(--kit-canvas-select)'
    document.body.append(probe)
    const color = getComputedStyle(probe).color
    probe.remove()
    return color
  })
  expect(color).toBe(expected)
  expect(await edges.first().evaluate((element) => getComputedStyle(element).stroke)).toBe(expected)
  await page.mouse.click(edge.second.x, edge.second.y)
  await page.mouse.move((edge.first.x + edge.second.x) / 2, edge.first.y + 20)
  await expect(points).toHaveCount(2)
  await expect(edges).toHaveCount(3)
  const downloadPromise = page.waitForEvent('download')
  await menu(page, 'Export sheet as SVG')
  const download = await downloadPromise
  const exported = await readFile((await download.path())!, 'utf8')
  expect(exported).not.toContain('data-dimension-picked')
  expect(exported).not.toContain('kit-canvas-select')
  await page.evaluate(() => { window.print = () => {} })
  await page.getByRole('button', { name: 'Print Sheet', exact: true }).click()
  await expect(page.locator('#sheet-print [data-dimension-picked-point]')).toHaveCount(0)
  await page.evaluate(() => window.dispatchEvent(new Event('afterprint')))
  await page.mouse.click((edge.first.x + edge.second.x) / 2, edge.first.y + 20)
  await expect(points).toHaveCount(0)
  await expect(edges).toHaveCount(0)
  await page.mouse.click(edge.first.x, edge.first.y)
  await expect(points).toHaveCount(1)
  await page.keyboard.press('Escape')
  await expect(points).toHaveCount(0)
  await page.mouse.click(edge.first.x, edge.first.y)
  await expect(points).toHaveCount(1)
  await page.keyboard.press('a')
  await expect(points).toHaveCount(0)
  await expect(edges).toHaveCount(0)
})
