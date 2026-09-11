import { type Page, expect } from '@playwright/test'

export interface Debug {
  mode: { kind: string; sketchId?: string }
  tool: string
  selection: { featureId?: string; bodyId?: string; lineIds: string[]; regions: Array<{ vertical: string; horizontal: string }>; constraint?: unknown }
  features: Array<Record<string, any>>
  /** Regions per sketch id: corner refs, bounds in sixteenths, and area. */
  regions: Record<string, Array<{ ref: { vertical: string; horizontal: string }; bounds: { u0: number; u1: number; v0: number; v1: number }; area: number }>>
  errors: Array<{ featureId: string; message: string }>
  bodies: Array<{ id: string; volume: number; bounds: Record<string, number> }>
  notices: string[]
  params: Array<{ name: string; value: unknown }>
  history: { past: number; future: number }
  view: { camera: { azimuth: number; elevation: number; zoom: number; center: [number, number, number] }; sketchId?: string }
  display: { grid: boolean; constraints: boolean; handles: boolean; sizes: boolean }
  exprFocus: boolean
  keys: Record<string, string | null>
}

export const dbg = (page: Page) => page.evaluate(() => (window as any).__debug() as Debug)

/** Drag on the sketch svg between pixel offsets relative to its centre. */
export async function dragSvg(page: Page, from: [number, number], to: [number, number]) {
  const box = (await page.locator('.sketch svg').boundingBox())!
  const cx = box.x + box.width / 2
  const cy = box.y + box.height / 2
  await page.mouse.move(cx + from[0], cy + from[1])
  await page.mouse.down()
  await page.mouse.move(cx + to[0], cy + to[1], { steps: 8 })
  await page.mouse.up()
}

export interface View {
  cu: number
  cv: number
  scale: number
  su: 1 | -1
}

/** Pixel offset from the svg centre for a point in plane inches under a given view. */
export const px = (view: View, u: number, v: number): [number, number] => [(u - view.cu) * view.su * view.scale, -(v - view.cv) * view.scale]

export async function clickInches(page: Page, view: View, u: number, v: number) {
  const box = (await page.locator('.sketch svg').boundingBox())!
  const [x, y] = px(view, u, v)
  await page.mouse.click(box.x + box.width / 2 + x, box.y + box.height / 2 + y)
}

/** Draw a rectangle in the current sketch by plane inches, with the Rectangle tool active. */
export async function drawInches(page: Page, view: View, a: [number, number], b: [number, number]) {
  await dragSvg(page, px(view, a[0], a[1]), px(view, b[0], b[1]))
}

/** Draw a chain of lines through the points with the Line tool, then end the chain with Escape. */
export async function lineInches(page: Page, view: View, points: Array<[number, number]>) {
  await tool(page, 'Line')
  for (const [u, v] of points) await clickInches(page, view, u, v)
  await page.keyboard.press('Escape')
}

/** Move the pointer to a point in plane inches without clicking, so hover labels appear. */
export async function hoverInches(page: Page, view: View, u: number, v: number) {
  const box = (await page.locator('.sketch svg').boundingBox())!
  const [x, y] = px(view, u, v)
  await page.mouse.move(box.x + box.width / 2 + x, box.y + box.height / 2 + y)
}

/** Click inside a region with the Select tool. */
export async function regionAt(page: Page, view: View, u: number, v: number, shift = false) {
  await tool(page, 'Select')
  const box = (await page.locator('.sketch svg').boundingBox())!
  const [x, y] = px(view, u, v)
  if (shift) await page.keyboard.down('Shift')
  await page.mouse.click(box.x + box.width / 2 + x, box.y + box.height / 2 + y)
  if (shift) await page.keyboard.up('Shift')
}

/** Lines of a sketch feature from the debug hook, by id. */
export const linesOf = (d: Debug, i: number): Array<Record<string, any>> => d.features[i]!.lines
export const lineById = (d: Debug, i: number, id: string): Record<string, any> | undefined => linesOf(d, i).find((l) => l.id === id)
/** Regions of the sketch at feature index i. */
export const regionsOf = (d: Debug, i: number) => d.regions[d.features[i]!.id] ?? []

/** The view a face sketch opens with: framed on its face at 70% of the viewport. */
export async function faceView(page: Page, face: { u0: number; u1: number; v0: number; v1: number }, su: 1 | -1 = 1): Promise<View> {
  const box = (await page.locator('.sketch svg').boundingBox())!
  const w = face.u1 - face.u0
  const h = face.v1 - face.v0
  return { cu: (face.u0 + face.u1) / 2, cv: (face.v0 + face.v1) / 2, scale: Math.min((box.width * 0.7) / w, (box.height * 0.7) / h), su }
}

/**
 * Screen position of a model point (inches) under the current stored camera: an orthographic
 * projection from the spherical state the app itself renders from.
 */
export async function isoPoint(page: Page, x: number, y: number, z: number): Promise<[number, number]> {
  // the canvas starts at its default 300x150 until r3f's resize observer runs
  await expect.poll(async () => (await page.locator('.centre canvas').boundingBox())?.width ?? 0).toBeGreaterThan(400)
  const cb = (await page.locator('.centre canvas').boundingBox())!
  const cam = (await dbg(page)).view.camera
  const az = (cam.azimuth * Math.PI) / 180
  const el = (cam.elevation * Math.PI) / 180
  // camera basis: forward toward the centre, right = up x forward, up = right x forward (z up)
  const f = [-Math.cos(el) * Math.cos(az), -Math.cos(el) * Math.sin(az), -Math.sin(el)]
  const worldUp = [0, 0, 1]
  const cross = (a: number[], b: number[]) => [a[1]! * b[2]! - a[2]! * b[1]!, a[2]! * b[0]! - a[0]! * b[2]!, a[0]! * b[1]! - a[1]! * b[0]!]
  const norm = (a: number[]) => {
    const l = Math.hypot(a[0]!, a[1]!, a[2]!) || 1
    return [a[0]! / l, a[1]! / l, a[2]! / l]
  }
  const right = norm(cross(f, worldUp))
  const up = norm(cross(right, f))
  const [cx, cy, cz] = cam.center.map((v) => v / 16)
  const d = [x - cx!, y - cy!, z - cz!]
  const sx = d[0]! * right[0]! + d[1]! * right[1]! + d[2]! * right[2]!
  const sy = d[0]! * up[0]! + d[1]! * up[1]! + d[2]! * up[2]!
  return [cb.x + cb.width / 2 + sx * cam.zoom, cb.y + cb.height / 2 - sy * cam.zoom]
}

/** Opens the New sketch dialog and creates on the default plane. */
export async function newSketch(page: Page, opts: { flip?: boolean } = {}) {
  await page.getByRole('button', { name: 'New sketch' }).click()
  const dialog = page.getByRole('dialog', { name: 'New sketch' })
  // React Aria hides the checkbox input; click its label instead
  if (opts.flip) await dialog.getByText('Flip normal').click()
  await dialog.getByRole('button', { name: 'Create' }).click()
  await expect(dialog).toHaveCount(0)
}

/** Builds the 24" cube from the front plane and returns to model mode. */
export async function makeCube(page: Page) {
  await newSketch(page)
  await drawInches(page, { cu: 12, cv: 12, scale: 12, su: 1 }, [0, 0], [24, 24])
  await page.getByRole('button', { name: /^Extrude/ }).click()
  await field(page, 'Distance').fill('24')
  await field(page, 'Distance').press('Enter')
}

/** A kit text field by its label; derived fields carry a "(derived)" suffix. */
export function field(page: Page, label: string) {
  return page.getByRole('textbox', { name: new RegExp(`^${label}`) })
}

/** Chooses an option in a kit Select by its label. The trigger's name is its value followed by the label. */
export async function choose(page: Page, label: string, option: string | RegExp) {
  await page.getByRole('button', { name: new RegExp(`${label}$`) }).click()
  await page.getByRole('option', { name: option }).click()
}

/** Picks a sketch tool from the toolbar toggle group. */
export async function tool(page: Page, name: 'Select' | 'Line' | 'Rectangle' | 'Link') {
  await page.getByRole('radio', { name }).click()
}

/** Clicks an action that only appears when its list row is hovered. */
export async function rowAction(page: Page, row: string | RegExp, action: string) {
  const option = page.getByRole('option', { name: row })
  await option.hover()
  await option.getByRole('button', { name: action }).click()
}

/** Opens the More menu and chooses an item. */
export async function menu(page: Page, item: string | RegExp) {
  await page.getByRole('button', { name: 'More' }).click()
  await page.getByRole('menuitem', { name: item }).click()
}

/** Confirms or cancels the open confirm dialog. */
export async function confirmDialog(page: Page, button: string) {
  const dialog = page.getByRole('alertdialog')
  await dialog.getByRole('button', { name: button }).click()
  await expect(dialog).toHaveCount(0)
}

/** Link tool: click the driven edge, click the anchor edge, type the distance. */
export async function link(page: Page, view: View, driven: [number, number], anchor: [number, number], distance: string) {
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

/** Asserts that a tick's centre sits within 2 px of a plane point. */
export async function expectTickAt(page: Page, view: View, selector: string, u: number, v: number) {
  const tick = page.locator(selector)
  await expect(tick).toHaveCount(1)
  const box = (await page.locator('.sketch svg').boundingBox())!
  const tb = (await tick.boundingBox())!
  const [tx, ty] = px(view, u, v)
  expect(Math.abs(tb.x + tb.width / 2 - (box.x + box.width / 2 + tx))).toBeLessThan(2)
  expect(Math.abs(tb.y + tb.height / 2 - (box.y + box.height / 2 + ty))).toBeLessThan(2)
}
