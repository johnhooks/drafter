import { readFileSync, writeFileSync } from 'node:fs'
import { type Page, expect, test } from '@playwright/test'

interface Debug {
  mode: { kind: string; sketchId?: string }
  tool: string
  selection: { featureId?: string; bodyId?: string; rectIds: string[] }
  features: Array<Record<string, any>>
  errors: Array<{ featureId: string; message: string }>
  bodies: Array<{ id: string; volume: number; bounds: Record<string, number> }>
  notices: string[]
}

const dbg = (page: Page) => page.evaluate(() => (window as any).__debug() as Debug)

/** Drag on the sketch svg between pixel offsets relative to its centre. */
async function dragSvg(page: Page, from: [number, number], to: [number, number]) {
  const box = (await page.locator('.sketch svg').boundingBox())!
  const cx = box.x + box.width / 2
  const cy = box.y + box.height / 2
  await page.mouse.move(cx + from[0], cy + from[1])
  await page.mouse.down()
  await page.mouse.move(cx + to[0], cy + to[1], { steps: 8 })
  await page.mouse.up()
}

/** Screen position of a model point in the isometric view at zoom 6, camera at (200,-200,200) looking at the origin. */
async function isoPoint(page: Page, x: number, y: number, z: number): Promise<[number, number]> {
  // the canvas starts at its default 300x150 until r3f's resize observer runs
  await expect.poll(async () => (await page.locator('.centre canvas').boundingBox())?.width ?? 0).toBeGreaterThan(400)
  const cb = (await page.locator('.centre canvas').boundingBox())!
  const sx = (x + y) / Math.SQRT2
  const sy = z * Math.sqrt(2 / 3) - (x - y) / Math.sqrt(6)
  return [cb.x + cb.width / 2 + sx * 6, cb.y + cb.height / 2 - sy * 6]
}

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
    await page.click('text=New sketch')
    await page.click('.dropdown >> text=Create')
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
    expect(r).toMatchObject({ u1: 0, v1: 0, u2: 384, v2: 384 })
    await dragSvg(page, [-100, 100], [-100, 100])
    d = await dbg(page)
    expect(d.features[0]!.rects).toHaveLength(1)
  })

  await test.step('inline dimension editing', async () => {
    await page.click('[data-rect-id] text[data-dim="w"]')
    const input = page.locator('input.inline-edit')
    await expect(input).toHaveCount(1)
    await input.fill('abc')
    await input.press('Enter')
    await expect(input).toHaveCount(1)
    await expect(input).toHaveClass(/invalid/)
    await input.fill('23 1/4')
    await input.press('Enter')
    d = await dbg(page)
    expect(Math.abs(d.features[0]!.rects[0].u2 - d.features[0]!.rects[0].u1)).toBe(372)
    await page.click('[data-rect-id] text[data-dim="h"]')
    await page.locator('input.inline-edit').press('Escape')
    await expect(page.locator('input.inline-edit')).toHaveCount(0)
    await page.click('[data-rect-id] text[data-dim="w"]')
    await page.locator('input.inline-edit').fill('24')
    await page.locator('input.inline-edit').press('Enter')
  })

  await test.step('select tool and rectangle properties', async () => {
    await page.click('text=Select')
    await dragSvg(page, [-80, 100], [-80, 100])
    d = await dbg(page)
    expect(d.selection.rectIds).toHaveLength(1)
    await dragSvg(page, [300, -300], [300, -300])
    d = await dbg(page)
    expect(d.selection.rectIds).toHaveLength(0)
    await page.click('.rect-list .item')
    const fields = page.locator('.panel.right label.field input')
    await fields.nth(2).fill('12')
    await fields.nth(2).press('Enter')
    d = await dbg(page)
    expect(Math.min(d.features[0]!.rects[0].u1, d.features[0]!.rects[0].u2)).toBe(192)
    await fields.nth(2).fill('0')
    await fields.nth(2).press('Enter')
    await fields.nth(4).fill('abc')
    await fields.nth(4).press('Enter')
    await expect(page.locator('.panel.right .field .error')).toHaveCount(1)
    d = await dbg(page)
    expect(Math.abs(d.features[0]!.rects[0].u2 - d.features[0]!.rects[0].u1)).toBe(384)
  })

  await test.step('extrude to a 24" cube', async () => {
    await page.click('button:has-text("Extrude")')
    d = await dbg(page)
    expect(d.features[1]).toMatchObject({ kind: 'extrude', op: 'new', name: 'Extrude 1' })
    expect(d.mode.kind).toBe('model')
    expect(d.selection.featureId).toBe(d.features[1]!.id)
    expect(d.bodies[0]!.volume).toBe(24 * 24 * 1)
    const dist = page.locator('.panel.right label.field input').nth(1)
    await dist.fill('24')
    await dist.press('Enter')
    d = await dbg(page)
    expect(d.bodies[0]!.volume).toBe(24 ** 3)
  })

  await test.step('click a body to select it and its extrude', async () => {
    await page.mouse.click(...(await isoPoint(page, 24, -12, 12)))
    d = await dbg(page)
    expect(d.selection.bodyId).toBe(d.features[1]!.id)
    await expect(page.locator('.timeline .item.selected')).toContainText('Extrude 1')
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
    expect(d.features[2]!.rects[0]).toMatchObject({ u1: 160, v1: -224, u2: 224, v2: -160 })
    // end a drag 4 px past the face edge at u = 24: snaps onto the edge
    const px = 4 / v2.scale
    await drawInches(page, v2, [18, -4], [24 + px, -2])
    d = await dbg(page)
    expect(Math.max(d.features[2]!.rects[1].u1, d.features[2]!.rects[1].u2)).toBe(384)
    await page.click('text=Select')
    await drawInches(page, v2, [21, -3], [21, -3])
    await page.keyboard.press('Delete')
    d = await dbg(page)
    expect(d.features[2]!.rects).toHaveLength(1)
  })

  await test.step('cut a 2" pocket', async () => {
    await page.click('button:has-text("Extrude")')
    d = await dbg(page)
    expect(d.features[3]).toMatchObject({ op: 'join', targetBodyId: d.features[1]!.id })
    await page.locator('.panel.right label.field input').nth(1).fill('2')
    await page.locator('.panel.right label.field input').nth(1).press('Enter')
    await page.locator('.panel.right select').nth(0).selectOption('against')
    await page.locator('.panel.right select').nth(1).selectOption('cut')
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
    await page.click('button:has-text("Extrude")')
    await page.locator('.panel.right label.field input').nth(1).fill('12')
    await page.locator('.panel.right label.field input').nth(1).press('Enter')
    d = await dbg(page)
    expect(d.errors).toEqual([])
    expect(d.bodies[0]!.bounds.x1).toBe(36 * 16)
    expect(d.bodies[0]!.volume).toBe(24 ** 3 - 32 + 16 * 4 * 12)
  })

  await test.step('editing the first extrude re-evaluates everything after it', async () => {
    await page.click('.timeline .item:has-text("Extrude 1")')
    await page.locator('.panel.right label.field input').nth(1).fill('30')
    await page.locator('.panel.right label.field input').nth(1).press('Enter')
    d = await dbg(page)
    expect(d.errors).toEqual([])
    expect(d.bodies[0]!.volume).toBe(24 * 24 * 30 - 32 + 16 * 4 * 12)
    expect(d.bodies[0]!.bounds.y0).toBe(-30 * 16)
  })

  await test.step('reopen a sketch from the timeline', async () => {
    await page.click('.timeline .item:has-text("Sketch 2") >> text=Edit')
    d = await dbg(page)
    expect(d.mode).toMatchObject({ kind: 'sketch', sketchId: d.features[2]!.id })
    await expect(page.locator('[data-rect-id]')).toHaveCount(1)
    await expect(page.locator('.sketch svg path')).toHaveCount(1)
  })

  await test.step('export sketch svg', async () => {
    const [dl] = await Promise.all([page.waitForEvent('download'), page.click('text=Export SVG')])
    const p = testInfo.outputPath('sketch.svg')
    await dl.saveAs(p)
    const svg = readFileSync(p, 'utf8')
    expect(svg.startsWith('<svg')).toBe(true)
    expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"')
    expect(svg).toContain('<title>')
    expect(dl.suggestedFilename()).toBe('Untitled-Sketch_2.svg')
    await page.click('text=Finish')
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
    const [dl] = await Promise.all([page.waitForEvent('download'), page.click('text=Download JSON')])
    await dl.saveAs(jsonPath)
    const json = JSON.parse(readFileSync(jsonPath, 'utf8'))
    expect(json.version).toBe(1)
    expect(json.features).toHaveLength(6)
    const [png] = await Promise.all([page.waitForEvent('download'), page.click('text=Export PNG')])
    const pngPath = testInfo.outputPath('model.png')
    await png.saveAs(pngPath)
    expect(readFileSync(pngPath).length).toBeGreaterThan(1000)
  })

  await test.step('delete cascade confirms with the dependent list', async () => {
    let message = ''
    page.once('dialog', (dlg) => {
      message = dlg.message()
      void dlg.accept()
    })
    await page.click('.timeline .item:has-text("Extrude 1") >> button.danger')
    expect(message).toMatch(/Delete Extrude 1, Sketch 2, Extrude 2, Sketch 3, Extrude 3\?/)
    d = await dbg(page)
    expect(d.features.map((f) => f.name)).toEqual(['Sketch 1'])
  })

  await test.step('invalid json is refused, valid json replaces the document', async () => {
    const bad = testInfo.outputPath('bad.json')
    writeFileSync(bad, JSON.stringify({ version: 1, title: 'x', features: [{ kind: 'extrude', id: 'e', name: 'E', sketchId: 'nope', rectIds: ['r'], distance: 16, op: 'new' }] }))
    await page.setInputFiles('input[type=file]', bad)
    await expect(page.locator('.notice')).toContainText('Could not open bad.json')
    d = await dbg(page)
    expect(d.features).toHaveLength(1)
    await page.setInputFiles('input[type=file]', jsonPath)
    await expect.poll(async () => (await dbg(page)).features.length).toBe(6)
  })

  await test.step('corrupt storage opens a new document with a notice', async () => {
    await page.evaluate(() => localStorage.setItem('drawing.document.v1', '{not json'))
    await page.reload()
    await page.waitForSelector('.timeline')
    await expect(page.locator('.notice')).toContainText('could not be read')
    d = await dbg(page)
    expect(d.features).toHaveLength(0)
  })

  await test.step('new document asks first', async () => {
    await page.setInputFiles('input[type=file]', jsonPath)
    await expect.poll(async () => (await dbg(page)).features.length).toBe(6)
    page.once('dialog', (dlg) => void dlg.dismiss())
    await page.click('text=New document')
    d = await dbg(page)
    expect(d.features).toHaveLength(6)
    page.once('dialog', (dlg) => void dlg.accept())
    await page.click('text=New document')
    d = await dbg(page)
    expect(d.features).toHaveLength(0)
  })

  expect(errors).toEqual([])
})

test('back-facing plane is mirrored and labelled', async ({ page }) => {
  await page.click('text=New sketch')
  await page.locator('.dropdown input[type=checkbox]').check()
  await page.click('.dropdown >> text=Create')
  await expect(page.locator('.axis-indicator')).toContainText('XZ plane, viewed from +Y. X left, Z up.')
  // dragging to the right now decreases u
  await dragSvg(page, [0, 0], [60, -60])
  const d = await dbg(page)
  const r = d.features[0]!.rects[0]
  expect(r.u2).toBeLessThan(r.u1)
})

test('sketch view zooms with the wheel and pans with the middle button', async ({ page }) => {
  await page.click('text=New sketch')
  await page.click('.dropdown >> text=Create')
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
