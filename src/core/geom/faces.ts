import type { Body } from './body'
import type { Axis, Box } from './box'
import { type Pt2, type Rect2, rectsToRegions, subtractRects } from './rect2d'

/**
 * One exposed face of a body: a connected region on an axis-aligned plane.
 * Plane frames match the sketch planes: x faces use (u, v) = (y, z), y faces (x, z), z faces (x, y).
 */
export interface Face {
  readonly axis: Axis
  readonly dir: 1 | -1
  readonly coord: number
  readonly rects: Rect2[]
  readonly area: number
  readonly loops: Pt2[][]
}

export function faceRectOfBox(b: Box, axis: Axis): Rect2 {
  switch (axis) {
    case 'x':
      return { u0: b.y0, u1: b.y1, v0: b.z0, v1: b.z1 }
    case 'y':
      return { u0: b.x0, u1: b.x1, v0: b.z0, v1: b.z1 }
    case 'z':
      return { u0: b.x0, u1: b.x1, v0: b.y0, v1: b.y1 }
  }
}

export function faces(body: Body): Face[] {
  const groups = new Map<string, { axis: Axis; dir: 1 | -1; coord: number; rects: Rect2[] }>()
  for (const b of body.boxes) {
    for (const axis of ['x', 'y', 'z'] as const) {
      for (const dir of [1, -1] as const) {
        const coord = dir === 1 ? b[`${axis}1`] : b[`${axis}0`]
        // boxes touching this face from outside hide part or all of it
        const occluders = body.boxes
          .filter((o) => o !== b && (dir === 1 ? o[`${axis}0`] : o[`${axis}1`]) === coord)
          .map((o) => faceRectOfBox(o, axis))
        const exposed = subtractRects(faceRectOfBox(b, axis), occluders)
        if (exposed.length === 0) continue
        const k = `${axis}${dir}@${coord}`
        const g = groups.get(k)
        if (g) g.rects.push(...exposed)
        else groups.set(k, { axis, dir, coord, rects: exposed })
      }
    }
  }
  const out: Face[] = []
  for (const g of groups.values()) {
    for (const region of rectsToRegions(g.rects)) {
      out.push({ axis: g.axis, dir: g.dir, coord: g.coord, rects: region.rects, area: region.area, loops: region.loops })
    }
  }
  return out
}
