import { FRAMES } from '../../core/model/planes'
import type { ResolvedPlane } from '../../core/model/types'

/** Camera for the sketch view: centre in inches and pixels per inch. */
export interface SketchView {
  readonly cu: number
  readonly cv: number
  readonly scale: number
}

/**
 * The view looks along -normal with v up, so u reads right-to-left on the back side of a plane.
 * Returns the sign applied to u on screen.
 */
export function mirrorSign(plane: ResolvedPlane): 1 | -1 {
  return (plane.plane === 'XZ' ? -plane.normal : plane.normal) as 1 | -1
}

export function axisLabels(plane: ResolvedPlane): { u: string; v: string; from: string } {
  const f = FRAMES[plane.plane]
  return {
    u: f.u.toUpperCase(),
    v: f.v.toUpperCase(),
    from: `${plane.normal > 0 ? '+' : '-'}${f.n.toUpperCase()}`,
  }
}

/** Plane inches to pixels relative to the view centre. */
export function toScreen(view: SketchView, su: 1 | -1, u: number, v: number): [number, number] {
  return [(u - view.cu) * su * view.scale, -(v - view.cv) * view.scale]
}

/** Pixels relative to the view centre to plane inches. */
export function toPlaneInches(view: SketchView, su: 1 | -1, px: number, py: number): [number, number] {
  return [(px / view.scale) * su + view.cu, -py / view.scale + view.cv]
}
