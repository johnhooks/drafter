import { writeFileSync } from 'node:fs'
import { expect, test } from '@playwright/test'
import { type View, clickInches, dbg, drawInches, field, lineInches, linesOf, newSketch, regionsOf, tool } from './helpers'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await page.waitForSelector('.timeline')
  await page.waitForLoadState('networkidle')
})

const v1: View = { cu: 12, cv: 12, scale: 12, su: 1 }
const rects = (d: Awaited<ReturnType<typeof dbg>>) => d.features[0]!.rects as Array<{ handle: string; lines: string[] }>

test('a drawn rectangle is named, has a form, explodes, and can be grouped again', async ({ page }) => {
  await newSketch(page)
  await drawInches(page, v1, [0, 0], [24, 16])
  let d = await dbg(page)
  expect(rects(d)).toMatchObject([{ handle: 'r1', lines: linesOf(d, 0).map((l) => l.id) }])
  await expect(page.getByRole('option', { name: /^r1 24" x 16"/ })).toBeVisible()

  await test.step('clicking inside the rectangle shows its form', async () => {
    await tool(page, 'Select')
    await clickInches(page, v1, 12, 8)
    d = await dbg(page)
    expect(d.selection.regions).toHaveLength(1)
    await expect(page.getByRole('textbox', { name: 'Width' })).toBeVisible()
    await expect(page.getByRole('textbox', { name: 'Right (this line)' })).toHaveCount(0)
  })

  await test.step('selecting the right line shows the form with that side marked, and Width moves it', async () => {
    await clickInches(page, v1, 24, 8)
    d = await dbg(page)
    expect(d.selection.lineIds).toEqual([linesOf(d, 0)[2]!.id])
    await expect(page.getByRole('textbox', { name: 'Right (this line)' })).toBeVisible()
    await field(page, 'Width').fill('20')
    await field(page, 'Width').press('Enter')
    d = await dbg(page)
    expect(linesOf(d, 0)[2]!.at).toBe(320)
    expect(regionsOf(d, 0)[0]!.bounds.u1).toBe(320)
  })

  await test.step('Width by expression writes the far line, Left moves only the left line', async () => {
    await page.getByRole('textbox', { name: /^Left/ }).fill('4')
    await page.getByRole('textbox', { name: /^Left/ }).press('Enter')
    d = await dbg(page)
    expect(linesOf(d, 0)[0]!.at).toBe(64)
    expect(linesOf(d, 0)[2]!.at).toBe(320)
    await field(page, 'Width').fill('r1.height * 2')
    await field(page, 'Width').press('Enter')
    d = await dbg(page)
    expect(linesOf(d, 0)[2]!.at).toBe('l1.at + (r1.height * 2)')
    expect(d.errors).toEqual([])
    expect(regionsOf(d, 0)[0]!.bounds.u1).toBe(64 + 512)
  })

  await test.step('Explode keeps the lines, rewrites the reference to r1, and the region list reads Region', async () => {
    await page.getByRole('button', { name: 'Explode' }).click()
    d = await dbg(page)
    expect(rects(d)).toEqual([])
    expect(linesOf(d, 0)).toHaveLength(4)
    expect(linesOf(d, 0)[2]!.at).toBe('l1.at + ((l4.at - l2.at) * 2)')
    expect(d.errors).toEqual([])
    expect(regionsOf(d, 0)).toHaveLength(1)
    await expect(page.getByRole('option', { name: /^Region/ })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Explode' })).toHaveCount(0)
  })

  await test.step('Make rectangle on four chained lines', async () => {
    await page.getByRole('button', { name: /^Lines/ }).click()
    for (const h of ['l1', 'l2', 'l3', 'l4']) await page.getByRole('option', { name: h, exact: true }).click({ modifiers: ['Shift'] })
    d = await dbg(page)
    expect(d.selection.lineIds).toHaveLength(4)
    await page.getByRole('button', { name: 'Make rectangle' }).click()
    d = await dbg(page)
    // r1 was exploded, so nothing is in use and the handle starts again
    expect(rects(d).map((r) => r.handle)).toEqual(['r1'])
    await expect(page.getByRole('option', { name: /^r1 /, exact: false })).toBeVisible()
  })

  await test.step('four loose lines drawn as a chain group too', async () => {
    await lineInches(page, v1, [
      [30, 0],
      [40, 0],
      [40, 8],
      [30, 8],
      [30, 0],
    ])
    d = await dbg(page)
    expect(linesOf(d, 0)).toHaveLength(8)
    await tool(page, 'Select')
    // a click on empty canvas clears the four lines still selected from the last step
    await clickInches(page, v1, 12, 30)
    await page.getByRole('option', { name: 'l5', exact: true }).click()
    for (const h of ['l6', 'l7', 'l8']) await page.getByRole('option', { name: h, exact: true }).click({ modifiers: ['Shift'] })
    await page.getByRole('button', { name: 'Make rectangle' }).click()
    d = await dbg(page)
    // the chain's bottom sits on the first rectangle's bottom line too; an end attached to a collinear line still counts
    expect(rects(d).map((r) => r.handle)).toEqual(['r1', 'r2'])
  })
})

test('a version 3 file keeps its rectangle handles and expressions', async ({ page }, testInfo) => {
  const v3 = testInfo.outputPath('v3.json')
  writeFileSync(
    v3,
    JSON.stringify({
      version: 3,
      model: {
        title: 'old',
        params: [],
        features: [
          {
            kind: 'sketch',
            id: 's1',
            handle: 's1',
            name: 'Sketch 1',
            plane: { kind: 'principal', plane: 'XZ', offset: 0, normal: -1 },
            rects: [
              { id: 'a', handle: 'r1', u: { min: 0, max: 384 }, v: { min: 0, max: 384 } },
              { id: 'b', handle: 'r2', u: { min: 'r1.right + 1', size: 160 }, v: { min: 0, max: 'r1.top' } },
            ],
          },
          { kind: 'extrude', id: 'e1', name: 'Extrude 1', sketchId: 's1', rectIds: ['a', 'b'], distance: 384, op: 'new' },
        ],
      },
      view: { camera: { azimuth: -45, elevation: 35.264, zoom: 6, center: [0, 0, 0] } },
    }),
  )
  await page.setInputFiles('input[type=file]', v3)
  await expect.poll(async () => (await dbg(page)).features.length).toBe(2)
  const d = await dbg(page)
  expect(rects(d).map((r) => r.handle)).toEqual(['r1', 'r2'])
  expect(linesOf(d, 0)[4]!.at).toBe('r1.right + 1')
  expect(d.errors).toEqual([])
  expect(d.bodies[0]!.volume).toBe(24 * 24 * 24 + 10 * 24 * 24)
})
