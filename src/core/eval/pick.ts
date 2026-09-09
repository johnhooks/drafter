import { rectContainsPoint } from '../geom/rect2d'
import { boxToPlaneRect, capPlane, planesEqual, sideBox, sidePlane } from '../model/planes'
import type { FaceRef, ResolvedPlane } from '../model/types'
import type { Sixteenths } from '../units'
import type { EvalResult } from './evaluate'

/**
 * Maps a picked point on a plane back to the extrude, region, and face that own it.
 * Later features win, so a joined shelf's face resolves to the shelf, not the carcass.
 */
export function findFaceRef(result: EvalResult, plane: ResolvedPlane, u: Sixteenths, v: Sixteenths): FaceRef | null {
  const entries = [...result.results.entries()].reverse()
  for (const [featureId, r] of entries) {
    if (r.kind !== 'extrude') continue
    const distance = r.distance as Sixteenths
    for (const e of r.regions.values()) {
      for (const face of ['cap', 'base'] as const) {
        if (!planesEqual(capPlane(r.plane, distance, face), plane)) continue
        if (e.region.rects.some((rect) => rectContainsPoint(rect, u, v))) return { kind: 'face', featureId, region: e.ref, face }
      }
      for (const edge of e.region.boundary) {
        if (!planesEqual(sidePlane(r.plane, edge.dir, edge.at, edge.outward), plane)) continue
        const rect = boxToPlaneRect(plane, sideBox(r.plane, edge.dir, edge.at, edge.from, edge.to, distance))
        if (rectContainsPoint(rect, u, v)) return { kind: 'face', featureId, region: e.ref, face: 'side', lineId: edge.lineId, outward: edge.outward }
      }
    }
  }
  return null
}
