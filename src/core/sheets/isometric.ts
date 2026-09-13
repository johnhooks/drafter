import type { Body } from '../geom/body'
import type { Rect2 } from '../geom/rect2d'

export function isometricProjection(bodies: readonly Body[], camera: { azimuth: number; elevation: number }) {
  const azimuth = (camera.azimuth % 360) * Math.PI / 180
  const elevation = (camera.elevation % 360) * Math.PI / 180
  const cardinal = (value: number, degrees: number) => degrees % 90 === 0 ? Math.round(value) : value
  const sinAzimuth = cardinal(Math.sin(azimuth), camera.azimuth)
  const cosAzimuth = cardinal(Math.cos(azimuth), camera.azimuth)
  const sinElevation = cardinal(Math.sin(elevation), camera.elevation)
  const cosElevation = cardinal(Math.cos(elevation), camera.elevation)
  const right = [-sinAzimuth, cosAzimuth, 0] as const
  const up = [-sinElevation * cosAzimuth, -sinElevation * sinAzimuth, cosElevation] as const
  const depth = [cosElevation * cosAzimuth, cosElevation * sinAzimuth, sinElevation] as const
  const minimum = [Infinity, Infinity, Infinity]
  const maximum = [-Infinity, -Infinity, -Infinity]
  for (const body of bodies) for (const box of body.boxes) {
    for (const horizontal of [box.x0, box.x1]) for (const along of [box.y0, box.y1]) for (const vertical of [box.z0, box.z1]) {
      for (const [index, axis] of [right, up, depth].entries()) {
        const projected = horizontal * axis[0] + along * axis[1] + vertical * axis[2]
        minimum[index] = Math.min(minimum[index]!, projected)
        maximum[index] = Math.max(maximum[index]!, projected)
      }
    }
  }
  const bounds: Rect2 | null = Number.isFinite(minimum[0]) ? { u0: minimum[0]!, u1: maximum[0]!, v0: minimum[1]!, v1: maximum[1]! } : null
  const middle = minimum.map((value, index) => bounds ? (value + maximum[index]!) / 2 : 0)
  const center = [0, 1, 2].map((index) => right[index]! * middle[0]! + up[index]! * middle[1]! + depth[index]! * middle[2]!)
  return { bounds, right, up, depth, center, depthSpan: bounds ? maximum[2]! - minimum[2]! : 0 }
}
