import type { Sixteenths } from '../units'

/** Axis-aligned box in model space, bounds in sixteenths, min exclusive of max. */
export interface Box {
  readonly x0: Sixteenths
  readonly x1: Sixteenths
  readonly y0: Sixteenths
  readonly y1: Sixteenths
  readonly z0: Sixteenths
  readonly z1: Sixteenths
}

export type Axis = 'x' | 'y' | 'z'
export const AXES: readonly Axis[] = ['x', 'y', 'z']

export function box(x0: number, x1: number, y0: number, y1: number, z0: number, z1: number): Box {
  return {
    x0: Math.min(x0, x1),
    x1: Math.max(x0, x1),
    y0: Math.min(y0, y1),
    y1: Math.max(y0, y1),
    z0: Math.min(z0, z1),
    z1: Math.max(z0, z1),
  } as Box
}

export function boxVolume(b: Box): number {
  return (b.x1 - b.x0) * (b.y1 - b.y0) * (b.z1 - b.z0)
}

export function boxIsEmpty(b: Box): boolean {
  return b.x1 <= b.x0 || b.y1 <= b.y0 || b.z1 <= b.z0
}

export function intersectBoxes(a: Box, b: Box): Box | null {
  const r = box(
    Math.max(a.x0, b.x0),
    Math.min(a.x1, b.x1),
    Math.max(a.y0, b.y0),
    Math.min(a.y1, b.y1),
    Math.max(a.z0, b.z0),
    Math.min(a.z1, b.z1),
  )
  // box() sorts bounds, so an empty intersection must be detected before sorting
  if (
    Math.max(a.x0, b.x0) >= Math.min(a.x1, b.x1) ||
    Math.max(a.y0, b.y0) >= Math.min(a.y1, b.y1) ||
    Math.max(a.z0, b.z0) >= Math.min(a.z1, b.z1)
  )
    return null
  return r
}

export function boxesDisjoint(a: Box, b: Box): boolean {
  return intersectBoxes(a, b) === null
}

export function boxContains(outer: Box, inner: Box): boolean {
  return (
    inner.x0 >= outer.x0 &&
    inner.x1 <= outer.x1 &&
    inner.y0 >= outer.y0 &&
    inner.y1 <= outer.y1 &&
    inner.z0 >= outer.z0 &&
    inner.z1 <= outer.z1
  )
}

export function boxesEqual(a: Box, b: Box): boolean {
  return a.x0 === b.x0 && a.x1 === b.x1 && a.y0 === b.y0 && a.y1 === b.y1 && a.z0 === b.z0 && a.z1 === b.z1
}

/** a minus b as up to six disjoint boxes. */
export function subtractBox(a: Box, b: Box): Box[] {
  const i = intersectBoxes(a, b)
  if (!i) return [a]
  const out: Box[] = []
  const push = (x0: number, x1: number, y0: number, y1: number, z0: number, z1: number) => {
    if (x1 > x0 && y1 > y0 && z1 > z0) out.push(box(x0, x1, y0, y1, z0, z1))
  }
  push(a.x0, i.x0, a.y0, a.y1, a.z0, a.z1)
  push(i.x1, a.x1, a.y0, a.y1, a.z0, a.z1)
  push(i.x0, i.x1, a.y0, i.y0, a.z0, a.z1)
  push(i.x0, i.x1, i.y1, a.y1, a.z0, a.z1)
  push(i.x0, i.x1, i.y0, i.y1, a.z0, i.z0)
  push(i.x0, i.x1, i.y0, i.y1, i.z1, a.z1)
  return out
}

export function unionBounds(boxes: readonly Box[]): Box | null {
  if (boxes.length === 0) return null
  let r = boxes[0]!
  for (const b of boxes) {
    r = box(
      Math.min(r.x0, b.x0),
      Math.max(r.x1, b.x1),
      Math.min(r.y0, b.y0),
      Math.max(r.y1, b.y1),
      Math.min(r.z0, b.z0),
      Math.max(r.z1, b.z1),
    )
  }
  return r
}
