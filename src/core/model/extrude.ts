import type { Body } from '../geom/body'
import { cut, join, newBody } from '../geom/body'
import type { Box } from '../geom/box'
import type { Rect2 } from '../geom/rect2d'
import { boxFromRect } from './planes'
import { normRect } from './sketch'
import type { ExtrudeFeature, ExtrudeOp, ResolvedPlane, SketchFeature } from './types'

export interface ExtrudeOutcome {
  readonly bodies: Map<string, Body>
  readonly bodyId: string
  readonly boxes: Map<string, Box>
  readonly rects: Map<string, Rect2>
}

export type ApplyResult = { ok: true; value: ExtrudeOutcome } | { ok: false; error: string }

/** Applies one extrude to the bodies as they stand at that point in the timeline. */
export function applyExtrude(
  f: ExtrudeFeature,
  sketch: SketchFeature,
  plane: ResolvedPlane,
  bodies: ReadonlyMap<string, Body>,
): ApplyResult {
  if (f.rectIds.length === 0) return { ok: false, error: 'Extrude has no rectangles' }
  if (f.distance === 0) return { ok: false, error: 'Extrude distance is zero' }
  const boxes = new Map<string, Box>()
  const rects = new Map<string, Rect2>()
  for (const rid of f.rectIds) {
    const r = sketch.rects.find((x) => x.id === rid)
    if (!r) return { ok: false, error: `Rectangle ${rid} is not in ${sketch.name}` }
    const n = normRect(r)
    rects.set(rid, n)
    boxes.set(rid, boxFromRect(plane, n, f.distance))
  }
  const next = new Map(bodies)
  if (f.op === 'new') {
    const body = newBody(f.id, f.name, ...boxes.values())
    next.set(f.id, body)
    return { ok: true, value: { bodies: next, bodyId: f.id, boxes, rects } }
  }
  const targetId = f.targetBodyId
  const target = targetId ? bodies.get(targetId) : undefined
  if (!targetId || !target) return { ok: false, error: `Target body ${targetId ?? '(none)'} does not exist yet` }
  let body = target
  for (const b of boxes.values()) body = f.op === 'join' ? join(body, b) : cut(body, b)
  if (body.boxes.length === 0) next.delete(targetId)
  else next.set(targetId, body)
  return { ok: true, value: { bodies: next, bodyId: targetId, boxes, rects } }
}

export function defaultOp(sketch: SketchFeature): ExtrudeOp {
  return sketch.plane.kind === 'face' ? 'join' : 'new'
}
