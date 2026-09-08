import { type Page, expect } from '@playwright/test'

export interface Debug {
  mode: { kind: string; sketchId?: string }
  tool: string
  selection: { featureId?: string; bodyId?: string; rectIds: string[]; constraint?: unknown }
  features: Array<Record<string, any>>
  errors: Array<{ featureId: string; message: string }>
  bodies: Array<{ id: string; volume: number; bounds: Record<string, number> }>
  notices: string[]
  params: Array<{ name: string; value: unknown }>
  history: { past: number; future: number }
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

/** Draw a rect in the current sketch by plane inches. */
export async function drawInches(page: Page, view: View, a: [number, number], b: [number, number]) {
  await dragSvg(page, px(view, a[0], a[1]), px(view, b[0], b[1]))
}

/** The view a face sketch opens with: framed on its face at 70% of the viewport. */
export async function faceView(page: Page, face: { u0: number; u1: number; v0: number; v1: number }, su: 1 | -1 = 1): Promise<View> {
  const box = (await page.locator('.sketch svg').boundingBox())!
  const w = face.u1 - face.u0
  const h = face.v1 - face.v0
  return { cu: (face.u0 + face.u1) / 2, cv: (face.v0 + face.v1) / 2, scale: Math.min((box.width * 0.7) / w, (box.height * 0.7) / h), su }
}

/** Screen position of a model point in the isometric view at zoom 6, camera at (200,-200,200) looking at the origin. */
export async function isoPoint(page: Page, x: number, y: number, z: number): Promise<[number, number]> {
  // the canvas starts at its default 300x150 until r3f's resize observer runs
  await expect.poll(async () => (await page.locator('.centre canvas').boundingBox())?.width ?? 0).toBeGreaterThan(400)
  const cb = (await page.locator('.centre canvas').boundingBox())!
  const sx = (x + y) / Math.SQRT2
  const sy = z * Math.sqrt(2 / 3) - (x - y) / Math.sqrt(6)
  return [cb.x + cb.width / 2 + sx * 6, cb.y + cb.height / 2 - sy * 6]
}

/** Builds the 24" cube from the front plane and returns to model mode. */
export async function makeCube(page: Page) {
  await page.click('text=New sketch')
  await page.click('.dropdown >> text=Create')
  await drawInches(page, { cu: 12, cv: 12, scale: 12, su: 1 }, [0, 0], [24, 24])
  await page.click('button:has-text("Extrude")')
  const dist = page.locator('.panel.right label.field:has(span:has-text("Distance")) input')
  await dist.fill('24')
  await dist.press('Enter')
}

export function field(page: Page, label: string) {
  return page.locator(`.panel.right label.field:has(span:has-text("${label}")) input`)
}
