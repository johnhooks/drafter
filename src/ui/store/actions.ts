import { type EvalResult, evaluate } from '../../core/eval/evaluate'
import { dependentsOf } from '../../core/model/deps'
import { defaultOp } from '../../core/model/extrude'
import { newId, nextName } from '../../core/model/names'
import type { Document, ExtrudeFeature, Feature, PlaneDef, SketchFeature, SketchRect } from '../../core/model/types'
import { newDocument } from '../../core/model/types'
import type { Sixteenths } from '../../core/units'

export type Mode = { kind: 'model' } | { kind: 'sketch'; sketchId: string } | { kind: 'pickFace' }
export type Tool = 'select' | 'rect'

export interface Selection {
  readonly featureId?: string
  readonly bodyId?: string
  readonly rectIds: readonly string[]
}

export interface State {
  readonly doc: Document
  readonly eval: EvalResult
  readonly mode: Mode
  readonly tool: Tool
  readonly selection: Selection
  readonly notices: readonly string[]
}

export const EMPTY_SELECTION: Selection = { rectIds: [] }

export function initialState(doc: Document = newDocument()): State {
  return { doc, eval: evaluate(doc), mode: { kind: 'model' }, tool: 'select', selection: EMPTY_SELECTION, notices: [] }
}

function withDoc(s: State, doc: Document): State {
  return { ...s, doc, eval: evaluate(doc) }
}

function mapFeature<T extends Feature>(doc: Document, id: string, fn: (f: T) => T): Document {
  return { ...doc, features: doc.features.map((f) => (f.id === id ? fn(f as T) : f)) }
}

export function setTitle(s: State, title: string): State {
  return withDoc(s, { ...s.doc, title })
}

export function addSketch(s: State, plane: PlaneDef, id = newId('s')): State {
  const sketch: SketchFeature = { kind: 'sketch', id, name: nextName(s.doc, 'sketch'), plane, rects: [] }
  const next = withDoc(s, { ...s.doc, features: [...s.doc.features, sketch] })
  return { ...next, mode: { kind: 'sketch', sketchId: id }, tool: 'rect', selection: { featureId: id, rectIds: [] } }
}

/** Appends an extrude with the spec's defaults: join onto the face's body, or a new body from a principal plane. */
export function addExtrude(s: State, sketchId: string, rectIds: readonly string[], distance: Sixteenths, id = newId('e')): State {
  const sketch = s.doc.features.find((f): f is SketchFeature => f.kind === 'sketch' && f.id === sketchId)
  if (!sketch) return s
  const ids = rectIds.length ? rectIds : sketch.rects.map((r) => r.id)
  const op = defaultOp(sketch)
  let targetBodyId: string | undefined
  if (op === 'join' && sketch.plane.kind === 'face') {
    const r = s.eval.results.get(sketch.plane.featureId)
    if (r?.kind === 'extrude') targetBodyId = r.bodyId
  }
  if (op !== 'new' && !targetBodyId) targetBodyId = s.selection.bodyId
  const extrude: ExtrudeFeature = {
    kind: 'extrude',
    id,
    name: nextName(s.doc, 'extrude'),
    sketchId,
    rectIds: ids,
    distance,
    op,
    targetBodyId,
  }
  const next = withDoc(s, { ...s.doc, features: [...s.doc.features, extrude] })
  return { ...next, selection: { featureId: id, rectIds: [] } }
}

export function updateExtrude(s: State, id: string, patch: Partial<Omit<ExtrudeFeature, 'kind' | 'id'>>): State {
  return withDoc(s, mapFeature<ExtrudeFeature>(s.doc, id, (f) => ({ ...f, ...patch })))
}

export function renameFeature(s: State, id: string, name: string): State {
  return withDoc(s, mapFeature<Feature>(s.doc, id, (f) => ({ ...f, name })))
}

export function setSketchPlaneOffset(s: State, id: string, offset: Sixteenths): State {
  return withDoc(
    s,
    mapFeature<SketchFeature>(s.doc, id, (f) => (f.plane.kind === 'principal' ? { ...f, plane: { ...f.plane, offset } } : f)),
  )
}

export function addRect(s: State, sketchId: string, rect: SketchRect): State {
  return withDoc(s, mapFeature<SketchFeature>(s.doc, sketchId, (f) => ({ ...f, rects: [...f.rects, rect] })))
}

export function updateRect(s: State, sketchId: string, rect: SketchRect): State {
  return withDoc(
    s,
    mapFeature<SketchFeature>(s.doc, sketchId, (f) => ({ ...f, rects: f.rects.map((r) => (r.id === rect.id ? rect : r)) })),
  )
}

/** Removes rects and drops them from extrudes; an extrude left with no rects is deleted with its dependents. */
export function removeRects(s: State, sketchId: string, rectIds: readonly string[]): State {
  const gone = new Set(rectIds)
  let doc = mapFeature<SketchFeature>(s.doc, sketchId, (f) => ({ ...f, rects: f.rects.filter((r) => !gone.has(r.id)) }))
  const emptied: string[] = []
  doc = {
    ...doc,
    features: doc.features.map((f) => {
      if (f.kind !== 'extrude' || f.sketchId !== sketchId) return f
      const rest = f.rectIds.filter((id) => !gone.has(id))
      if (rest.length === 0) emptied.push(f.id)
      return { ...f, rectIds: rest }
    }),
  }
  let next = withDoc(s, doc)
  for (const id of emptied) next = deleteFeature(next, id)
  return { ...next, selection: { ...next.selection, rectIds: next.selection.rectIds.filter((id) => !gone.has(id)) } }
}

export function deleteFeature(s: State, id: string): State {
  const gone = new Set(dependentsOf(s.doc, id))
  const next = withDoc(s, { ...s.doc, features: s.doc.features.filter((f) => !gone.has(f.id)) })
  const mode: Mode = next.mode.kind === 'sketch' && gone.has(next.mode.sketchId) ? { kind: 'model' } : next.mode
  const selection = next.selection.featureId && gone.has(next.selection.featureId) ? EMPTY_SELECTION : next.selection
  return { ...next, mode, selection }
}

export function select(s: State, selection: Partial<Selection>): State {
  return { ...s, selection: { ...EMPTY_SELECTION, ...selection } }
}

export function toggleRect(s: State, rectId: string, additive: boolean): State {
  const cur = s.selection.rectIds
  const has = cur.includes(rectId)
  const rectIds = additive ? (has ? cur.filter((x) => x !== rectId) : [...cur, rectId]) : [rectId]
  return { ...s, selection: { ...s.selection, rectIds } }
}

export function setMode(s: State, mode: Mode): State {
  const tool: Tool = mode.kind === 'sketch' ? s.tool : 'select'
  const selection = mode.kind === 'sketch' ? { featureId: mode.sketchId, rectIds: [] } : s.selection
  return { ...s, mode, tool, selection }
}

export function setTool(s: State, tool: Tool): State {
  return { ...s, tool }
}

export function loadDocument(s: State, doc: Document): State {
  return { ...initialState(doc), notices: s.notices }
}

export function notify(s: State, text: string): State {
  if (s.notices.includes(text)) return s
  return { ...s, notices: [...s.notices, text] }
}

export function dismissNotice(s: State, index: number): State {
  return { ...s, notices: s.notices.filter((_, i) => i !== index) }
}
