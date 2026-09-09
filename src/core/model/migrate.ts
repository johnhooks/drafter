import { rewriteNames } from '../expr/rewrite'
import { DEFAULT_VIEW } from './types'

/** Version 3 stored rectangles and extrudes of rectangle ids; version 4 stores lines and extrudes of regions. */
export function migrateV3(raw: Record<string, unknown>): Record<string, unknown> {
  const model = raw['model'] as Record<string, unknown> | undefined
  if (!model || !Array.isArray(model['features'])) return { ...raw, version: 4 }
  const features = model['features'] as Array<Record<string, unknown>>
  // per sketch: rectangle id -> its four line ids and handles, so extrudes and face refs can be rewritten
  interface RectLines {
    readonly ids: [string, string, string, string]
    readonly handles: [string, string, string, string]
  }
  const rectsBySketch = new Map<string, Map<string, RectLines>>()
  const rectHandleBySketch = new Map<string, Map<string, RectLines>>()
  const out = features.map((f) => {
    if (f['kind'] !== 'sketch') return f
    const rects = Array.isArray(f['rects']) ? (f['rects'] as Array<Record<string, unknown>>) : []
    const byId = new Map<string, RectLines>()
    const byHandle = new Map<string, RectLines>()
    const lines: Array<Record<string, unknown>> = []
    const regionLabels: Record<string, unknown> = {}
    let n = 0
    for (const r of rects) {
      const id = String(r['id'])
      const ids: [string, string, string, string] = [`${id}_l`, `${id}_b`, `${id}_r`, `${id}_t`]
      const handles: [string, string, string, string] = [`l${n + 1}`, `l${n + 2}`, `l${n + 3}`, `l${n + 4}`]
      n += 4
      const entry: RectLines = { ids, handles }
      byId.set(id, entry)
      byHandle.set(String(r['handle']), entry)
      const u = (r['u'] ?? {}) as Record<string, unknown>
      const v = (r['v'] ?? {}) as Record<string, unknown>
      const layout = (r['layout'] ?? {}) as Record<string, Record<string, unknown> | undefined>
      const [uMin, uMax] = positions(u, handles[0], handles[2])
      const [vMin, vMax] = positions(v, handles[1], handles[3])
      const [left, bottom, right, top] = handles
      const withLayout = (line: Record<string, unknown>, at: unknown) => (at !== undefined ? { ...line, layout: { at } } : line)
      lines.push(
        withLayout({ id: ids[0], handle: left, dir: 'v', at: uMin, run: { min: `${bottom}.at`, max: `${top}.at` } }, layout['u']?.['min']),
        withLayout({ id: ids[1], handle: bottom, dir: 'h', at: vMin, run: { min: `${left}.at`, max: `${right}.at` } }, layout['v']?.['min']),
        withLayout({ id: ids[2], handle: right, dir: 'v', at: uMax, run: { min: `${bottom}.at`, max: `${top}.at` } }, layout['u']?.['max']),
        withLayout({ id: ids[3], handle: top, dir: 'h', at: vMax, run: { min: `${left}.at`, max: `${right}.at` } }, layout['v']?.['max']),
      )
      const label: Record<string, unknown> = {}
      if (layout['u']?.['size']) label['width'] = layout['u']['size']
      if (layout['v']?.['size']) label['height'] = layout['v']['size']
      if (Object.keys(label).length) regionLabels[`${ids[0]}|${ids[1]}`] = label
    }
    rectsBySketch.set(String(f['id']), byId)
    rectHandleBySketch.set(String(f['id']), byHandle)
    const { rects: _rects, ...rest } = f
    const sketch: Record<string, unknown> = { ...rest, lines }
    if (Object.keys(regionLabels).length) sketch['regionLabels'] = regionLabels
    return sketch
  })
  // rewrite r{k}.prop inside every expression of each sketch's lines
  const rewritten = out.map((f) => {
    if (f['kind'] !== 'sketch') return f
    const byHandle = rectHandleBySketch.get(String(f['id']))!
    const fix = (v: unknown): unknown => (typeof v === 'string' ? rewriteNames(v, (path) => rectPropToLine(path, byHandle)) : v)
    const lines = (f['lines'] as Array<Record<string, unknown>>).map((l) => {
      const run = l['run'] as Record<string, unknown>
      return { ...l, at: fix(l['at']), run: Object.fromEntries(Object.entries(run).map(([k, v]) => [k, fix(v)])) }
    })
    return { ...f, lines }
  })
  // extrudes reference the region at each rectangle's lower-left corner; face refs name the region and a face
  const sketchOfExtrude = new Map<string, string>()
  const final = rewritten.map((f) => {
    if (f['kind'] === 'extrude') {
      sketchOfExtrude.set(String(f['id']), String(f['sketchId']))
      const byId = rectsBySketch.get(String(f['sketchId']))
      const rectIds = Array.isArray(f['rectIds']) ? (f['rectIds'] as unknown[]) : []
      const regions = rectIds.map((rid) => {
        const e = byId?.get(String(rid))
        return e ? { vertical: e.ids[0], horizontal: e.ids[1] } : { vertical: String(rid), horizontal: String(rid) }
      })
      const { rectIds: _r, ...rest } = f
      return { ...rest, regions }
    }
    const plane = f['plane'] as Record<string, unknown> | undefined
    if (!plane || plane['kind'] !== 'face') return f
    const featureId = String(plane['featureId'])
    const sketchId = sketchOfExtrude.get(featureId)
    const byId = sketchId ? rectsBySketch.get(sketchId) : undefined
    const extrude = features.find((x) => x['id'] === featureId)
    const firstRect = extrude && Array.isArray(extrude['rectIds']) ? (extrude['rectIds'] as unknown[])[0] : undefined
    const rectId = plane['rectId'] !== undefined ? String(plane['rectId']) : firstRect !== undefined ? String(firstRect) : undefined
    const e = rectId !== undefined ? byId?.get(rectId) : undefined
    if (!e) return f
    const region = { vertical: e.ids[0], horizontal: e.ids[1] }
    const face = plane['face']
    const side = (index: 0 | 1 | 2 | 3, outward: 1 | -1) => ({ kind: 'face', featureId, region, face: 'side', lineId: e.ids[index], outward })
    const next =
      face === 'cap' || face === 'base'
        ? { kind: 'face', featureId, region, face }
        : face === 'uMin'
          ? side(0, -1)
          : face === 'uMax'
            ? side(2, 1)
            : face === 'vMin'
              ? side(1, -1)
              : side(3, 1)
    return { ...f, plane: next }
  })
  return { ...raw, version: 4, model: { ...model, features: final } }
}

/** The two positions of a rectangle axis: driven min and max, or one of them and a size expressed as an offset from the other. */
function positions(axis: Record<string, unknown>, nearHandle: string, farHandle: string): [unknown, unknown] {
  const min = axis['min']
  const max = axis['max']
  const size = axis['size']
  if (min !== undefined && max !== undefined) return [min, max]
  if (min !== undefined) return [min, `${nearHandle}.at + ${literal(size)}`]
  return [`${farHandle}.at - ${literal(size)}`, max]
}

/** A stored size as expression text: numbers become inch literals, expressions are parenthesised. */
function literal(v: unknown): string {
  if (typeof v === 'number') return sixteenthsLiteral(v)
  return `(${String(v)})`
}

function sixteenthsLiteral(sx: number): string {
  const whole = Math.floor(Math.abs(sx) / 16)
  const rem = Math.abs(sx) % 16
  const sign = sx < 0 ? '-' : ''
  if (rem === 0) return `${sign}${whole}`
  let num = rem
  let den = 16
  while (num % 2 === 0) {
    num /= 2
    den /= 2
  }
  return whole ? `${sign}${whole} ${num}/${den}` : `${sign}${num}/${den}`
}

function rectPropToLine(path: readonly string[], byHandle: Map<string, { handles: [string, string, string, string] }>): string | undefined {
  if (path.length !== 2) return undefined
  const e = byHandle.get(path[0]!)
  if (!e) return undefined
  const [left, bottom, right, top] = e.handles
  switch (path[1]) {
    case 'left':
      return `${left}.at`
    case 'right':
      return `${right}.at`
    case 'bottom':
      return `${bottom}.at`
    case 'top':
      return `${top}.at`
    case 'width':
      return `(${right}.at - ${left}.at)`
    case 'height':
      return `(${top}.at - ${bottom}.at)`
    case 'umid':
      return `(${left}.at + (${right}.at - ${left}.at) / 2)`
    case 'vmid':
      return `(${bottom}.at + (${top}.at - ${bottom}.at) / 2)`
    default:
      return undefined
  }
}

/** Version 2 was a bare model with a version field; version 3 wraps it beside a view. */
export function migrateV2(raw: Record<string, unknown>): Record<string, unknown> {
  const { version: _v, ...model } = raw
  return { version: 3, model, view: DEFAULT_VIEW }
}

/** Version 1 stored rectangles as two corners and had no parameters or handles. Produces version 2. */
export function migrateV1(raw: Record<string, unknown>): Record<string, unknown> {
  const features = Array.isArray(raw['features']) ? (raw['features'] as Array<Record<string, unknown>>) : []
  let sketchN = 0
  const out = features.map((f) => {
    if (f['kind'] !== 'sketch') return f
    sketchN += 1
    const rects = Array.isArray(f['rects']) ? (f['rects'] as Array<Record<string, unknown>>) : []
    return {
      ...f,
      handle: `s${sketchN}`,
      rects: rects.map((r, i) => ({
        id: r['id'],
        handle: `r${i + 1}`,
        u: { min: Math.min(num(r['u1']), num(r['u2'])), max: Math.max(num(r['u1']), num(r['u2'])) },
        v: { min: Math.min(num(r['v1']), num(r['v2'])), max: Math.max(num(r['v1']), num(r['v2'])) },
      })),
    }
  })
  return { ...raw, version: 2, params: [], features: out }
}

function num(v: unknown): number {
  return typeof v === 'number' ? v : Number.NaN
}
