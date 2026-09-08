import { readFileSync, writeFileSync } from 'node:fs'
import { type Page, expect, test } from '@playwright/test'

import { choose, confirmDialog, dbg, dragSvg, field, isoPoint, makeCube, menu, newSketch, rowAction, tool } from './helpers'

/** Draw a rect in the current sketch by plane inches, given the view centre and scale the editor is using. */
async function drawInches(page: Page, view: { cu: number; cv: number; scale: number; su: 1 | -1 }, a: [number, number], b: [number, number]) {
  const px = (u: number, v: number): [number, number] => [(u - view.cu) * view.su * view.scale, -(v - view.cv) * view.scale]
  await dragSvg(page, px(a[0], a[1]), px(b[0], b[1]))
}

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await page.waitForSelector('.timeline')
  await page.waitForLoadState('networkidle')
})

test('sketch, extrude, pick a face, cut, edit upstream, persist, export', async ({ page }, testInfo) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => m.type() === 'error' && !/favicon|404/.test(m.text()) && errors.push(m.text()))

  let d = await dbg(page)
  expect(d.features).toHaveLength(0)
  expect(d.mode.kind).toBe('model')

  await test.step('new sketch on the default plane', async () => {
    await newSketch(page)
    d = await dbg(page)
    expect(d.mode.kind).toBe('sketch')
    expect(d.tool).toBe('rect')
    expect(d.features[0]!.name).toBe('Sketch 1')
    await expect(page.locator('.axis-indicator')).toContainText('XZ plane, viewed from -Y. X right, Z up.')
  })

  // empty sketch opens centred on (12, 12) at 12 px/in
  const v1 = { cu: 12, cv: 12, scale: 12, su: 1 as const }

  await test.step('rectangle tool draws, snaps to the grid, ignores zero-size drags', async () => {
    await drawInches(page, v1, [0, 0], [24, 24])
    d = await dbg(page)
    const r = d.features[0]!.rects[0]
    expect(r).toMatchObject({ handle: 'r1', u: { min: 0, max: 384 }, v: { min: 0, max: 384 } })
    await dragSvg(page, [-100, 100], [-100, 100])
    d = await dbg(page)
    expect(d.features[0]!.rects).toHaveLength(1)
  })

  await test.step('inline dimension editing', async () => {
    await page.click('text[data-dim="w"]')
    const input = page.locator('input.inline-edit')
    await expect(input).toHaveCount(1)
    await input.fill('abc')
    await input.press('Enter')
    await expect(input).toHaveCount(1)
    await expect(input).toHaveClass(/invalid/)
    await input.fill('23 1/4')
    await input.press('Enter')
    d = await dbg(page)
    expect(d.features[0]!.rects[0].u).toEqual({ min: 0, size: 372 })
    await page.click('text[data-dim="h"]')
    await page.locator('input.inline-edit').press('Escape')
    await expect(page.locator('input.inline-edit')).toHaveCount(0)
    await page.click('text[data-dim="w"]')
    await page.locator('input.inline-edit').fill('24')
    await page.locator('input.inline-edit').press('Enter')
  })

  await test.step('select tool and rectangle properties', async () => {
    await tool(page, 'Select')
    await dragSvg(page, [-80, 100], [-80, 100])
    d = await dbg(page)
    expect(d.selection.rectIds).toHaveLength(1)
    await dragSvg(page, [300, -300], [300, -300])
    d = await dbg(page)
    expect(d.selection.rectIds).toHaveLength(0)
    await page.getByRole('option', { name: 'r1', exact: true }).click()
    const left = field(page, 'Left')
    await left.fill('12')
    await left.press('Enter')
    d = await dbg(page)
    expect(d.features[0]!.rects[0].u).toEqual({ min: 192, size: 384 })
    await left.fill('0')
    await left.press('Enter')
    const width = field(page, 'Width')
    await width.fill('abc @')
    await width.press('Enter')
    await expect(page.locator('.kit-field-error')).toHaveCount(1)
    d = await dbg(page)
    expect(d.features[0]!.rects[0].u).toEqual({ min: 0, size: 384 })
  })

  await test.step('extrude to a 24" cube', async () => {
    await page.getByRole('button', { name: /^Extrude/ }).click()
    d = await dbg(page)
    expect(d.features[1]).toMatchObject({ kind: 'extrude', op: 'new', name: 'Extrude 1' })
    expect(d.mode.kind).toBe('model')
    expect(d.selection.featureId).toBe(d.features[1]!.id)
    expect(d.bodies[0]!.volume).toBe(24 * 24 * 1)
    await field(page, 'Distance').fill('24')
    await field(page, 'Distance').press('Enter')
    d = await dbg(page)
    expect(d.bodies[0]!.volume).toBe(24 ** 3)
  })

  await test.step('click a body to select it and its extrude', async () => {
    await page.mouse.click(...(await isoPoint(page, 24, -12, 12)))
    d = await dbg(page)
    expect(d.selection.bodyId).toBe(d.features[1]!.id)
    await expect(page.getByRole('option', { selected: true })).toContainText('Extrude 1')
    await page.mouse.click(...(await isoPoint(page, -80, 80, 0)))
    d = await dbg(page)
    expect(d.selection.bodyId).toBeUndefined()
  })

  await test.step('pick the top face and sketch on it', async () => {
    await page.click('text=Pick face')
    const [tx, ty] = await isoPoint(page, 12, -12, 24)
    await page.mouse.move(tx, ty)
    await page.mouse.click(tx, ty)
    d = await dbg(page)
    expect(d.features[2]).toMatchObject({ kind: 'sketch', plane: { kind: 'face', face: 'vMax', featureId: d.features[1]!.id } })
    expect(d.mode.kind).toBe('sketch')
    await expect(page.locator('.axis-indicator')).toContainText('XY plane, viewed from +Z. X right, Y up.')
    await expect(page.locator('.sketch svg path')).toHaveCount(1)
  })

  // face sketch is framed on the 24x24 face: centre (12, -12), scale fills 70% of the view
  const svgBox = (await page.locator('.sketch svg').boundingBox())!
  const v2 = { cu: 12, cv: -12, scale: Math.min((svgBox.width * 0.7) / 24, (svgBox.height * 0.7) / 24), su: 1 as const }

  await test.step('snapping and deletion', async () => {
    await drawInches(page, v2, [10, -14], [14, -10])
    d = await dbg(page)
    expect(d.features[2]!.rects[0]).toMatchObject({ u: { min: 160, max: 224 }, v: { min: -224, max: -160 } })
    // end a drag 4 px past the face edge at u = 24: snaps onto the edge
    const px = 4 / v2.scale
    await drawInches(page, v2, [18, -4], [24 + px, -2])
    d = await dbg(page)
    expect(d.features[2]!.rects[1].u.max).toBe(384)
    await tool(page, 'Select')
    await drawInches(page, v2, [21, -3], [21, -3])
    await page.keyboard.press('Delete')
    d = await dbg(page)
    expect(d.features[2]!.rects).toHaveLength(1)
  })

  await test.step('cut a 2" pocket', async () => {
    await page.getByRole('button', { name: /^Extrude/ }).click()
    d = await dbg(page)
    expect(d.features[3]).toMatchObject({ op: 'join', targetBodyId: d.features[1]!.id })
    await field(page, 'Distance').fill('2')
    await field(page, 'Distance').press('Enter')
    await choose(page, 'Direction', /Against/)
    await choose(page, 'Operation', 'Cut')
    d = await dbg(page)
    expect(d.bodies[0]!.volume).toBe(24 ** 3 - 32)
    await page.waitForTimeout(200)
    await page.screenshot({ path: testInfo.outputPath('pocket.png') })
  })

  await test.step('sketch on the right side and join a shelf', async () => {
    await page.click('text=Pick face')
    const [tx, ty] = await isoPoint(page, 24, -12, 12)
    await page.mouse.click(tx, ty)
    d = await dbg(page)
    expect(d.features[4]).toMatchObject({ kind: 'sketch', plane: { face: 'uMax' } })
    await expect(page.locator('.axis-indicator')).toContainText('YZ plane, viewed from +X. Y right, Z up.')
    const box = (await page.locator('.sketch svg').boundingBox())!
    const v3 = { cu: -12, cv: 12, scale: Math.min((box.width * 0.7) / 24, (box.height * 0.7) / 24), su: 1 as const }
    await drawInches(page, v3, [-20, 4], [-4, 8])
    await page.getByRole('button', { name: /^Extrude/ }).click()
    await field(page, 'Distance').fill('12')
    await field(page, 'Distance').press('Enter')
    d = await dbg(page)
    expect(d.errors).toEqual([])
    expect(d.bodies[0]!.bounds.x1).toBe(36 * 16)
    expect(d.bodies[0]!.volume).toBe(24 ** 3 - 32 + 16 * 4 * 12)
  })

  await test.step('editing the first extrude re-evaluates everything after it', async () => {
    await page.getByRole('option', { name: 'Extrude 1' }).click()
    await field(page, 'Distance').fill('30')
    await field(page, 'Distance').press('Enter')
    d = await dbg(page)
    expect(d.errors).toEqual([])
    expect(d.bodies[0]!.volume).toBe(24 * 24 * 30 - 32 + 16 * 4 * 12)
    expect(d.bodies[0]!.bounds.y0).toBe(-30 * 16)
  })

  await test.step('reopen a sketch from the timeline', async () => {
    await rowAction(page, /^Sketch 2/, 'Edit')
    d = await dbg(page)
    expect(d.mode).toMatchObject({ kind: 'sketch', sketchId: d.features[2]!.id })
    await expect(page.locator('[data-rect-id]')).toHaveCount(1)
    await expect(page.locator('.sketch svg path')).toHaveCount(1)
  })

  await test.step('export sketch svg', async () => {
    const [dl] = await Promise.all([page.waitForEvent('download'), menu(page, 'Export sketch as SVG')])
    const p = testInfo.outputPath('sketch.svg')
    await dl.saveAs(p)
    const svg = readFileSync(p, 'utf8')
    expect(svg.startsWith('<svg')).toBe(true)
    expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"')
    expect(svg).toContain('<title>')
    expect(dl.suggestedFilename()).toBe('Untitled-Sketch_2.svg')
    await page.getByRole('button', { name: 'Finish' }).click()
  })

  await test.step('autosave survives reload', async () => {
    await page.reload()
    await page.waitForSelector('.timeline')
    d = await dbg(page)
    expect(d.features).toHaveLength(6)
    expect(d.bodies).toHaveLength(1)
  })

  const jsonPath = testInfo.outputPath('doc.json')
  await test.step('json and png export', async () => {
    const [dl] = await Promise.all([page.waitForEvent('download'), menu(page, 'Download JSON')])
    await dl.saveAs(jsonPath)
    const json = JSON.parse(readFileSync(jsonPath, 'utf8'))
    expect(json.version).toBe(2)
    expect(json.features).toHaveLength(6)
    const [png] = await Promise.all([page.waitForEvent('download'), menu(page, 'Export view as PNG')])
    const pngPath = testInfo.outputPath('model.png')
    await png.saveAs(pngPath)
    expect(readFileSync(pngPath).length).toBeGreaterThan(1000)
  })

  await test.step('delete cascade confirms with the dependent list', async () => {
    await rowAction(page, 'Extrude 1', 'Delete')
    const dialog = page.getByRole('alertdialog', { name: 'Delete Extrude 1?' })
    await expect(dialog.locator('.dependents li')).toHaveText(['Sketch 2', 'Extrude 2', 'Sketch 3', 'Extrude 3'])
    await confirmDialog(page, 'Delete')
    d = await dbg(page)
    expect(d.features.map((f) => f.name)).toEqual(['Sketch 1'])
  })

  await test.step('invalid json is refused, valid json replaces the document', async () => {
    const bad = testInfo.outputPath('bad.json')
    writeFileSync(bad, JSON.stringify({ version: 2, title: 'x', params: [], features: [{ kind: 'extrude', id: 'e', name: 'E', sketchId: 'nope', rectIds: ['r'], distance: 16, op: 'new' }] }))
    await page.setInputFiles('input[type=file]', bad)
    await expect(page.locator('.kit-toast')).toContainText('Could not open bad.json')
    d = await dbg(page)
    expect(d.features).toHaveLength(1)
    await page.setInputFiles('input[type=file]', jsonPath)
    await expect.poll(async () => (await dbg(page)).features.length).toBe(6)
  })

  await test.step('corrupt storage opens a new document with a notice', async () => {
    await page.evaluate(() => localStorage.setItem('drawing.document.v1', '{not json'))
    await page.reload()
    await page.waitForSelector('.timeline')
    await expect(page.locator('.kit-toast')).toContainText('could not be read')
    d = await dbg(page)
    expect(d.features).toHaveLength(0)
  })

  await test.step('new document asks first', async () => {
    await page.setInputFiles('input[type=file]', jsonPath)
    await expect.poll(async () => (await dbg(page)).features.length).toBe(6)
    await menu(page, 'New document')
    await confirmDialog(page, 'Cancel')
    d = await dbg(page)
    expect(d.features).toHaveLength(6)
    await menu(page, 'New document')
    await confirmDialog(page, 'New document')
    d = await dbg(page)
    expect(d.features).toHaveLength(0)
  })

  expect(errors).toEqual([])
})

test('back-facing plane is mirrored and labelled', async ({ page }) => {
  await newSketch(page, { flip: true })
  await expect(page.locator('.axis-indicator')).toContainText('XZ plane, viewed from +Y. X left, Z up.')
  // dragging to the right now decreases u
  await dragSvg(page, [0, 0], [60, -60])
  const d = await dbg(page)
  // the drag started at u = 12" and moved 60 px (5") to the right, which is toward -X on a mirrored plane
  const r = d.features[0]!.rects[0]
  expect(r.u).toEqual({ min: 112, max: 192 })
})

test('sketch view zooms with the wheel and pans with the middle button', async ({ page }) => {
  await newSketch(page)
  const box = (await page.locator('.sketch svg').boundingBox())!
  const cx = box.x + box.width / 2
  const cy = box.y + box.height / 2
  await page.mouse.move(cx + 50, cy + 50)
  const before = await page.locator('.axis-indicator').textContent()
  await page.mouse.wheel(0, -300)
  await page.mouse.move(cx + 51, cy + 51)
  const zoomed = await page.locator('.axis-indicator').textContent()
  expect(zoomed).not.toBe(before)
  await page.mouse.move(cx, cy)
  await page.mouse.down({ button: 'middle' })
  await page.mouse.move(cx + 100, cy, { steps: 4 })
  await page.mouse.up({ button: 'middle' })
  await page.mouse.move(cx + 50, cy + 50)
  const panned = await page.locator('.axis-indicator').textContent()
  expect(panned).not.toBe(zoomed)
})

test('switching an extrude to cut picks the newest body as its target', async ({ page }) => {
  await makeCube(page)
  await newSketch(page)
  await drawInches(page, { cu: 12, cv: 12, scale: 12, su: 1 }, [4, 4], [8, 8])
  await page.getByRole('button', { name: /^Extrude/ }).click()
  await choose(page, 'Operation', 'Cut')
  const d = await dbg(page)
  expect(d.features[3]).toMatchObject({ op: 'cut', targetBodyId: d.features[1]!.id })
  expect(d.errors).toEqual([])
})
