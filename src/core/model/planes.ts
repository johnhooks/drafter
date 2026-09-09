import type { Axis, Box } from '../geom/box'
import { box } from '../geom/box'
import type { Rect2 } from '../geom/rect2d'
import type { Sixteenths } from '../units'
import type { PlaneKind, ResolvedPlane } from './types'

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

/** The cap or base plane of an extrusion from `plane` by `distance`. */
export function capPlane(plane: ResolvedPlane, distance: Sixteenths, role: 'cap' | 'base'): ResolvedPlane {
  const outward = (plane.normal * Math.sign(distance)) as 1 | -1
  if (role === 'cap') return { plane: plane.plane, offset: (plane.offset + plane.normal * distance) as Sixteenths, normal: outward }
  return { plane: plane.plane, offset: plane.offset, normal: -outward as 1 | -1 }
}

/**
 * The plane of a side face swept from a boundary edge: a vertical edge (constant u) faces along the
 * plane's u axis, a horizontal one along v; `outward` is the side away from the region.
 */
export function sidePlane(plane: ResolvedPlane, dir: 'h' | 'v', at: number, outward: 1 | -1): ResolvedPlane {
  const f = FRAMES[plane.plane]
  return { plane: PLANE_BY_NORMAL[dir === 'v' ? f.u : f.v], offset: at as Sixteenths, normal: outward }
}

/** The box swept by a boundary edge along the extrusion: zero thick across the edge, so it projects to the side face rectangle. */
export function sideBox(plane: ResolvedPlane, dir: 'h' | 'v', at: number, from: number, to: number, distance: Sixteenths): Box {
  const f = FRAMES[plane.plane]
  const lo = { x: 0, y: 0, z: 0 } as Record<Axis, number>
  const hi = { x: 0, y: 0, z: 0 } as Record<Axis, number>
  const constAxis = dir === 'v' ? f.u : f.v
  const runAxis = dir === 'v' ? f.v : f.u
  lo[constAxis] = at
  hi[constAxis] = at
  lo[runAxis] = from
  hi[runAxis] = to
  lo[f.n] = plane.offset
  hi[f.n] = plane.offset + plane.normal * distance
  return box(lo.x, hi.x, lo.y, hi.y, lo.z, hi.z)
}

/** Project a box onto a plane's (u, v) frame. */
export function boxToPlaneRect(plane: ResolvedPlane, b: Box): Rect2 {
  const f = FRAMES[plane.plane]
  return { u0: b[`${f.u}0`], u1: b[`${f.u}1`], v0: b[`${f.v}0`], v1: b[`${f.v}1`] }
}

export function planesEqual(a: ResolvedPlane, b: ResolvedPlane): boolean {
  return a.plane === b.plane && a.offset === b.offset && a.normal === b.normal
}
