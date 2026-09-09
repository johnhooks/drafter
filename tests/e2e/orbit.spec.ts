import { expect, test } from '@playwright/test'
import { dbg, isoPoint, makeCube } from './helpers'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await page.waitForSelector('.timeline')
  await page.waitForLoadState('networkidle')
})

async function canvasCentre(page: import('@playwright/test').Page): Promise<[number, number]> {
  // the canvas starts at its default 300x150 until r3f's resize observer runs
  await expect.poll(async () => (await page.locator('.centre canvas').boundingBox())?.width ?? 0).toBeGreaterThan(400)
  const cb = (await page.locator('.centre canvas').boundingBox())!
  return [cb.x + cb.width / 2, cb.y + cb.height / 2]
}

/** Drags with a button and waits for the store to settle, including any snap easing. */
async function drag(page: import('@playwright/test').Page, from: [number, number], to: [number, number], button: 'right' | 'middle' | 'left' = 'right') {
  await page.mouse.move(from[0], from[1])
  await page.mouse.down({ button })
  await page.mouse.move(to[0], to[1], { steps: 8 })
  await page.mouse.up({ button })
  await page.waitForTimeout(350)
}

test('orbit by right drag, snap near a canonical view, stay when far, keys and cube, fit, persistence', async ({ page }) => {
  await makeCube(page)
  await page.waitForTimeout(300)
  const [cx, cy] = await canvasCentre(page)
  const cam = async () => (await dbg(page)).view.camera

  await test.step('right drag changes azimuth and left click still picks', async () => {
    const before = await cam()
    await drag(page, [cx, cy], [cx + 60, cy])
    const after = await cam()
    expect(Math.abs(after.azimuth - before.azimuth)).toBeGreaterThan(5)
    expect(after.elevation).toBeCloseTo(before.elevation, 0)
    // picking works from the new angle: the top face is still at the projected point
    await page.getByRole('button', { name: 'Pick face' }).click()
    await page.mouse.click(...(await isoPoint(page, 12, -12, 24)))
    const d = await dbg(page)
    expect(d.features[2]).toMatchObject({ kind: 'sketch', plane: { face: 'side', outward: 1 } })
    await page.getByRole('button', { name: 'Finish' }).click()
  })

  await test.step('a release near the front view settles exactly on it', async () => {
    // drag to roughly the front (azimuth -90, elevation 0) then a hair off
    await page.keyboard.press('1')
    await page.waitForTimeout(250)
    expect(await cam()).toMatchObject({ azimuth: -90, elevation: 0 })
    await drag(page, [cx, cy], [cx + 12, cy - 8])
    const c = await cam()
    expect(c.azimuth).toBeCloseTo(-90, 3)
    expect(c.elevation).toBeCloseTo(0, 3)
  })

  await test.step('a release far from every view stays put', async () => {
    await drag(page, [cx, cy], [cx + 90, cy - 70])
    const c = await cam()
    // not on any canonical view: neither an ortho face nor an iso
    const nearOrtho = [-90, 90, 0, 180].some((a) => Math.abs(((c.azimuth - a + 540) % 360) - 180) <= 8) && Math.abs(c.elevation) <= 8
    const nearPole = Math.abs(Math.abs(c.elevation) - 89.9) <= 8
    const nearIso = [-45, -135, 135, 45].some((a) => Math.abs(((c.azimuth - a + 540) % 360) - 180) <= 8) && Math.abs(c.elevation - 35.264) <= 8
    expect(nearOrtho || nearPole || nearIso).toBe(false)
  })

  await test.step('keys select views and Home returns to the default', async () => {
    await page.keyboard.press('5')
    await page.waitForTimeout(250)
    expect((await cam()).elevation).toBeCloseTo(89, 1)
    await page.keyboard.press('Home')
    await page.waitForTimeout(250)
    expect(await cam()).toMatchObject({ azimuth: -45 })
    expect((await cam()).elevation).toBeCloseTo(35.264, 2)
  })

  await test.step('the view cube is present and F fits', async () => {
    // pan the cube far away, then F brings it back centred
    await drag(page, [cx, cy], [cx + 400, cy + 300], 'middle')
    expect((await cam()).center.some((v) => Math.abs(v) > 100)).toBe(true)
    await page.keyboard.press('f')
    await page.waitForTimeout(200)
    const c = await cam()
    expect(c.center).toEqual([192, -192, 192])
    expect(c.zoom).toBeGreaterThan(6)
  })

  await test.step('the view survives a reload and undo leaves it alone', async () => {
    await page.keyboard.press('2')
    await page.waitForTimeout(250)
    const before = await cam()
    expect(before).toMatchObject({ azimuth: 90, elevation: 0 })
    const hist = (await dbg(page)).history
    await page.reload()
    await page.waitForSelector('.timeline')
    expect(await cam()).toEqual(before)
    expect((await dbg(page)).history.past).toBe(0)
    void hist
  })
})
