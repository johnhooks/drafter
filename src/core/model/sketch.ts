import type { Rect2 } from '../geom/rect2d'
import type { Sixteenths } from '../units'
import type { SketchRect } from './types'

/** A rectangle from two corners as plain numbers, the shape the rectangle tool produces. */
export function rectFromCorners(id: string, handle: string, u1: number, v1: number, u2: number, v2: number): SketchRect {
  return {
    id,
    handle,
    u: { min: Math.min(u1, u2) as Sixteenths, max: Math.max(u1, u2) as Sixteenths },
    v: { min: Math.min(v1, v2) as Sixteenths, max: Math.max(v1, v2) as Sixteenths },
  }
}

/** True when every driven slot is a plain number, so the rectangle can be read without evaluation. */
export function isPlainRect(r: SketchRect): boolean {
  return [r.u.min, r.u.max, r.u.size, r.v.min, r.v.max, r.v.size].every((x) => x === undefined || typeof x === 'number')
}

/** Resolves a plain rectangle without a scope. Throws for expressions; use resolveSketch for those. */
export function plainRect(r: SketchRect): Rect2 {
  if (!isPlainRect(r)) throw new Error(`${r.handle} has expressions and needs a scope`)
  const axis = (a: SketchRect['u']) => {
    const min = a.min as number | undefined
    const max = a.max as number | undefined
    const size = a.size as number | undefined
    if (min !== undefined && max !== undefined) return [min, max]
    if (min !== undefined && size !== undefined) return [min, min + size]
    return [(max as number) - (size as number), max as number]
  }
  const [u0, u1] = axis(r.u)
  const [v0, v1] = axis(r.v)
  return { u0: u0!, u1: u1!, v0: v0!, v1: v1! }
}
