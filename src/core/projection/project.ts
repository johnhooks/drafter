import type { Body } from '../geom/body'
import { type Face, faces } from '../geom/faces'
import type { Pt2, Rect2 } from '../geom/rect2d'
import { type Point3, type ViewKind, VIEW_FRAMES, viewPoint } from './frame'
import { type Candidate, type Occluder, type Segment, classify, mergeSegments } from './hidden'

export interface Projection {
  readonly segments: readonly Segment[]
  readonly vertices: readonly Pt2[]
  readonly bounds: Rect2 | null
}

function facePoint(face: Face, point: Pt2): Point3 {
  const [u, v] = point
  if (face.axis === 'x') return { x: face.coord, y: u, z: v }
  if (face.axis === 'y') return { x: u, y: face.coord, z: v }
  return { x: u, y: v, z: face.coord }
}

export function project(bodies: readonly Body[], view: ViewKind): Projection {
  const frame = VIEW_FRAMES[view]
  const edges: Candidate[] = []
  const occluders: Occluder[] = []
  for (const body of bodies) {
    for (const face of faces(body)) {
      if (face.axis === frame.depth && face.dir === frame.depthSign) {
        for (const rectangle of face.rects) {
          const first = viewPoint(facePoint(face, [rectangle.u0, rectangle.v0]), frame)
          const second = viewPoint(facePoint(face, [rectangle.u1, rectangle.v1]), frame)
          occluders.push({ u0: Math.min(first.u, second.u), u1: Math.max(first.u, second.u), v0: Math.min(first.v, second.v), v1: Math.max(first.v, second.v), depth: first.depth })
        }
      }
      for (const loop of face.loops) {
        loop.forEach((point, index) => {
          const first = viewPoint(facePoint(face, point), frame)
          const second = viewPoint(facePoint(face, loop[(index + 1) % loop.length]!), frame)
          if (first.u === second.u && first.v === second.v) return
          const horizontal = first.v === second.v
          edges.push({ dir: horizontal ? 'h' : 'v', at: horizontal ? first.v : first.u, min: Math.min(horizontal ? first.u : first.v, horizontal ? second.u : second.v), max: Math.max(horizontal ? first.u : first.v, horizontal ? second.u : second.v), depth: first.depth })
        })
      }
    }
  }
  const segments = mergeSegments(edges.flatMap((edge) => classify(edge, occluders)))
  const unique = new Map<string, Pt2>()
  for (const segment of segments) {
    for (const end of [segment.min, segment.max]) {
      const point: Pt2 = segment.dir === 'h' ? [end, segment.at] : [segment.at, end]
      unique.set(point.join(','), point)
    }
  }
  const vertices = [...unique.values()].sort((first, second) => first[0] - second[0] || first[1] - second[1])
  const bounds = vertices.length ? { u0: Math.min(...vertices.map((point) => point[0])), u1: Math.max(...vertices.map((point) => point[0])), v0: Math.min(...vertices.map((point) => point[1])), v1: Math.max(...vertices.map((point) => point[1])) } : null
  return { segments, vertices, bounds }
}
