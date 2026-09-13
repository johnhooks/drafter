import { expect, test, type Page } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import type { Sheet } from '../../src/core/sheets/types'
import { addSheet, choose, dbg, field, makeCube, menu } from './helpers'

const sheets = (page: Page) => page.evaluate(() => (window as unknown as { __debug: () => { sheets: Sheet[] } }).__debug().sheets)

async function expectProjectedWidth(page: Page, dataUrl: string, expected: number, raster = { width: 3000, height: 1950 }) {
  expect(dataUrl).toMatch(/^data:image\/png;base64,/)
  const extent = await page.evaluate(async (source) => {
    const image = new Image()
    image.src = source
    await image.decode()
    const canvas = document.createElement('canvas')
    canvas.width = image.naturalWidth
    canvas.height = image.naturalHeight
    const context = canvas.getContext('2d')!
    context.drawImage(image, 0, 0)
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data
    let left = canvas.width
    let right = -1
    for (let row = 0; row < canvas.height; row++) {
      for (let column = 0; column < canvas.width; column++) {
        if (pixels[(row * canvas.width + column) * 4 + 3]! > 127) {
          left = Math.min(left, column)
          right = Math.max(right, column)
        }
      }
    }
    return { width: canvas.width, height: canvas.height, span: right - left + 1 }
  }, dataUrl)
  expect(extent.width).toBe(raster.width)
  expect(extent.height).toBe(raster.height)
  expect(Math.abs(extent.span - expected)).toBeLessThanOrEqual(2)
}

async function frontCube(page: Page) {
  await makeCube(page)
  await page.locator('.centre canvas').click({ position: { x: 20, y: 20 } })
  await page.keyboard.press('1')
  await expect.poll(async () => (await dbg(page)).view.camera.elevation).toBe(0)
}

for (const scale of [4, 8]) test(`cold-cache native printing preserves ratio 1:${scale}`, async ({ page }) => {
  await page.goto('/')
  await frontCube(page)
  await page.getByRole('button', { name: 'Sheets', exact: true }).click()
  await page.getByRole('button', { name: 'Add Sheet', exact: true }).click()
  await choose(page, 'View', 'Isometric')
  let trigger = page.getByRole('dialog', { name: 'Add Sheet', exact: true }).getByRole('button', { name: 'Create', exact: true })
  if (scale === 8) {
    await trigger.click()
    await page.getByRole('button', { name: /Scale$/ }).click()
    trigger = page.getByRole('option', { name: '1:8', exact: true })
  }
  const output = await trigger.evaluate((element) => {
    (element as HTMLElement).click()
    window.dispatchEvent(new Event('beforeprint'))
    return { image: document.querySelector('#sheet-print image')?.getAttribute('href'), text: document.querySelector('#sheet-print')?.textContent }
  })
  expect((await sheets(page))[0]!.scale).toBe(scale)
  expect(output.text).toContain(`Isometric   1:${scale}`)
  await expectProjectedWidth(page, output.image!, 7200 / scale)
  await page.evaluate(() => window.dispatchEvent(new Event('afterprint')))
})

test('isometric ratios control exported and printed pixel spans independently of viewport zoom', async ({ page }) => {
  await page.goto('/')
  await frontCube(page)
  const camera = (await dbg(page)).view.camera
  await page.locator('.centre canvas').hover()
  await page.mouse.wheel(0, -300)
  await expect.poll(async () => (await dbg(page)).view.camera.zoom).not.toBe(camera.zoom)
  await page.getByRole('button', { name: 'Sheets', exact: true }).click()
  await addSheet(page, 'Isometric')
  const captured = (await sheets(page))[0]!
  expect(captured.scale).toBe(4)
  const image = page.locator('.sheet-paper [data-sheet-view] image')
  for (const scale of [4, 8]) {
    if (scale === 8) {
      const previousImage = await image.getAttribute('href')
      await choose(page, 'Scale', '1:8')
      await expect(image).not.toHaveAttribute('href', previousImage!)
    }
    await expect(page.getByRole('option', { name: 'Sheet 1', exact: true })).toContainText(`Isometric · 1:${scale}`)
    await expect(page.locator('.sheet-paper')).not.toContainText('NTS')
    await expect(image).toHaveAttribute('href', /^data:image\/png;base64,/)
    await expectProjectedWidth(page, (await image.getAttribute('href'))!, 7200 / scale)
    await page.locator('.sheet-paper').hover()
    await page.mouse.wheel(0, -250)
    const downloadPromise = page.waitForEvent('download')
    await menu(page, 'Export sheet as SVG')
    const exported = await readFile((await (await downloadPromise).path())!, 'utf8')
    expect(exported).toContain(`Isometric   1:${scale}`)
    expect(exported).not.toContain('NTS')
    const exportedImage = exported.match(/<image\b[^>]*href="([^"]+)"/)![1]!
    await expectProjectedWidth(page, exportedImage, 7200 / scale)
    await page.evaluate(() => {
      window.print = () => { document.body.dataset.printCalled = 'true' }
      delete document.body.dataset.printCalled
    })
    await page.getByRole('button', { name: 'Print Sheet', exact: true }).click()
    await expect(page.locator('body')).toHaveAttribute('data-print-called', 'true')
    await expect(page.locator('#sheet-print')).toContainText(`Isometric   1:${scale}`)
    await expectProjectedWidth(page, (await page.locator('#sheet-print image').getAttribute('href'))!, 7200 / scale)
    await page.evaluate(() => window.dispatchEvent(new Event('afterprint')))
    expect((await sheets(page))[0]!.camera).toEqual(captured.camera)
  }
  await page.keyboard.press('Meta+z')
  expect((await sheets(page))[0]!.scale).toBe(4)
  await page.keyboard.press('Meta+Shift+z')
  expect((await sheets(page))[0]!.scale).toBe(8)
  await page.reload()
  await page.getByRole('button', { name: 'Sheets', exact: true }).click()
  expect((await sheets(page))[0]).toEqual({ ...captured, scale: 8 })
  await expect(image).toHaveAttribute('href', /^data:image\/png;base64,/)
  await expectProjectedWidth(page, (await image.getAttribute('href'))!, 900)
})

async function paperPoint(page: Page, x: number, y: number) {
  return page.locator('.sheet-paper > svg').evaluate((element, point) => {
    const mapped = new DOMPoint(...point).matrixTransform((element as SVGSVGElement).getScreenCTM()!)
    return { x: mapped.x, y: mapped.y }
  }, [x, y])
}

test('creation can be cancelled, defaults to front, and commits each orthographic direction', async ({ page }) => {
  await page.goto('/')
  await makeCube(page)
  await page.getByRole('button', { name: 'Sheets', exact: true }).click()
  const history = (await dbg(page)).history.past
  await page.getByRole('button', { name: 'Add Sheet', exact: true }).click()
  await choose(page, 'View', 'Isometric')
  await page.getByRole('dialog', { name: 'Add Sheet', exact: true }).getByRole('button', { name: 'Cancel', exact: true }).click()
  expect(await sheets(page)).toEqual([])
  expect((await dbg(page)).history.past).toBe(history)
  await page.getByRole('button', { name: 'Add Sheet', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Add Sheet', exact: true })
  await expect(dialog.getByRole('button', { name: 'Front View', exact: true })).toBeVisible()
  await dialog.getByRole('button', { name: 'Create', exact: true }).click()
  expect((await sheets(page))[0]).toMatchObject({ name: 'Sheet 1', view: 'front' })
  expect((await dbg(page)).history.past).toBe(history + 1)
  for (const view of ['Top', 'Left', 'Right']) {
    await addSheet(page, view)
    await expect(field(page, 'View')).toHaveValue(view)
    await expect(field(page, 'View')).toHaveAttribute('readonly', '')
    await expect(page.getByRole('button', { name: /View$/ })).toHaveCount(0)
    expect((await sheets(page)).at(-1)?.view).toBe(view.toLowerCase())
  }
})

test('isometric captures orientation, survives undo and reload, and enables scale but disables dimensions', async ({ page }) => {
  await page.goto('/')
  await makeCube(page)
  const { azimuth, elevation } = (await dbg(page)).view.camera
  await page.getByRole('button', { name: 'Sheets', exact: true }).click()
  await addSheet(page, 'Isometric')
  const captured = (await sheets(page))[0]!
  expect(captured.camera).toEqual({ azimuth, elevation })
  await expect(field(page, 'View')).toHaveValue('Isometric')
  await expect(field(page, 'View')).toHaveAttribute('readonly', '')
  await expect(page.getByRole('button', { name: /Scale$/ })).toBeEnabled()
  await expect(page.getByRole('option', { name: 'Sheet 1', exact: true })).toContainText(`Isometric · 1:${captured.scale}`)
  const dimension = page.getByRole('radio', { name: 'Dimension', exact: true })
  await expect(dimension).toBeDisabled()
  await page.keyboard.press('d')
  await expect(page.getByRole('radio', { name: 'Select', exact: true })).toBeChecked()
  expect((await sheets(page))[0]).toEqual(captured)
  await page.keyboard.press('Meta+z')
  expect(await sheets(page)).toEqual([])
  await page.keyboard.press('Meta+Shift+z')
  expect((await sheets(page))[0]).toEqual(captured)
  const image = page.locator('.sheet-paper [data-sheet-view] image')
  await page.getByRole('option', { name: 'Sheet 1', exact: true }).click()
  await expect(image).toHaveAttribute('href', /^data:image\/png;base64,/)
  const originalImage = await image.getAttribute('href')
  await page.getByRole('button', { name: 'Model', exact: true }).click()
  await page.keyboard.press('5')
  await expect.poll(async () => (await dbg(page)).view.camera.elevation).not.toBe(elevation)
  await page.getByRole('button', { name: 'Sheets', exact: true }).click()
  await expect(image).toHaveAttribute('href', originalImage!)
  expect((await sheets(page))[0]).toEqual(captured)
  await page.getByRole('button', { name: 'Model', exact: true }).click()
  await page.getByRole('listbox', { name: 'Timeline', exact: true }).getByRole('option', { name: /Extrude/ }).click()
  await field(page, 'Distance').fill('12')
  await field(page, 'Distance').press('Enter')
  await page.getByRole('button', { name: 'Sheets', exact: true }).click()
  await expect(image).toHaveAttribute('href', /^data:image\/png;base64,/)
  await expect(image).not.toHaveAttribute('href', originalImage!)
  expect((await sheets(page))[0]!.camera).toEqual(captured.camera)
  expect((await sheets(page))[0]!.scale).toBe(captured.scale)
  await addSheet(page)
  await expect(page.getByRole('button', { name: /Scale$/ })).toBeEnabled()
  await page.keyboard.press('d')
  await expect(dimension).toBeChecked()
  await page.getByRole('option', { name: 'Sheet 1', exact: true }).click()
  await expect(dimension).toBeDisabled()
  await expect(page.getByRole('radio', { name: 'Select', exact: true })).toBeChecked()
  await page.reload()
  await page.getByRole('button', { name: 'Sheets', exact: true }).click()
  expect((await sheets(page))[0]).toEqual(captured)
  await expect(image).toHaveAttribute('href', /^data:image\/png;base64,/)
  const fittedImage = await image.getAttribute('href')
  await choose(page, 'Scale', /^1:1$/)
  const overflow = page.getByRole('status').filter({ hasText: 'The view exceeds the drawing area' })
  await expect(overflow).toBeVisible()
  await expect(image).not.toHaveAttribute('href', fittedImage!)
  await expectProjectedWidth(page, (await image.getAttribute('href'))!, 3000)
  const landscapeImage = await image.getAttribute('href')
  await choose(page, 'Orientation', 'Portrait')
  expect((await sheets(page))[0]!.scale).toBe(1)
  await expect(page.getByRole('button', { name: /Scale$/ })).toHaveText('1:1')
  await expect(overflow).toBeVisible()
  await expect(image).not.toHaveAttribute('href', landscapeImage!)
  await expectProjectedWidth(page, (await image.getAttribute('href'))!, 2250, { width: 2250, height: 2700 })
  const bodyId = (await dbg(page)).bodies[0]!.id
  await page.getByRole('button', { name: /Target$/ }).click()
  const targets = page.getByRole('listbox').filter({ has: page.getByRole('option', { name: 'Whole model', exact: true }) })
  await targets.getByRole('option').nth(1).click()
  expect((await sheets(page))[0]).toMatchObject({ targetBodyId: bodyId, scale: 1, orientation: 'portrait', camera: captured.camera })
  await expect(overflow).toBeVisible()
  await choose(page, 'Target', 'Whole model')
  expect((await sheets(page))[0]!.scale).toBe(1)
  await expect(overflow).toBeVisible()
})

test('isometric notes keep paper positions and leaders and export with the rendered image', async ({ page }) => {
  await page.goto('/')
  await makeCube(page)
  await page.getByRole('button', { name: 'Sheets', exact: true }).click()
  await addSheet(page, 'Isometric')
  const image = page.locator('.sheet-paper [data-sheet-view] image')
  await expect(image).toHaveAttribute('href', /^data:image\/png;base64,/)
  const originalImage = await image.getAttribute('href')
  await page.keyboard.press('n')
  const position = await paperPoint(page, 1.25, 1.5)
  await page.mouse.click(position.x, position.y)
  const input = page.getByRole('textbox', { name: 'Note text', exact: true })
  await input.fill('Assembly view')
  await input.press('Enter')
  const note = page.locator('.sheet-paper [data-annotation-kind="note"]')
  await expect(note).toContainText('Assembly view')
  const savedPosition = (await sheets(page))[0]!.notes![0]!.position
  expect(savedPosition[0]).toBeCloseTo(1.25, 1)
  expect(savedPosition[1]).toBeCloseTo(1.5, 1)
  await page.keyboard.press('a')
  const label = note.locator('text')
  const origin = (await label.boundingBox())!
  const endpoint = await paperPoint(page, 2.375, 2.625)
  await page.keyboard.down('Shift')
  await page.mouse.move(origin.x + origin.width / 2, origin.y + origin.height / 2)
  await page.mouse.down()
  await page.mouse.move(endpoint.x, endpoint.y, { steps: 8 })
  await page.mouse.up()
  await page.keyboard.up('Shift')
  await expect(note.locator('polygon')).toHaveCount(1)
  const leader = (await sheets(page))[0]!.notes![0]!.leader!
  expect(leader[0]).toBeCloseTo(2.375, 1)
  expect(leader[1]).toBeCloseTo(2.625, 1)
  await label.click()
  const leaderX = page.getByRole('textbox', { name: 'Leader X', exact: true })
  const leaderY = page.getByRole('textbox', { name: 'Leader Y', exact: true })
  await leaderX.fill('2 1/4')
  await leaderX.press('Enter')
  await leaderY.fill('3 1/2')
  await leaderY.press('Enter')
  await expect(leaderX).toHaveValue('2.25')
  await expect(leaderY).toHaveValue('3.5')
  await expect(note.locator('polygon')).toHaveCount(1)
  await expect(image).toHaveAttribute('href', originalImage!)
  const savedNote = (await sheets(page))[0]!.notes![0]!
  await choose(page, 'Scale', '1:4')
  await choose(page, 'Scale', '1:8')
  expect((await sheets(page))[0]!.notes![0]).toEqual(savedNote)
  await page.keyboard.press('Meta+z')
  expect((await sheets(page))[0]!.scale).toBe(4)
  expect((await sheets(page))[0]!.notes![0]).toEqual(savedNote)
  await page.keyboard.press('Meta+Shift+z')
  expect((await sheets(page))[0]!.scale).toBe(8)
  const downloadPromise = page.waitForEvent('download')
  await menu(page, 'Export sheet as SVG')
  const download = await downloadPromise
  const exported = await readFile((await download.path())!, 'utf8')
  expect(exported).toMatch(/<image\b[^>]*href="data:image\/png;base64,/)
  expect(exported).toContain(`Isometric   1:${(await sheets(page))[0]!.scale}`)
  expect(exported).not.toContain('NTS')
  expect(exported).toContain('Assembly view')
  await page.reload()
  await page.getByRole('button', { name: 'Sheets', exact: true }).click()
  expect((await sheets(page))[0]!.notes![0]).toEqual(savedNote)
  await expect(note).toContainText('Assembly view')
  await expect(note.locator('polygon')).toHaveCount(1)
})
