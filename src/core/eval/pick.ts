import { rectContainsPoint } from '../geom/rect2d'
import { boxToPlaneRect, facePlaneOfExtrusion, planesEqual } from '../model/planes'
import type { FaceRef, FaceRole, ResolvedPlane } from '../model/types'
import type { Sixteenths } from '../units'
import type { EvalResult } from './evaluate'

const ROLES: readonly FaceRole[] = ['cap', 'base', 'uMin', 'uMax', 'vMin', 'vMax']

/**
 * Maps a picked point on a plane back to the extrude and face role that owns it.
 * Later features win, so a joined shelf's face resolves to the shelf, not the carcass.
 */
export function findFaceRef(result: EvalResult, plane: ResolvedPlane, u: Sixteenths, v: Sixteenths): FaceRef | null {
  const entries = [...result.results.entries()].reverse()
  for (const [featureId, r] of entries) {
    if (r.kind !== 'extrude') continue
    for (const [rectId, rect] of r.rects) {
      const box = r.boxes.get(rectId)
      if (!box) continue
      for (const face of ROLES) {
        const fp = facePlaneOfExtrusion(r.plane, rect, r.distance as Sixteenths, face)
        if (!planesEqual(fp, plane)) continue
        if (rectContainsPoint(boxToPlaneRect(plane, box), u, v)) return { kind: 'face', featureId, rectId, face }
      }
    }
  }
  return null
}
