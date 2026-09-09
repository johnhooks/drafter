import type { CameraState } from '../../core/model/types'
import { DEFAULT_CAMERA } from '../../core/model/types'

export interface CanonicalView {
  readonly id: 'front' | 'back' | 'left' | 'right' | 'top' | 'bottom' | 'iso-fl' | 'iso-fr' | 'iso-bl' | 'iso-br'
  readonly azimuth: number
  readonly elevation: number
}

const ISO = 35.264

/** Six orthographic faces and four isometrics from above. Azimuth is degrees around Z from +X toward +Y. */
export const CANONICAL_VIEWS: readonly CanonicalView[] = [
  { id: 'front', azimuth: -90, elevation: 0 },
  { id: 'back', azimuth: 90, elevation: 0 },
  { id: 'right', azimuth: 0, elevation: 0 },
  { id: 'left', azimuth: 180, elevation: 0 },
  { id: 'top', azimuth: -90, elevation: 89.9 },
  { id: 'bottom', azimuth: -90, elevation: -89.9 },
  { id: 'iso-fl', azimuth: DEFAULT_CAMERA.azimuth, elevation: ISO },
  { id: 'iso-fr', azimuth: -135, elevation: ISO },
  { id: 'iso-br', azimuth: 135, elevation: ISO },
  { id: 'iso-bl', azimuth: 45, elevation: ISO },
]

export const SNAP_DEGREES = 8
export const ELEVATION_LIMIT = 89.9

const rad = (d: number) => (d * Math.PI) / 180

/** Angle between two view directions on the sphere, in degrees. */
export function angularDistance(a: { azimuth: number; elevation: number }, b: { azimuth: number; elevation: number }): number {
  const ax = Math.cos(rad(a.elevation)) * Math.cos(rad(a.azimuth))
  const ay = Math.cos(rad(a.elevation)) * Math.sin(rad(a.azimuth))
  const az = Math.sin(rad(a.elevation))
  const bx = Math.cos(rad(b.elevation)) * Math.cos(rad(b.azimuth))
  const by = Math.cos(rad(b.elevation)) * Math.sin(rad(b.azimuth))
  const bz = Math.sin(rad(b.elevation))
  const dot = Math.min(1, Math.max(-1, ax * bx + ay * by + az * bz))
  return (Math.acos(dot) * 180) / Math.PI
}

export function nearestView(c: { azimuth: number; elevation: number }): { view: CanonicalView; distance: number } {
  let best = CANONICAL_VIEWS[0]!
  let bestD = Number.POSITIVE_INFINITY
  for (const v of CANONICAL_VIEWS) {
    const d = angularDistance(c, v)
    if (d < bestD) {
      best = v
      bestD = d
    }
  }
  return { view: best, distance: bestD }
}

/** The view to settle on after a drag, or null to stay where released. */
export function snapTarget(c: { azimuth: number; elevation: number }): CanonicalView | null {
  const { view, distance } = nearestView(c)
  return distance <= SNAP_DEGREES ? view : null
}

/** Normalises to (-180, 180]. */
export function wrapAzimuth(a: number): number {
  let x = ((a + 180) % 360 + 360) % 360 - 180
  if (x === -180) x = 180
  return x
}

export function clampElevation(e: number): number {
  return Math.min(ELEVATION_LIMIT, Math.max(-ELEVATION_LIMIT, e))
}

/** Spherical state from a camera position relative to its target, world inches. */
export function sphericalOf(dx: number, dy: number, dz: number): { azimuth: number; elevation: number } {
  const r = Math.hypot(dx, dy, dz) || 1
  return { azimuth: wrapAzimuth((Math.atan2(dy, dx) * 180) / Math.PI), elevation: clampElevation((Math.asin(dz / r) * 180) / Math.PI) }
}

/** Interpolates azimuth the short way round. */
export function lerpView(from: CameraState, to: { azimuth: number; elevation: number }, t: number): { azimuth: number; elevation: number } {
  const da = wrapAzimuth(to.azimuth - from.azimuth)
  return { azimuth: wrapAzimuth(from.azimuth + da * t), elevation: from.elevation + (to.elevation - from.elevation) * t }
}
