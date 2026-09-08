import type { Axis, Box } from '../geom/box'
import { box } from '../geom/box'
import type { Rect2 } from '../geom/rect2d'
import type { Sixteenths } from '../units'
import type { FaceRole, PlaneKind, ResolvedPlane } from './types'

export interface Frame {
  readonly u: Axis
  readonly v: Axis
  readonly n: Axis
}

export const FRAMES: Record<PlaneKind, Frame> = {
  XZ: { u: 'x', v: 'z', n: 'y' },
  XY: { u: 'x', v: 'y', n: 'z' },
  YZ: { u: 'y', v: 'z', n: 'x' },
}

export const PLANE_BY_NORMAL: Record<Axis, PlaneKind> = { x: 'YZ', y: 'XZ', z: 'XY' }

export interface Vec3 {
  readonly x: Sixteenths
  readonly y: Sixteenths
  readonly z: Sixteenths
}

export function toModel(plane: ResolvedPlane, u: Sixteenths, v: Sixteenths): Vec3 {
  const f = FRAMES[plane.plane]
  const out = { x: 0, y: 0, z: 0 } as Record<Axis, number>
  out[f.u] = u
  out[f.v] = v
  out[f.n] = plane.offset
  return out as unknown as Vec3
}

export function toPlane(plane: ResolvedPlane, p: Vec3): { u: Sixteenths; v: Sixteenths; n: Sixteenths } {
  const f = FRAMES[plane.plane]
  return { u: p[f.u], v: p[f.v], n: p[f.n] }
}

/** Box swept from a plane rectangle along the plane normal by a signed distance. */
export function boxFromRect(plane: ResolvedPlane, r: Rect2, distance: Sixteenths): Box {
  const f = FRAMES[plane.plane]
  const lo = { x: 0, y: 0, z: 0 } as Record<Axis, number>
  const hi = { x: 0, y: 0, z: 0 } as Record<Axis, number>
  lo[f.u] = r.u0
  hi[f.u] = r.u1
  lo[f.v] = r.v0
  hi[f.v] = r.v1
  lo[f.n] = plane.offset
  hi[f.n] = plane.offset + plane.normal * distance
  return box(lo.x, hi.x, lo.y, hi.y, lo.z, hi.z)
}

/** The plane of one face of a box extruded from `plane` by `distance` over rect `r`. */
export function facePlaneOfExtrusion(
  plane: ResolvedPlane,
  r: Rect2,
  distance: Sixteenths,
  role: FaceRole,
): ResolvedPlane {
  const f = FRAMES[plane.plane]
  const outward = (plane.normal * Math.sign(distance)) as 1 | -1
  switch (role) {
    case 'cap':
      return { plane: plane.plane, offset: (plane.offset + plane.normal * distance) as Sixteenths, normal: outward }
    case 'base':
      return { plane: plane.plane, offset: plane.offset, normal: -outward as 1 | -1 }
    case 'uMin':
      return { plane: PLANE_BY_NORMAL[f.u], offset: r.u0 as Sixteenths, normal: -1 }
    case 'uMax':
      return { plane: PLANE_BY_NORMAL[f.u], offset: r.u1 as Sixteenths, normal: 1 }
    case 'vMin':
      return { plane: PLANE_BY_NORMAL[f.v], offset: r.v0 as Sixteenths, normal: -1 }
    case 'vMax':
      return { plane: PLANE_BY_NORMAL[f.v], offset: r.v1 as Sixteenths, normal: 1 }
  }
}

/** Project a box onto a plane's (u, v) frame. */
export function boxToPlaneRect(plane: ResolvedPlane, b: Box): Rect2 {
  const f = FRAMES[plane.plane]
  return { u0: b[`${f.u}0`], u1: b[`${f.u}1`], v0: b[`${f.v}0`], v1: b[`${f.v}1`] }
}

export function planesEqual(a: ResolvedPlane, b: ResolvedPlane): boolean {
  return a.plane === b.plane && a.offset === b.offset && a.normal === b.normal
}
