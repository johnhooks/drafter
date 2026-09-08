import { parse } from '../expr/parser'
import { IDENT_RE, RESERVED } from './params'
import type { Feature } from './types'

export interface ValidationError {
  readonly path: string
  readonly message: string
}

const OPS = new Set(['new', 'join', 'cut'])
const PLANES = new Set(['XZ', 'XY', 'YZ'])
const ROLES = new Set(['cap', 'base', 'uMin', 'uMax', 'vMin', 'vMax'])

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

/** Structural validation of a version 2 document, including one that came from untrusted JSON. */
export function validateDocument(doc: unknown): ValidationError[] {
  const errors: ValidationError[] = []
  const err: Err = (path, message) => errors.push({ path, message })
  if (typeof doc !== 'object' || doc === null) return [{ path: '', message: 'Document must be an object' }]
  const d = doc as Record<string, unknown>
  if (d['version'] !== 2) err('version', 'Unsupported document version')
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
    if (j === undefined) err(`${p}.plane.featureId`, `References unknown or later feature ${String(ref)}`)
    else if ((features[j] as Record<string, unknown>)['kind'] !== 'extrude') err(`${p}.plane.featureId`, 'Face reference must point at an extrude')
    if (!ROLES.has(plane['face'] as string)) err(`${p}.plane.face`, 'Unknown face role')
  } else err(`${p}.plane.kind`, 'Plane must be principal or face')
  if (!Array.isArray(f['rects'])) return err(`${p}.rects`, 'Rects must be a list')
  const rectIds = new Set<string>()
  const rectHandles = new Set<string>()
  ;(f['rects'] as unknown[]).forEach((raw, k) => {
    const rp = `${p}.rects[${k}]`
    const r = raw as Record<string, unknown>
    if (typeof r?.['id'] !== 'string') return err(rp, 'Rect needs an id')
    if (rectIds.has(r['id'])) err(`${rp}.id`, `Duplicate rect id ${r['id']}`)
    rectIds.add(r['id'])
    if (typeof r['handle'] !== 'string' || !IDENT_RE.test(r['handle'])) err(`${rp}.handle`, 'Rect needs a handle')
    else if (rectHandles.has(r['handle'])) err(`${rp}.handle`, `Duplicate rect handle ${r['handle']}`)
    else rectHandles.add(r['handle'])
    const layout = r['layout'] as Record<string, unknown> | undefined
    if (layout !== undefined) {
      if (typeof layout !== 'object' || layout === null) err(`${rp}.layout`, 'Layout must be an object')
      else
        for (const axis of ['u', 'v'] as const) {
          const al = layout[axis] as Record<string, unknown> | undefined
          if (al === undefined) continue
          for (const s of ['min', 'max', 'size'] as const) {
            const d = al[s] as Record<string, unknown> | undefined
            if (d === undefined) continue
            if (!isInt(d['offset'])) err(`${rp}.layout.${axis}.${s}.offset`, 'Offset must be whole sixteenths')
            if (d['label'] !== undefined && (typeof d['label'] !== 'number' || d['label'] < -0.5 || d['label'] > 1.5))
              err(`${rp}.layout.${axis}.${s}.label`, 'Label must be a fraction between -0.5 and 1.5')
          }
        }
    }
    for (const axis of ['u', 'v'] as const) {
      const a = r[axis] as Record<string, unknown> | undefined
      if (!a || typeof a !== 'object') {
        err(`${rp}.${axis}`, 'Axis needs two driven slots')
        continue
      }
      const present = (['min', 'max', 'size'] as const).filter((s) => a[s] !== undefined)
      if (present.length !== 2) err(`${rp}.${axis}`, 'Axis must have exactly two of min, max, size')
      for (const s of present) checkLen(a[s], `${rp}.${axis}.${s}`, err)
      if (isInt(a['min']) && isInt(a['max']) && a['min'] === a['max']) err(rp, `Rect has zero ${axis === 'u' ? 'width' : 'height'}`)
      if (isInt(a['size']) && a['size'] <= 0) err(rp, `Rect has zero ${axis === 'u' ? 'width' : 'height'}`)
    }
  })
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
  if (!Array.isArray(f['rectIds']) || f['rectIds'].length === 0) err(`${p}.rectIds`, 'Extrude needs at least one rect')
  else if (sketch && Array.isArray(sketch['rects'])) {
    const ids = new Set((sketch['rects'] as Array<Record<string, unknown>>).map((r) => r['id']))
    for (const rid of f['rectIds'] as unknown[]) if (!ids.has(rid)) err(`${p}.rectIds`, `Rect ${String(rid)} is not in the sketch`)
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
