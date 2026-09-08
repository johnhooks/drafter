import type { Feature } from './types'

export interface ValidationError {
  readonly path: string
  readonly message: string
}

const OPS = new Set(['new', 'join', 'cut'])
const PLANES = new Set(['XZ', 'XY', 'YZ'])
const ROLES = new Set(['cap', 'base', 'uMin', 'uMax', 'vMin', 'vMax'])

const isInt = (n: unknown): n is number => typeof n === 'number' && Number.isInteger(n)

/** Structural validation of a document, including one that came from untrusted JSON. */
export function validateDocument(doc: unknown): ValidationError[] {
  const errors: ValidationError[] = []
  const err = (path: string, message: string) => errors.push({ path, message })
  if (typeof doc !== 'object' || doc === null) return [{ path: '', message: 'Document must be an object' }]
  const d = doc as Record<string, unknown>
  if (d['version'] !== 1) err('version', 'Unsupported document version')
  if (typeof d['title'] !== 'string') err('title', 'Title must be a string')
  if (!Array.isArray(d['features'])) {
    err('features', 'Features must be a list')
    return errors
  }
  const features = d['features'] as unknown[]
  const seen = new Map<string, number>()
  features.forEach((raw, i) => {
    const p = `features[${i}]`
    if (typeof raw !== 'object' || raw === null) return err(p, 'Feature must be an object')
    const f = raw as Record<string, unknown>
    if (typeof f['id'] !== 'string' || f['id'] === '') return err(`${p}.id`, 'Feature needs an id')
    const id = f['id']
    if (seen.has(id)) err(`${p}.id`, `Duplicate id ${id}`)
    seen.set(id, i)
    if (typeof f['name'] !== 'string') err(`${p}.name`, 'Feature needs a name')
    if (f['kind'] === 'sketch') validateSketch(f, i, p, features, seen, err)
    else if (f['kind'] === 'extrude') validateExtrude(f, i, p, features, seen, err)
    else err(`${p}.kind`, 'Unknown feature kind')
  })
  return errors
}

type Err = (path: string, message: string) => void

function validateSketch(f: Record<string, unknown>, i: number, p: string, features: unknown[], seen: Map<string, number>, err: Err) {
  const plane = f['plane'] as Record<string, unknown> | undefined
  if (!plane || typeof plane !== 'object') err(`${p}.plane`, 'Sketch needs a plane')
  else if (plane['kind'] === 'principal') {
    if (!PLANES.has(plane['plane'] as string)) err(`${p}.plane.plane`, 'Plane must be XZ, XY, or YZ')
    if (!isInt(plane['offset'])) err(`${p}.plane.offset`, 'Offset must be whole sixteenths')
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
  ;(f['rects'] as unknown[]).forEach((raw, k) => {
    const rp = `${p}.rects[${k}]`
    const r = raw as Record<string, unknown>
    if (typeof r?.['id'] !== 'string') return err(rp, 'Rect needs an id')
    if (rectIds.has(r['id'])) err(`${rp}.id`, `Duplicate rect id ${r['id']}`)
    rectIds.add(r['id'])
    for (const k2 of ['u1', 'v1', 'u2', 'v2']) if (!isInt(r[k2])) err(`${rp}.${k2}`, 'Corner must be whole sixteenths')
    if (r['u1'] === r['u2']) err(`${rp}`, 'Rect has zero width')
    if (r['v1'] === r['v2']) err(`${rp}`, 'Rect has zero height')
  })
  void i
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
  if (!isInt(f['distance']) || f['distance'] === 0) err(`${p}.distance`, 'Distance must be a non-zero whole number of sixteenths')
  if (!OPS.has(f['op'] as string)) err(`${p}.op`, 'Operation must be new, join, or cut')
  else if (f['op'] !== 'new') {
    const t = f['targetBodyId']
    if (typeof t !== 'string') err(`${p}.targetBodyId`, 'Join and cut need a target body')
  }
}

export function isFeature(x: unknown): x is Feature {
  return typeof x === 'object' && x !== null && ((x as Feature).kind === 'sketch' || (x as Feature).kind === 'extrude')
}
