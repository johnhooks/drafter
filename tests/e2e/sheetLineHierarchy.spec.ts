import { expect, test, type Locator, type Page } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import { newFile, type DocumentFile, type SketchFeature } from '../../src/core/model/types'
import type { Sheet } from '../../src/core/sheets/types'
import { choose, dbg, field, menu } from './helpers'

function rectangle(id: string, plane: SketchFeature['plane'], left: number, bottom: number, right: number, top: number): SketchFeature {
  return {
    kind: 'sketch', id, handle: id, name: id, plane, rects: [],
    lines: [
      { id: `${id}l`, handle: 'l1', dir: 'v', at: left, run: { min: bottom, max: top } },
      { id: `${id}b`, handle: 'l2', dir: 'h', at: bottom, run: { min: left, max: right } },
      { id: `${id}r`, handle: 'l3', dir: 'v', at: right, run: { min: bottom, max: top } },
      { id: `${id}t`, handle: 'l4', dir: 'h', at: top, run: { min: left, max: right } },
    ],
  }
}

function pocketFile(): DocumentFile {
  const file = newFile('Pocket line hierarchy')
  return {
    ...file,
    model: {
      ...file.model,
      features: [
        rectangle('s1', { kind: 'principal', plane: 'XZ', offset: 0, normal: -1 }, 0, 0, 384, 384),
        { kind: 'extrude', id: 'body', name: 'Block', sketchId: 's1', regions: [{ vertical: 's1l', horizontal: 's1b' }], distance: 192, op: 'new' },
        rectangle('s2', { kind: 'principal', plane: 'XY', offset: 384, normal: -1 }, 64, -160, 320, -32),
        { kind: 'extrude', id: 'pocket', name: 'Pocket', sketchId: 's2', regions: [{ vertical: 's2l', horizontal: 's2b' }], distance: 64, op: 'cut', targetBodyId: 'body' },
      ],
    },
    sheets: [{
      id: 'front', name: 'Pocket front', orientation: 'landscape', view: 'front', scale: 4,
      dimensions: [
        { id: 'width', first: [0, 0], second: [384, 0], orientation: 'horizontal', position: -12 },
        { id: 'height', first: [0, 0], second: [0, 384], orientation: 'vertical', position: -16 },
        { id: 'short', first: [0, 384], second: [8, 384], orientation: 'horizontal', position: 368 },
        { id: 'detached', first: [400, 80], second: [432, 80], orientation: 'horizontal', position: 64 },
      ],
      notes: [{ id: 'leader', text: 'Pocket floor', position: [6.75, 2.5], leader: [320, 320] }],
    }],
  }
}

const storedSheets = (page: Page) => page.evaluate(() => (window as unknown as { __debug: () => { sheets: Sheet[] } }).__debug().sheets)
const annotation = (page: Page, id: string) => page.locator(`.sheet-paper [data-annotation-id="${id}"]`)

async function openPocket(page: Page) {
  await page.goto('/')
  await page.setInputFiles('input[type=file]', { name: 'pocket.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(pocketFile())) })
  await expect.poll(async () => (await dbg(page)).bodies.length).toBe(1)
  expect((await dbg(page)).errors).toEqual([])
  await page.getByRole('button', { name: 'Sheets', exact: true }).click()
  await expect(page.locator('.sheet-paper > svg')).toBeVisible()
  expect(await storedSheets(page)).toEqual(pocketFile().sheets)
}

async function hierarchy(svg: Locator) {
  const widths = await svg.evaluate((element) => {
    const strokes = (selector: string) => [...element.querySelectorAll(selector)].map((line) => ({ width: parseFloat(getComputedStyle(line).strokeWidth), color: getComputedStyle(line).stroke }))
    return {
      visible: strokes('[data-sheet-view] line:not([stroke-dasharray])'),
      hidden: strokes('[data-sheet-view] line[stroke-dasharray]'),
      annotations: strokes('[data-annotation-kind] line'),
      dashes: [...element.querySelectorAll('[data-sheet-view] line[stroke-dasharray]')].map((line) => line.getAttribute('stroke-dasharray')),
    }
  })
  expect(widths.visible.length).toBeGreaterThan(0)
  expect(widths.hidden.length).toBeGreaterThan(0)
  expect(widths.annotations.length).toBeGreaterThan(0)
  for (const stroke of widths.visible) {
    expect(stroke.width).toBeCloseTo(0.5 / 25.4, 7)
    expect(stroke.color).toBe('rgb(0, 0, 0)')
  }
  for (const stroke of [...widths.hidden, ...widths.annotations]) expect(stroke.width).toBeCloseTo(0.25 / 25.4, 7)
  expect(widths.dashes.every((dash) => dash === '0.08 0.04')).toBe(true)
  for (const stroke of widths.hidden) expect(stroke.color).toBe('rgb(0, 0, 0)')
  await expect(svg.locator('[data-annotation-id="detached"]')).toHaveAttribute('data-detached', 'true')
  expect(await svg.locator('[data-annotation-id="detached"] line').first().evaluate((line) => getComputedStyle(line).stroke)).toBe('rgb(255, 165, 0)')
  expect(await svg.locator('[data-annotation-id="leader"] line').evaluate((line) => getComputedStyle(line).stroke)).toBe('rgb(0, 0, 0)')
}

async function extensions(svg: Locator, sheet: Sheet, id = 'width') {
  const dimension = sheet.dimensions!.find((entry) => entry.id === id)!
  const geometry = await svg.evaluate((element, annotationId) => {
    const view = element.querySelector('[data-sheet-view]') as SVGGElement
    const origin = view.transform.baseVal.consolidate()!.matrix
    const group = element.querySelector(`[data-annotation-id="${annotationId}"]`)!
    return {
      origin: [origin.e, origin.f],
      lines: [...group.querySelectorAll('line')].map((line) => [line.x1.baseVal.value, line.y1.baseVal.value, line.x2.baseVal.value, line.y2.baseVal.value]),
      label: group.querySelector('text')!.textContent,
    }
  }, id)
  const horizontal = dimension.orientation === 'horizontal'
  const axis = horizontal ? 1 : 0
  const factor = 1 / (16 * sheet.scale)
  const position = geometry.origin[axis]! + dimension.position * factor * (horizontal ? -1 : 1)
  const expected = [dimension.first, dimension.second].flatMap((point) => {
    const paper = [geometry.origin[0]! + point[0] * factor, geometry.origin[1]! - point[1] * factor]
    const distance = position - paper[axis]!
    if (Math.abs(distance) <= 1 / 16) return []
    const start = paper[axis]! + Math.sign(distance) / 16
    const end = position + Math.sign(distance) / 16
    return [horizontal ? [paper[0]!, start, paper[0]!, end] : [start, paper[1]!, end, paper[1]!]]
  })
  expect(geometry.lines).toHaveLength(expected.length + 3)
  for (const [index, line] of expected.entries()) {
    for (const [coordinate, value] of line.entries()) expect(geometry.lines[index]![coordinate]).toBeCloseTo(value, 9)
  }
  expect(geometry.label).toBe('24"')
  const note = sheet.notes![0]!
  const leader = svg.locator('[data-annotation-id="leader"] line')
  await expect(leader).toHaveAttribute('x1', String(note.position[0]))
  await expect(leader).toHaveAttribute('y1', String(note.position[1]))
  await expect(leader).toHaveAttribute('x2', String(geometry.origin[0]! + note.leader![0] * factor))
  await expect(leader).toHaveAttribute('y2', String(geometry.origin[1]! - note.leader![1] * factor))
}

async function exportSvg(page: Page) {
  const pending = page.waitForEvent('download')
  await menu(page, 'Export sheet as SVG')
  return readFile((await (await pending).path())!, 'utf8')
}

test('saved pocket uses the same paper hierarchy and gaps in preview, export and both print paths', async ({ page }) => {
  await openPocket(page)
  const preview = page.locator('.sheet-paper > svg')
  for (const scale of [4, 8]) {
    if (scale === 8) await choose(page, 'Scale', '1:8')
    const sheet = (await storedSheets(page))[0]!
    await hierarchy(preview)
    await extensions(preview, sheet)
    await extensions(preview, sheet, 'height')
    if (scale === 4) await preview.screenshot({ path: '/tmp/sheet-line-hierarchy-fit.png' })
    const beforeZoom = await preview.boundingBox()
    await preview.hover()
    await page.mouse.wheel(0, -250)
    await expect.poll(async () => (await preview.boundingBox())!.width).toBeGreaterThan(beforeZoom!.width)
    await hierarchy(preview)
    await extensions(preview, sheet)
    const exported = await exportSvg(page)
    expect(exported).not.toContain('data-selected')
    const outputPage = await page.context().newPage()
    await outputPage.setContent(`<html><body style="margin:0;background:white">${exported}</body></html>`)
    const output = outputPage.locator('svg').first()
    await hierarchy(output)
    await extensions(output, sheet)
    if (scale === 4) {
      expect((await output.boundingBox())!.width).toBeCloseTo(11 * 96, 1)
      await output.screenshot({ path: '/tmp/sheet-line-hierarchy-print.png' })
    }
    await outputPage.close()
    await page.evaluate(() => {
      delete document.body.dataset.printCalled
      window.print = () => { document.body.dataset.printCalled = 'true' }
    })
    await page.getByRole('button', { name: 'Print Sheet', exact: true }).click()
    await expect(page.locator('body')).toHaveAttribute('data-print-called', 'true')
    const print = page.locator('#sheet-print > section > svg')
    await hierarchy(print)
    await extensions(print, sheet)
    await page.evaluate(() => window.dispatchEvent(new Event('afterprint')))
    await page.evaluate(() => window.dispatchEvent(new Event('beforeprint')))
    await hierarchy(print)
    await extensions(print, sheet)
    await page.evaluate(() => window.dispatchEvent(new Event('afterprint')))
  }
  const saved = await storedSheets(page)
  await page.reload()
  await page.getByRole('button', { name: 'Sheets', exact: true }).click()
  expect(await storedSheets(page)).toEqual(saved)
  await hierarchy(preview)
  await extensions(preview, saved[0]!)
})

test('dimension dragging, omission and selection preserve measured points and warning colours', async ({ page }) => {
  await openPocket(page)
  const preview = page.locator('.sheet-paper > svg')
  const dimension = annotation(page, 'width')
  const original = (await storedSheets(page))[0]!.dimensions![0]!
  await dimension.locator('text').click()
  await expect(dimension).toHaveAttribute('data-selected', 'true')
  const selected = await dimension.evaluate((element) => getComputedStyle(element).stroke)
  const focusColor = await page.evaluate(() => {
    const probe = document.createElement('span')
    probe.style.color = 'var(--kit-focus)'
    document.body.append(probe)
    const color = getComputedStyle(probe).color
    probe.remove()
    return color
  })
  expect(selected).toBe(focusColor)
  expect(await dimension.locator('line').first().evaluate((line) => parseFloat(getComputedStyle(line).strokeWidth))).toBeCloseTo(0.25 / 25.4, 7)
  const label = (await dimension.locator('text').boundingBox())!
  await page.mouse.move(label.x + label.width / 2, label.y + label.height / 2)
  await page.mouse.down()
  await page.mouse.move(label.x + label.width / 2, label.y + label.height / 2 - 70, { steps: 10 })
  await page.mouse.up()
  expect((await storedSheets(page))[0]!.dimensions![0]!.position).toBeGreaterThan(0)
  await extensions(preview, (await storedSheets(page))[0]!)
  for (const [position, expected] of [['0', 0], ['1/8', 2], ['1/4', 4], ['5/16', 5], ['-1/4', -4], ['-1', -16]] as const) {
    await field(page, 'Line position').fill(position)
    await field(page, 'Line position').press('Enter')
    const sheet = (await storedSheets(page))[0]!
    expect(sheet.dimensions![0]!.position).toBe(expected)
    expect(sheet.dimensions![0]!.first).toEqual(original.first)
    expect(sheet.dimensions![0]!.second).toEqual(original.second)
    await extensions(preview, sheet)
  }
  await annotation(page, 'detached').locator('text').click()
  await expect(annotation(page, 'detached')).toHaveAttribute('data-selected', 'true')
  expect(await annotation(page, 'detached').evaluate((element) => getComputedStyle(element).stroke)).toBe('rgb(255, 165, 0)')
  expect(await dimension.evaluate((element) => getComputedStyle(element).stroke)).toBe('rgb(0, 0, 0)')
  await expect(annotation(page, 'short')).toContainText('1/2"')
  await expect(annotation(page, 'short').locator('text')).toHaveAttribute('text-anchor', 'start')
})
