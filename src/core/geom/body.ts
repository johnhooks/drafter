import { type Box, boxVolume, boxesEqual, subtractBox, unionBounds } from './box'

/** A solid as a set of disjoint axis-aligned boxes. */
export interface Body {
  readonly id: string
  readonly name: string
  readonly boxes: readonly Box[]
}

export function newBody(id: string, name: string, ...boxes: Box[]): Body {
  let b: Body = { id, name, boxes: [] }
  for (const x of boxes) b = join(b, x)
  return b
}

export function bodyVolume(b: Body): number {
  return b.boxes.reduce((s, x) => s + boxVolume(x), 0)
}

export function bodyBounds(b: Body): Box | null {
  return unionBounds(b.boxes)
}

export function cut(b: Body, x: Box): Body {
  return compact({ ...b, boxes: b.boxes.flatMap((y) => subtractBox(y, x)) })
}

/** Union. Subtracting first keeps the set disjoint without an overlap test. */
export function join(b: Body, x: Box): Body {
  return compact({ ...b, boxes: [...b.boxes.flatMap((y) => subtractBox(y, x)), x] })
}

/** Merges pairs of boxes that share a full face, repeatedly, so counts stay small after many cuts. */
export function compact(b: Body): Body {
  const boxes = [...b.boxes]
  let merged = true
  while (merged) {
    merged = false
    outer: for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        const m = mergeIfAdjacent(boxes[i]!, boxes[j]!)
        if (m) {
          boxes.splice(j, 1)
          boxes.splice(i, 1, m)
          merged = true
          break outer
        }
      }
    }
  }
  return { ...b, boxes }
}

function mergeIfAdjacent(a: Box, b: Box): Box | null {
  const sameY = a.y0 === b.y0 && a.y1 === b.y1
  const sameZ = a.z0 === b.z0 && a.z1 === b.z1
  const sameX = a.x0 === b.x0 && a.x1 === b.x1
  if (sameY && sameZ && (a.x1 === b.x0 || b.x1 === a.x0))
    return { ...a, x0: Math.min(a.x0, b.x0), x1: Math.max(a.x1, b.x1) } as Box
  if (sameX && sameZ && (a.y1 === b.y0 || b.y1 === a.y0))
    return { ...a, y0: Math.min(a.y0, b.y0), y1: Math.max(a.y1, b.y1) } as Box
  if (sameX && sameY && (a.z1 === b.z0 || b.z1 === a.z0))
    return { ...a, z0: Math.min(a.z0, b.z0), z1: Math.max(a.z1, b.z1) } as Box
  return null
}

export function bodiesEqual(a: Body, b: Body): boolean {
  return a.boxes.length === b.boxes.length && a.boxes.every((x, i) => boxesEqual(x, b.boxes[i]!))
}
