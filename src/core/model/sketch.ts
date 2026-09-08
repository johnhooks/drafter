import type { Rect2 } from '../geom/rect2d'
import type { Sixteenths } from '../units'
import type { SketchRect } from './types'

export function normRect(r: SketchRect): Rect2 {
  return {
    u0: Math.min(r.u1, r.u2),
    u1: Math.max(r.u1, r.u2),
    v0: Math.min(r.v1, r.v2),
    v1: Math.max(r.v1, r.v2),
  }
}

export function rectWidth(r: SketchRect): Sixteenths {
  return Math.abs(r.u2 - r.u1) as Sixteenths
}

export function rectHeight(r: SketchRect): Sixteenths {
  return Math.abs(r.v2 - r.v1) as Sixteenths
}

/** Keeps the lower-left corner, moves the far corner. */
export function setRectWidth(r: SketchRect, w: Sixteenths): SketchRect {
  const n = normRect(r)
  return { ...r, u1: n.u0 as Sixteenths, u2: (n.u0 + w) as Sixteenths, v1: n.v0 as Sixteenths, v2: n.v1 as Sixteenths }
}

export function setRectHeight(r: SketchRect, h: Sixteenths): SketchRect {
  const n = normRect(r)
  return { ...r, u1: n.u0 as Sixteenths, u2: n.u1 as Sixteenths, v1: n.v0 as Sixteenths, v2: (n.v0 + h) as Sixteenths }
}

/** Moves the whole rectangle so its lower-left corner lands at (u, v). */
export function setRectLowerLeft(r: SketchRect, u: Sixteenths, v: Sixteenths): SketchRect {
  const n = normRect(r)
  return {
    ...r,
    u1: u,
    v1: v,
    u2: (u + (n.u1 - n.u0)) as Sixteenths,
    v2: (v + (n.v1 - n.v0)) as Sixteenths,
  }
}

export function rectIsValid(r: SketchRect): boolean {
  return r.u1 !== r.u2 && r.v1 !== r.v2
}
