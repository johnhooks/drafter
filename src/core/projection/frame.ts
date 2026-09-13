import type { Axis } from '../geom/box'

export type ViewKind = 'front' | 'top' | 'left' | 'right'
export type Point3 = Readonly<Record<Axis, number>>

export interface ViewFrame {
  readonly u: Axis
  readonly v: Axis
  readonly depth: Axis
  readonly uSign: 1 | -1
  readonly depthSign: 1 | -1
}

export const VIEW_FRAMES: Readonly<Record<ViewKind, ViewFrame>> = {
  front: { u: 'x', v: 'z', depth: 'y', uSign: 1, depthSign: -1 },
  top: { u: 'x', v: 'y', depth: 'z', uSign: 1, depthSign: 1 },
  right: { u: 'y', v: 'z', depth: 'x', uSign: 1, depthSign: 1 },
  left: { u: 'y', v: 'z', depth: 'x', uSign: -1, depthSign: -1 },
}

export function viewPoint(point: Point3, frame: ViewFrame) {
  return { u: point[frame.u] * frame.uSign + 0, v: point[frame.v], depth: point[frame.depth] * frame.depthSign + 0 }
}
