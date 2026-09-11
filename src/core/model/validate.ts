import { parse } from '../expr/parser'
import { IDENT_RE, RESERVED } from './params'
import type { Feature } from './types'

export interface ValidationError {
  readonly path: string
  readonly message: string
}

const OPS = new Set(['new', 'join', 'cut'])
const PLANES = new Set(['XZ', 'XY', 'YZ'])
const LINE_SLOTS = ['at', 'min', 'max', 'size'] as const

const isInt = (n: unknown): n is number => typeof n === 'number' && Number.isInteger(n)

type Err = (path: string, message: string) => void

/** A length slot is a whole number of sixteenths or a parsable expression. */
function checkLen(v: unknown, path: string, err: Err, opts: { nonZero?: boolean } = {}) {
  if (isInt(v)) {
    if (opts.nonZero && v === 0) err(path, 'Must not be zero')
    return
  }
  if (typeof v === 'string') {
    try {
      parse(v)
    } catch (e) {
      err(path, `Bad expression: ${(e as Error).message}`)
    }
    return
  }
  err(path, 'Must be whole sixteenths or an expression')
}

function checkLayout(d: unknown, path: string, err: Err) {
  const l = d as Record<string, unknown>
  if (typeof l !== 'object' || l === null) return err(path, 'Placement must be an object')
  if (!isInt(l['offset'])) err(`${path}.offset`, 'Offset must be whole sixteenths')
  if (l['label'] !== undefined && (typeof l['label'] !== 'number' || l['label'] < -0.5 || l['label'] > 1.5)) err(`${path}.label`, 'Label must be a fraction between -0.5 and 1.5')
}

/** Structural validation of a version 5 file: a model and a view. */
export function validateFile(file: unknown): ValidationError[] {
  if (typeof file !== 'object' || file === null) return [{ path: '', message: 'File must be an object' }]
  const f = file as Record<string, unknown>
  const errors: ValidationError[] = []
  const err: Err = (path, message) => errors.push({ path, message })
  if (f['version'] !== 5) err('version', 'Unsupported file version')
  errors.push(...validateDocument(f['model']).map((e) => ({ ...e, path: `model.${e.path}`.replace(/\.$/, '') })))
  const v = f['view'] as Record<string, unknown> | undefined
  if (typeof v !== 'object' || v === null) err('view', 'View must be an object')
  else {
    const c = v['camera'] as Record<string, unknown> | undefined
    if (typeof c !== 'object' || c === null) err('view.camera', 'Camera must be an object')
    else {
      for (const k of ['azimuth', 'elevation', 'zoom']) if (typeof c[k] !== 'number' || !Number.isFinite(c[k])) err(`view.camera.${k}`, 'Must be a number')
      if (typeof c['zoom'] === 'number' && c['zoom'] <= 0) err('view.camera.zoom', 'Zoom must be positive')
      const ctr = c['center']
      if (!Array.isArray(ctr) || ctr.length !== 3 || !ctr.every(isInt)) err('view.camera.center', 'Centre must be three whole sixteenths')
    }
    if (v['sketchId'] !== undefined && typeof v['sketchId'] !== 'string') err('view.sketchId', 'Sketch id must be a string')
  }
  return errors
}

/** Structural validation of a model, including one that came from untrusted JSON. */
export function validateDocument(doc: unknown): ValidationError[] {
  const errors: ValidationError[] = []
  const err: Err = (path, message) => errors.push({ path, message })
  if (typeof doc !== 'object' || doc === null) return [{ path: '', message: 'Model must be an object' }]
  const d = doc as Record<string, unknown>
  if (typeof d['title'] !== 'string') err('title', 'Title must be a string')
  if (!Array.isArray(d['params'])) err('params', 'Params must be a list')
  else {
    const names = new Set<string>()
    ;(d['params'] as unknown[]).forEach((raw, i) => {
      const p = raw as Record<string, unknown>
      const path = `params[${i}]`
      if (typeof p?.['name'] !== 'string' || !IDENT_RE.test(p['name'])) return err(`${path}.name`, 'Parameter name must be an identifier')
      if (RESERVED.has(p['name'])) err(`${path}.name`, `${p['name']} is reserved`)
      if (names.has(p['name'])) err(`${path}.name`, `Duplicate parameter ${p['name']}`)
      names.add(p['name'])
      checkLen(p['value'], `${path}.value`, err)
    })
  }
  if (!Array.isArray(d['features'])) {
    err('features', 'Features must be a list')
    return errors
  }
  const features = d['features'] as unknown[]
  const seen = new Map<string, number>()
  const sketchHandles = new Set<string>()
  features.forEach((raw, i) => {
    const p = `features[${i}]`
    if (typeof raw !== 'object' || raw === null) return err(p, 'Feature must be an object')
    const f = raw as Record<string, unknown>
    if (typeof f['id'] !== 'string' || f['id'] === '') return err(`${p}.id`, 'Feature needs an id')
    const id = f['id']
    if (seen.has(id)) err(`${p}.id`, `Duplicate id ${id}`)
    seen.set(id, i)
    if (typeof f['name'] !== 'string') err(`${p}.name`, 'Feature needs a name')
    if (f['kind'] === 'sketch') validateSketch(f, p, features, seen, sketchHandles, err)
    else if (f['kind'] === 'extrude') validateExtrude(f, i, p, features, seen, err)
    else err(`${p}.kind`, 'Unknown feature kind')
  })
  return errors
}

/** Lines of a sketch by id with their direction, for checking references into it. */
function lineDirs(sketch: Record<string, unknown> | undefined): Map<string, string> | undefined {
  if (!sketch || !Array.isArray(sketch['lines'])) return undefined
  const out = new Map<string, string>()
  for (const raw of sketch['lines'] as unknown[]) {
    const l = raw as Record<string, unknown>
    if (typeof l?.['id'] === 'string') out.set(l['id'], String(l['dir']))
  }
  return out
}

function checkRegionRef(ref: unknown, path: string, dirs: Map<string, string> | undefined, err: Err) {
  const r = ref as Record<string, unknown>
  if (typeof r !== 'object' || r === null) return err(path, 'Region must name its two corner lines')
  for (const [k, want] of [
    ['vertical', 'v'],
    ['horizontal', 'h'],
  ] as const) {
    const id = r[k]
    if (typeof id !== 'string') return err(`${path}.${k}`, 'Must be a line id')
    if (!dirs) continue
    const dir = dirs.get(id)
    if (dir === undefined) err(`${path}.${k}`, `Line ${id} is not in the sketch`)
    else if (dir !== want) err(`${path}.${k}`, `Line ${id} is not ${want === 'v' ? 'vertical' : 'horizontal'}`)
  }
}

function validateSketch(f: Record<string, unknown>, p: string, features: unknown[], seen: Map<string, number>, handles: Set<string>, err: Err) {
  if (typeof f['handle'] !== 'string' || !IDENT_RE.test(f['handle'])) err(`${p}.handle`, 'Sketch needs a handle')
  else if (handles.has(f['handle'])) err(`${p}.handle`, `Duplicate sketch handle ${f['handle']}`)
  else handles.add(f['handle'])
  const plane = f['plane'] as Record<string, unknown> | undefined
  if (!plane || typeof plane !== 'object') err(`${p}.plane`, 'Sketch needs a plane')
  else if (plane['kind'] === 'principal') {
    if (!PLANES.has(plane['plane'] as string)) err(`${p}.plane.plane`, 'Plane must be XZ, XY, or YZ')
    checkLen(plane['offset'], `${p}.plane.offset`, err)
    if (plane['normal'] !== 1 && plane['normal'] !== -1) err(`${p}.plane.normal`, 'Normal must be 1 or -1')
  } else if (plane['kind'] === 'face') {
    const ref = plane['featureId']
    const j = typeof ref === 'string' ? seen.get(ref) : undefined
    let extrude: Record<string, unknown> | undefined
    if (j === undefined) err(`${p}.plane.featureId`, `References unknown or later feature ${String(ref)}`)
    else {
      extrude = features[j] as Record<string, unknown>
      if (extrude['kind'] !== 'extrude') {
        err(`${p}.plane.featureId`, 'Face reference must point at an extrude')
        extrude = undefined
      }
    }
    const sketchIdx = extrude && typeof extrude['sketchId'] === 'string' ? seen.get(extrude['sketchId']) : undefined
    const dirs = lineDirs(sketchIdx !== undefined ? (features[sketchIdx] as Record<string, unknown>) : undefined)
    checkRegionRef(plane['region'], `${p}.plane.region`, dirs, err)
    if (plane['face'] === 'side') {
      if (typeof plane['lineId'] !== 'string') err(`${p}.plane.lineId`, 'Side face needs its bounding line')
      else if (dirs && !dirs.has(plane['lineId'])) err(`${p}.plane.lineId`, `Line ${plane['lineId']} is not in the sketch`)
      if (plane['outward'] !== 1 && plane['outward'] !== -1) err(`${p}.plane.outward`, 'Outward must be 1 or -1')
    } else if (plane['face'] !== 'cap' && plane['face'] !== 'base') err(`${p}.plane.face`, 'Face must be cap, base, or side')
  } else err(`${p}.plane.kind`, 'Plane must be principal or face')
  if (!Array.isArray(f['lines'])) return err(`${p}.lines`, 'Lines must be a list')
  const lineIds = new Set<string>()
  const lineHandles = new Set<string>()
  ;(f['lines'] as unknown[]).forEach((raw, k) => {
    const lp = `${p}.lines[${k}]`
    const l = raw as Record<string, unknown>
    if (typeof l?.['id'] !== 'string') return err(lp, 'Line needs an id')
    if (lineIds.has(l['id'])) err(`${lp}.id`, `Duplicate line id ${l['id']}`)
    lineIds.add(l['id'])
    if (typeof l['handle'] !== 'string' || !IDENT_RE.test(l['handle'])) err(`${lp}.handle`, 'Line needs a handle')
    else if (lineHandles.has(l['handle'])) err(`${lp}.handle`, `Duplicate line handle ${l['handle']}`)
    else lineHandles.add(l['handle'])
    if (l['dir'] !== 'h' && l['dir'] !== 'v') err(`${lp}.dir`, 'Direction must be h or v')
    checkLen(l['at'], `${lp}.at`, err)
    if (l['construction'] !== undefined && typeof l['construction'] !== 'boolean') err(`${lp}.construction`, 'Construction must be true or false')
    const layout = l['layout'] as Record<string, unknown> | undefined
    if (layout !== undefined) {
      if (typeof layout !== 'object' || layout === null) err(`${lp}.layout`, 'Layout must be an object')
      else
        for (const key of Object.keys(layout)) {
          if (!(LINE_SLOTS as readonly string[]).includes(key)) err(`${lp}.layout.${key}`, 'Unknown dimension slot')
          else checkLayout(layout[key], `${lp}.layout.${key}`, err)
        }
    }
    const run = l['run'] as Record<string, unknown> | undefined
    if (!run || typeof run !== 'object') return err(`${lp}.run`, 'Run needs two driven slots')
    const present = (['min', 'max', 'size'] as const).filter((s) => run[s] !== undefined)
    if (present.length !== 2) err(`${lp}.run`, 'Run must have exactly two of min, max, size')
    for (const s of present) checkLen(run[s], `${lp}.run.${s}`, err)
    if (isInt(run['min']) && isInt(run['max']) && run['min'] === run['max']) err(lp, 'Line has zero length')
    if (isInt(run['size']) && run['size'] <= 0) err(lp, 'Line has zero length')
  })
  const lineDir = new Map<string, string>()
  for (const raw of f['lines'] as unknown[]) {
    const l = raw as Record<string, unknown>
    if (typeof l?.['id'] === 'string') lineDir.set(l['id'], String(l['dir']))
  }
  if (!Array.isArray(f['rects'])) err(`${p}.rects`, 'Rects must be a list')
  else {
    const rectHandles = new Set<string>()
    const members = new Set<string>()
    ;(f['rects'] as unknown[]).forEach((raw, k) => {
      const rp = `${p}.rects[${k}]`
      const r = raw as Record<string, unknown>
      if (typeof r?.['id'] !== 'string') return err(rp, 'Rect needs an id')
      if (typeof r['handle'] !== 'string' || !IDENT_RE.test(r['handle'])) err(`${rp}.handle`, 'Rect needs a handle')
      else if (rectHandles.has(r['handle'])) err(`${rp}.handle`, `Duplicate rect handle ${r['handle']}`)
      else rectHandles.add(r['handle'])
      const ls = r['lines']
      if (!Array.isArray(ls) || ls.length !== 4) return err(`${rp}.lines`, 'Rect needs four member lines: left, bottom, right, top')
      const want = ['v', 'h', 'v', 'h']
      const names = ['left', 'bottom', 'right', 'top']
      ls.forEach((id, i) => {
        if (typeof id !== 'string' || !lineDir.has(id)) return err(`${rp}.lines[${i}]`, `Line ${String(id)} is not in the sketch`)
        if (lineDir.get(id) !== want[i]) err(`${rp}.lines[${i}]`, `The ${names[i]} member must be ${want[i] === 'v' ? 'vertical' : 'horizontal'}`)
        if (members.has(id)) err(`${rp}.lines[${i}]`, `Line ${id} belongs to two rects`)
        members.add(id)
      })
    })
  }
  const labels = f['regionLabels'] as Record<string, unknown> | undefined
  if (labels !== undefined) {
    if (typeof labels !== 'object' || labels === null) err(`${p}.regionLabels`, 'Region labels must be an object')
    else
      for (const [key, raw] of Object.entries(labels)) {
        const parts = key.split('|')
        if (parts.length !== 2 || !lineIds.has(parts[0]!) || !lineIds.has(parts[1]!)) err(`${p}.regionLabels.${key}`, 'Key must be two line ids joined by |')
        const rl = raw as Record<string, unknown>
        if (typeof rl !== 'object' || rl === null) {
          err(`${p}.regionLabels.${key}`, 'Must be an object')
          continue
        }
        for (const axis of ['width', 'height'] as const) if (rl[axis] !== undefined) checkLayout(rl[axis], `${p}.regionLabels.${key}.${axis}`, err)
      }
  }
}

function validateExtrude(f: Record<string, unknown>, i: number, p: string, features: unknown[], seen: Map<string, number>, err: Err) {
  const sid = f['sketchId']
  const j = typeof sid === 'string' ? seen.get(sid) : undefined
  let sketch: Record<string, unknown> | undefined
  if (j === undefined || j >= i) err(`${p}.sketchId`, `References unknown or later sketch ${String(sid)}`)
  else {
    sketch = features[j] as Record<string, unknown>
    if (sketch['kind'] !== 'sketch') {
      err(`${p}.sketchId`, 'Extrude must reference a sketch')
      sketch = undefined
    }
  }
  if (!Array.isArray(f['regions']) || f['regions'].length === 0) err(`${p}.regions`, 'Extrude needs at least one region')
  else {
    const dirs = lineDirs(sketch)
    ;(f['regions'] as unknown[]).forEach((ref, k) => checkRegionRef(ref, `${p}.regions[${k}]`, dirs, err))
  }
  checkLen(f['distance'], `${p}.distance`, err, { nonZero: true })
  if (!OPS.has(f['op'] as string)) err(`${p}.op`, 'Operation must be new, join, or cut')
  // a join or cut without a target is a feature error at evaluation, not a broken file: the editor
  // saves that state while the user is still choosing, and refusing to load it would lose the document
  if (f['targetBodyId'] !== undefined && typeof f['targetBodyId'] !== 'string') err(`${p}.targetBodyId`, 'Target body must be an id')
}

export function isFeature(x: unknown): x is Feature {
  return typeof x === 'object' && x !== null && ((x as Feature).kind === 'sketch' || (x as Feature).kind === 'extrude')
}
