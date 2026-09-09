import type { Body } from '../geom/body'
import { cut, join, newBody } from '../geom/body'
import type { Box } from '../geom/box'
import { type SketchRegion, regionByRef } from '../geom/regions'
import type { Sixteenths } from '../units'
import { boxFromRect } from './planes'
import type { ExtrudeFeature, ExtrudeOp, RegionRef, ResolvedPlane, SketchFeature } from './types'
import { regionKey } from './types'

export interface ExtrudedRegion {
  readonly ref: RegionRef
  readonly region: SketchRegion
  readonly boxes: Box[]
}

export interface ExtrudeOutcome {
  readonly bodies: Map<string, Body>
  readonly bodyId: string
  readonly regions: Map<string, ExtrudedRegion>
}

export type ApplyResult = { ok: true; value: ExtrudeOutcome } | { ok: false; error: string }

export type RegionLookup = { ok: true; region: SketchRegion } | { ok: false; error: string }

/** Resolves a region reference against a sketch's current regions, naming what went wrong by handle. */
export function lookupRegion(ref: RegionRef, sketch: SketchFeature, regions: readonly SketchRegion[], lineErrors: ReadonlyMap<string, string>): RegionLookup {
  const found = regionByRef(regions, ref)
  if (found) return { ok: true, region: found }
  const names: string[] = []
  for (const id of [ref.vertical, ref.horizontal]) {
    const l = sketch.lines.find((x) => x.id === id)
    if (!l) return { ok: false, error: `A line bounding the region was deleted from ${sketch.name}` }
    const err = lineErrors.get(id)
    if (err) return { ok: false, error: `${l.handle} in ${sketch.name} failed: ${err}` }
    names.push(l.handle)
  }
  return { ok: false, error: `No region is enclosed at the corner of ${names[0]} and ${names[1]} in ${sketch.name}` }
}

/** Applies one extrude to the bodies as they stand at that point in the timeline, using the sketch's resolved regions. */
export function applyExtrude(
  f: ExtrudeFeature,
  sketch: SketchFeature,
  plane: ResolvedPlane,
  regions: readonly SketchRegion[],
  lineErrors: ReadonlyMap<string, string>,
  distance: Sixteenths,
  bodies: ReadonlyMap<string, Body>,
): ApplyResult {
  if (f.regions.length === 0) return { ok: false, error: 'Extrude has no regions' }
  if (distance === 0) return { ok: false, error: 'Extrude distance is zero' }
  const extruded = new Map<string, ExtrudedRegion>()
  for (const ref of f.regions) {
    const r = lookupRegion(ref, sketch, regions, lineErrors)
    if (!r.ok) return { ok: false, error: r.error }
    extruded.set(regionKey(ref), { ref, region: r.region, boxes: r.region.rects.map((rect) => boxFromRect(plane, rect, distance)) })
  }
  const boxes = [...extruded.values()].flatMap((e) => e.boxes)
  const next = new Map(bodies)
  if (f.op === 'new') {
    next.set(f.id, newBody(f.id, f.name, ...boxes))
    return { ok: true, value: { bodies: next, bodyId: f.id, regions: extruded } }
  }
  const targetId = f.targetBodyId
  const target = targetId ? bodies.get(targetId) : undefined
  if (!targetId || !target) return { ok: false, error: `Target body ${targetId ?? '(none)'} does not exist yet` }
  let body = target
  for (const b of boxes) body = f.op === 'join' ? join(body, b) : cut(body, b)
  if (body.boxes.length === 0) next.delete(targetId)
  else next.set(targetId, body)
  return { ok: true, value: { bodies: next, bodyId: targetId, regions: extruded } }
}

export function defaultOp(sketch: SketchFeature): ExtrudeOp {
  return sketch.plane.kind === 'face' ? 'join' : 'new'
}
