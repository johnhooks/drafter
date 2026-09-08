import type { Body } from '../geom/body'
import type { Box } from '../geom/box'
import { type Face, faces } from '../geom/faces'
import { type Rect2, rectsOverlap } from '../geom/rect2d'
import { applyExtrude } from '../model/extrude'
import { FRAMES, boxToPlaneRect, facePlaneOfExtrusion, planesEqual } from '../model/planes'
import type { Document, FaceRef, PlaneDef, ResolvedPlane, SketchFeature } from '../model/types'

export interface SketchResult {
  readonly kind: 'sketch'
  readonly plane: ResolvedPlane
  /** Exposed faces lying on the sketch plane, facing the same way. Drawn as reference fills. */
  readonly coplanarFaces: Face[]
  /** Every body box projected onto the plane. Drawn as faint outlines. */
  readonly outlines: Rect2[]
}

export interface ExtrudeResult {
  readonly kind: 'extrude'
  readonly bodyId: string
  readonly plane: ResolvedPlane
  readonly distance: number
  readonly boxes: Map<string, Box>
  readonly rects: Map<string, Rect2>
}

export interface FeatureError {
  readonly kind: 'error'
  readonly message: string
  /** Set when this feature failed only because something it depends on failed. */
  readonly dependsOn?: string
}

export type FeatureResult = SketchResult | ExtrudeResult | FeatureError

export interface EvalResult {
  readonly bodies: Map<string, Body>
  readonly results: Map<string, FeatureResult>
  readonly errors: Array<{ featureId: string; message: string }>
}

export function evaluate(doc: Document): EvalResult {
  let bodies = new Map<string, Body>()
  const results = new Map<string, FeatureResult>()
  const errors: EvalResult['errors'] = []
  const fail = (id: string, message: string, dependsOn?: string) => {
    results.set(id, { kind: 'error', message, dependsOn })
    errors.push({ featureId: id, message })
  }
  for (const f of doc.features) {
    if (f.kind === 'sketch') {
      const plane = resolvePlane(f.plane, results, bodies)
      if (!plane.ok) {
        fail(f.id, plane.error, plane.dependsOn)
        continue
      }
      results.set(f.id, sketchResult(plane.value, bodies))
    } else {
      const sketch = doc.features.find((x): x is SketchFeature => x.kind === 'sketch' && x.id === f.sketchId)
      const sr = results.get(f.sketchId)
      if (!sketch || !sr) {
        fail(f.id, `Sketch ${f.sketchId} does not exist before this extrude`)
        continue
      }
      if (sr.kind !== 'sketch') {
        fail(f.id, `${sketch.name} failed`, sketch.id)
        continue
      }
      const applied = applyExtrude(f, sketch, sr.plane, bodies)
      if (!applied.ok) {
        fail(f.id, applied.error)
        continue
      }
      bodies = applied.value.bodies
      results.set(f.id, {
        kind: 'extrude',
        bodyId: applied.value.bodyId,
        plane: sr.plane,
        distance: f.distance,
        boxes: applied.value.boxes,
        rects: applied.value.rects,
      })
    }
  }
  return { bodies, results, errors }
}

function sketchResult(plane: ResolvedPlane, bodies: ReadonlyMap<string, Body>): SketchResult {
  const n = FRAMES[plane.plane].n
  const coplanarFaces: Face[] = []
  const outlines: Rect2[] = []
  for (const body of bodies.values()) {
    for (const face of faces(body)) {
      if (face.axis === n && face.dir === plane.normal && face.coord === plane.offset) coplanarFaces.push(face)
    }
    for (const b of body.boxes) outlines.push(boxToPlaneRect(plane, b))
  }
  return { kind: 'sketch', plane, coplanarFaces, outlines }
}

export type ResolvePlaneResult =
  | { ok: true; value: ResolvedPlane }
  | { ok: false; error: string; dependsOn?: string }

export function resolvePlane(
  def: PlaneDef,
  results: ReadonlyMap<string, FeatureResult>,
  bodies: ReadonlyMap<string, Body>,
): ResolvePlaneResult {
  if (def.kind === 'principal') return { ok: true, value: { plane: def.plane, offset: def.offset, normal: def.normal } }
  return resolveFaceRef(def, results, bodies)
}

/** Resolves a face reference against the extrude's current result and checks the face still exists. */
export function resolveFaceRef(
  ref: FaceRef,
  results: ReadonlyMap<string, FeatureResult>,
  bodies: ReadonlyMap<string, Body>,
): ResolvePlaneResult {
  const r = results.get(ref.featureId)
  if (!r) return { ok: false, error: `Referenced feature ${ref.featureId} does not exist before this sketch` }
  if (r.kind === 'error') return { ok: false, error: `Referenced feature ${ref.featureId} failed`, dependsOn: ref.featureId }
  if (r.kind !== 'extrude') return { ok: false, error: `Referenced feature ${ref.featureId} is not an extrude` }
  const rectId = ref.rectId ?? r.rects.keys().next().value
  const rect = rectId !== undefined ? r.rects.get(rectId) : undefined
  const box = rectId !== undefined ? r.boxes.get(rectId) : undefined
  if (!rect || !box) return { ok: false, error: `Rectangle ${String(rectId)} is no longer part of ${ref.featureId}` }
  const plane = facePlaneOfExtrusion(r.plane, rect, r.distance as never, ref.face)
  const body = bodies.get(r.bodyId)
  if (!body) return { ok: false, error: `Body ${r.bodyId} no longer exists` }
  const want = boxToPlaneRect(plane, box)
  const n = FRAMES[plane.plane].n
  const present = faces(body).some(
    (f) =>
      f.axis === n &&
      f.dir === plane.normal &&
      f.coord === plane.offset &&
      f.rects.some((fr) => rectsOverlap(fr, want)),
  )
  if (!present) return { ok: false, error: `The ${ref.face} face of ${ref.featureId} has been removed` }
  return { ok: true, value: plane }
}

export function extrudeOf(result: EvalResult, id: string): ExtrudeResult | undefined {
  const r = result.results.get(id)
  return r?.kind === 'extrude' ? r : undefined
}

export { planesEqual }
