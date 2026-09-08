import { type RectProps, type Scope, type Value, evaluateExpr, rectProps } from '../expr/evaluate'
import { parse, references } from '../expr/parser'
import type { Rect2 } from '../geom/rect2d'
import { FRAMES } from '../model/planes'
import { type ResolvedAxis, deriveAxis } from '../model/slots'
import type { AxisSlots, Len, ResolvedPlane, SketchFeature, SketchRect, Slot } from '../model/types'
import { isExpr } from '../model/types'

export interface ResolvedRect extends Rect2 {
  readonly id: string
  readonly handle: string
  readonly uAxis: ResolvedAxis
  readonly vAxis: ResolvedAxis
}

export interface SketchResolution {
  readonly rects: Map<string, ResolvedRect>
  readonly errors: Map<string, string>
  /** Per rectangle and slot, the evaluated value of each driven slot, for display beside expressions. */
  readonly slotValues: Map<string, { u: Partial<Record<Slot, number>>; v: Partial<Record<Slot, number>> }>
}

export interface SketchScopeInput {
  readonly params: ReadonlyMap<string, Value>
  readonly face?: Rect2
  readonly noFaceReason?: string
}

/** Resolves every rectangle in dependency order; failures are isolated per rectangle. */
export function resolveSketch(sketch: SketchFeature, plane: ResolvedPlane, input: SketchScopeInput): SketchResolution {
  const frame = FRAMES[plane.plane]
  const rects = new Map<string, ResolvedRect>()
  const errors = new Map<string, string>()
  const slotValues: SketchResolution['slotValues'] = new Map()
  const byHandle = new Map(sketch.rects.map((r) => [r.handle, r]))
  const scopeRects = new Map<string, RectProps>()
  const faceProps = input.face ? rectProps(input.face, frame.u, frame.v) : undefined
  const scope: Scope = { params: input.params, rects: scopeRects, face: faceProps, noFaceReason: input.noFaceReason }

  // dependency graph between rectangles of this sketch
  const deps = new Map<string, Set<string>>()
  const parseErrors = new Map<string, string>()
  for (const r of sketch.rects) {
    const d = new Set<string>()
    for (const v of slotExprs(r)) {
      try {
        for (const ref of references(parse(v))) {
          if (ref.length === 2 && byHandle.has(ref[0]!) && ref[0] !== r.handle) d.add(ref[0]!)
          else if (ref.length === 2 && ref[0] === r.handle) parseErrors.set(r.id, `${r.handle} cannot reference itself`)
        }
      } catch (e) {
        parseErrors.set(r.id, `Bad expression "${v}": ${(e as Error).message}`)
      }
    }
    deps.set(r.handle, d)
  }

  // Kahn's algorithm over handles; whatever never reaches zero in-degree is on or behind a cycle
  const remaining = new Map<string, Set<string>>([...deps].map(([h, d]) => [h, new Set(d)]))
  const order: string[] = []
  let progress = true
  while (progress) {
    progress = false
    for (const [h, d] of remaining) {
      if (d.size === 0) {
        order.push(h)
        remaining.delete(h)
        for (const other of remaining.values()) other.delete(h)
        progress = true
      }
    }
  }
  const cyclic = [...remaining.keys()]
  for (const h of cyclic) errors.set(byHandle.get(h)!.id, `Circular reference between ${cyclic.join(', ')}`)

  for (const h of order) {
    const r = byHandle.get(h)!
    const pe = parseErrors.get(r.id)
    if (pe) {
      errors.set(r.id, pe)
      continue
    }
    const failedDep = [...deps.get(h)!].find((d) => errors.has(byHandle.get(d)!.id))
    if (failedDep) {
      errors.set(r.id, `${failedDep} failed`)
      continue
    }
    try {
      const uv = resolveAxis(r.u, frame.u, scope, 'u')
      const vv = resolveAxis(r.v, frame.v, scope, 'v')
      if (uv.axis.size <= 0) throw new Error(`Width must be greater than zero (got ${uv.axis.size / 16}")`)
      if (vv.axis.size <= 0) throw new Error(`Height must be greater than zero (got ${vv.axis.size / 16}")`)
      const resolved: ResolvedRect = {
        id: r.id,
        handle: r.handle,
        u0: uv.axis.min,
        u1: uv.axis.max,
        v0: vv.axis.min,
        v1: vv.axis.max,
        uAxis: uv.axis,
        vAxis: vv.axis,
      }
      rects.set(r.id, resolved)
      slotValues.set(r.id, { u: uv.values, v: vv.values })
      scopeRects.set(r.handle, rectProps(resolved, frame.u, frame.v))
    } catch (e) {
      errors.set(r.id, e instanceof Error ? e.message : String(e))
    }
  }
  return { rects, errors, slotValues }
}

function slotExprs(r: SketchRect): string[] {
  return [r.u.min, r.u.max, r.u.size, r.v.min, r.v.max, r.v.size].filter((x): x is string => typeof x === 'string')
}

function resolveAxis(a: AxisSlots, axis: 'x' | 'y' | 'z', scope: Scope, label: 'u' | 'v') {
  const values: Partial<Record<Slot, number>> = {}
  const get = (slot: Slot): number | undefined => {
    const v: Len | undefined = a[slot]
    if (v === undefined) return undefined
    if (!isExpr(v)) {
      values[slot] = v
      return v
    }
    const out = evaluateExpr(v, scope)
    if (slot === 'size') {
      if (out.kind !== 'length') throw new Error(`${label} size "${v}" is a position; a size must be a length`)
    } else if (out.kind === 'position' && out.axis !== axis) {
      throw new Error(`${label} ${slot} "${v}" is a ${out.axis.toUpperCase()} position, but this slot is on the ${axis.toUpperCase()} axis`)
    }
    values[slot] = out.value
    return out.value
  }
  return { axis: deriveAxis(get('min'), get('max'), get('size')), values }
}
