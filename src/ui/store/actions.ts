import { type EvalResult, evaluate } from '../../core/eval/evaluate'
import type { Rect2 } from '../../core/geom/rect2d'
import { dependentsOf } from '../../core/model/deps'
import { defaultOp } from '../../core/model/extrude'
import { newId, nextHandle, nextName } from '../../core/model/names'
import { renameParam as renameParamInDoc, usesOf, validateParamName } from '../../core/model/params'
import { setSlot } from '../../core/model/slots'
import type { Document, ExtrudeFeature, Feature, Len, PlaneDef, SketchFeature, SketchRect, Slot } from '../../core/model/types'
import { newDocument } from '../../core/model/types'
import type { Sixteenths } from '../../core/units'

export type Mode = { kind: 'model' } | { kind: 'sketch'; sketchId: string } | { kind: 'pickFace' }
export type Tool = 'select' | 'rect' | 'link'

export interface ConstraintRef {
  readonly sketchId: string
  readonly rectId: string
  readonly axis: 'u' | 'v'
  readonly slot: Slot
}

export interface Selection {
  readonly featureId?: string
  readonly bodyId?: string
  readonly rectIds: readonly string[]
  readonly constraint?: ConstraintRef
}

export interface History {
  readonly past: readonly Document[]
  readonly future: readonly Document[]
  /** Coalescing: the key and time of the last push, so consecutive keystrokes collapse into one entry. */
  readonly lastKey?: string
  readonly lastAt?: number
}

export type Theme = 'light' | 'dark'
export type NoticeTone = 'info' | 'warning' | 'danger'
export interface Notice {
  readonly text: string
  readonly tone: NoticeTone
}

export interface State {
  readonly doc: Document
  readonly eval: EvalResult
  readonly mode: Mode
  readonly tool: Tool
  readonly selection: Selection
  readonly notices: readonly Notice[]
  readonly theme: Theme
  /** Last successfully resolved position per rectangle id, so a failed rectangle can still be drawn. */
  readonly lastGood: ReadonlyMap<string, Rect2>
  readonly showDims: boolean
  readonly history: History
}

export const EMPTY_SELECTION: Selection = { rectIds: [] }
export const HISTORY_LIMIT = 200
export const COALESCE_MS = 2000

export function initialState(doc: Document = newDocument()): State {
  const ev = evaluate(doc)
  return {
    doc,
    eval: ev,
    mode: { kind: 'model' },
    tool: 'select',
    selection: EMPTY_SELECTION,
    notices: [],
    theme: 'light',
    lastGood: goodRects(ev, new Map()),
    showDims: true,
    history: { past: [], future: [] },
  }
}

export function setTheme(s: State, theme: Theme): State {
  return { ...s, theme }
}

function goodRects(ev: EvalResult, prev: ReadonlyMap<string, Rect2>): Map<string, Rect2> {
  const out = new Map(prev)
  for (const r of ev.results.values()) {
    if (r.kind !== 'sketch') continue
    for (const [id, rr] of r.rects) out.set(id, { u0: rr.u0, u1: rr.u1, v0: rr.v0, v1: rr.v1 })
  }
  return out
}

interface PushOptions {
  /** Edits sharing a key within COALESCE_MS collapse into one undo entry. */
  readonly key?: string
  readonly now?: number
}

/** The one place a changed document enters state: evaluates it and records the previous one for undo. */
function withDoc(s: State, doc: Document, opts: PushOptions = {}): State {
  if (doc === s.doc) return s
  const ev = evaluate(doc)
  const now = opts.now ?? Date.now()
  const coalesce = opts.key !== undefined && opts.key === s.history.lastKey && s.history.lastAt !== undefined && now - s.history.lastAt < COALESCE_MS
  const past = coalesce ? s.history.past : [...s.history.past, s.doc].slice(-HISTORY_LIMIT)
  return { ...s, doc, eval: ev, lastGood: goodRects(ev, s.lastGood), history: { past, future: [], lastKey: opts.key, lastAt: opts.key !== undefined ? now : undefined } }
}

/** After a document swap, drop view state that points at things which no longer exist. */
function reconcile(s: State, doc: Document): State {
  const ev = evaluate(doc)
  const ids = new Set(doc.features.map((f) => f.id))
  const sketchIds = new Set(doc.features.filter((f) => f.kind === 'sketch').map((f) => f.id))
  const mode: Mode = s.mode.kind === 'sketch' && !sketchIds.has(s.mode.sketchId) ? { kind: 'model' } : s.mode
  const rectIds = new Set(doc.features.flatMap((f) => (f.kind === 'sketch' ? f.rects.map((r) => r.id) : [])))
  const selection: Selection = {
    featureId: s.selection.featureId && ids.has(s.selection.featureId) ? s.selection.featureId : undefined,
    bodyId: s.selection.bodyId && ev.bodies.has(s.selection.bodyId) ? s.selection.bodyId : undefined,
    rectIds: s.selection.rectIds.filter((id) => rectIds.has(id)),
    constraint: s.selection.constraint && rectIds.has(s.selection.constraint.rectId) ? s.selection.constraint : undefined,
  }
  return { ...s, doc, eval: ev, lastGood: goodRects(ev, s.lastGood), mode, selection }
}

export function undo(s: State): State {
  const prev = s.history.past.at(-1)
  if (!prev) return s
  const next = reconcile(s, prev)
  return { ...next, history: { past: s.history.past.slice(0, -1), future: [...s.history.future, s.doc] } }
}

export function redo(s: State): State {
  const nextDoc = s.history.future.at(-1)
  if (!nextDoc) return s
  const next = reconcile(s, nextDoc)
  return { ...next, history: { past: [...s.history.past, s.doc].slice(-HISTORY_LIMIT), future: s.history.future.slice(0, -1) } }
}

export const canUndo = (s: State) => s.history.past.length > 0
export const canRedo = (s: State) => s.history.future.length > 0

function mapFeature<T extends Feature>(doc: Document, id: string, fn: (f: T) => T): Document {
  return { ...doc, features: doc.features.map((f) => (f.id === id ? fn(f as T) : f)) }
}

function sketchOf(s: State, sketchId: string): SketchFeature | undefined {
  return s.doc.features.find((f): f is SketchFeature => f.kind === 'sketch' && f.id === sketchId)
}

export function setTitle(s: State, title: string, now?: number): State {
  return withDoc(s, { ...s.doc, title }, { key: 'title', now })
}

export function addSketch(s: State, plane: PlaneDef, id = newId('s')): State {
  const handles = s.doc.features.filter((f): f is SketchFeature => f.kind === 'sketch').map((f) => f.handle)
  const sketch: SketchFeature = { kind: 'sketch', id, handle: nextHandle('s', handles), name: nextName(s.doc, 'sketch'), plane, rects: [] }
  const next = withDoc(s, { ...s.doc, features: [...s.doc.features, sketch] })
  return { ...next, mode: { kind: 'sketch', sketchId: id }, tool: 'rect', selection: { featureId: id, rectIds: [] } }
}

/** Appends an extrude with the spec's defaults: join onto the face's body, or a new body from a principal plane. */
export function addExtrude(s: State, sketchId: string, rectIds: readonly string[], distance: Len, id = newId('e')): State {
  const sketch = sketchOf(s, sketchId)
  if (!sketch) return s
  const ids = rectIds.length ? rectIds : sketch.rects.map((r) => r.id)
  const op = defaultOp(sketch)
  let targetBodyId: string | undefined
  if (op === 'join' && sketch.plane.kind === 'face') {
    const r = s.eval.results.get(sketch.plane.featureId)
    if (r?.kind === 'extrude') targetBodyId = r.bodyId
  }
  if (op !== 'new' && !targetBodyId) targetBodyId = s.selection.bodyId
  const extrude: ExtrudeFeature = { kind: 'extrude', id, name: nextName(s.doc, 'extrude'), sketchId, rectIds: ids, distance, op, targetBodyId }
  const next = withDoc(s, { ...s.doc, features: [...s.doc.features, extrude] })
  return { ...next, selection: { featureId: id, rectIds: [] } }
}

export function updateExtrude(s: State, id: string, patch: Partial<Omit<ExtrudeFeature, 'kind' | 'id'>>): State {
  return withDoc(s, mapFeature<ExtrudeFeature>(s.doc, id, (f) => ({ ...f, ...patch })))
}

export function renameFeature(s: State, id: string, name: string, now?: number): State {
  return withDoc(s, mapFeature<Feature>(s.doc, id, (f) => ({ ...f, name })), { key: `name:${id}`, now })
}

export function setSketchPlaneOffset(s: State, id: string, offset: Len): State {
  return withDoc(s, mapFeature<SketchFeature>(s.doc, id, (f) => (f.plane.kind === 'principal' ? { ...f, plane: { ...f.plane, offset } } : f)))
}

/** Adds a rectangle, assigning the next free handle unless the rect carries one already in use by nobody. */
export function addRect(s: State, sketchId: string, rect: SketchRect): State {
  const sketch = sketchOf(s, sketchId)
  if (!sketch) return s
  const taken = sketch.rects.map((r) => r.handle)
  const handle = rect.handle && !taken.includes(rect.handle) ? rect.handle : nextHandle('r', taken)
  return withDoc(s, mapFeature<SketchFeature>(s.doc, sketchId, (f) => ({ ...f, rects: [...f.rects, { ...rect, handle }] })))
}

export function updateRect(s: State, sketchId: string, rect: SketchRect): State {
  return withDoc(s, mapFeature<SketchFeature>(s.doc, sketchId, (f) => ({ ...f, rects: f.rects.map((r) => (r.id === rect.id ? rect : r)) })))
}

/** Applies the slot-edit rule; a refusal becomes a notice and leaves the document unchanged. */
export function setRectSlot(s: State, sketchId: string, rectId: string, axis: 'u' | 'v', slot: Slot, value: Len): State {
  const sketch = sketchOf(s, sketchId)
  const rect = sketch?.rects.find((r) => r.id === rectId)
  if (!sketch || !rect) return s
  const sr = s.eval.results.get(sketchId)
  const resolved = sr?.kind === 'sketch' ? sr.rects.get(rectId) : undefined
  const current = resolved ? (axis === 'u' ? resolved.uAxis : resolved.vAxis) : fallbackAxis(s.lastGood.get(rectId), axis)
  const r = setSlot(rect[axis], slot, value, current)
  if (!r.ok) return notify(s, `${rect.handle}: ${r.error}`)
  return updateRect(s, sketchId, { ...rect, [axis]: r.slots })
}

function fallbackAxis(last: Rect2 | undefined, axis: 'u' | 'v') {
  if (!last) return { min: 0, max: 16, size: 16 }
  return axis === 'u' ? { min: last.u0, max: last.u1, size: last.u1 - last.u0 } : { min: last.v0, max: last.v1, size: last.v1 - last.v0 }
}

/** Replaces an expression slot with its current resolved number. */
export function removeConstraint(s: State, c: ConstraintRef): State {
  const sketch = sketchOf(s, c.sketchId)
  const rect = sketch?.rects.find((r) => r.id === c.rectId)
  if (!sketch || !rect) return s
  const sr = s.eval.results.get(c.sketchId)
  const values = sr?.kind === 'sketch' ? sr.slotValues.get(c.rectId)?.[c.axis] : undefined
  const resolved = sr?.kind === 'sketch' ? sr.rects.get(c.rectId) : undefined
  const ax = resolved ? (c.axis === 'u' ? resolved.uAxis : resolved.vAxis) : fallbackAxis(s.lastGood.get(c.rectId), c.axis)
  const value = (values?.[c.slot] ?? ax[c.slot]) as Sixteenths
  const next = updateRect(s, c.sketchId, { ...rect, [c.axis]: { ...rect[c.axis], [c.slot]: value } })
  return { ...next, selection: { ...next.selection, constraint: undefined } }
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

export function addParam(s: State, name: string, value: Len): State {
  const err = validateParamName(name, s.doc.params.map((p) => p.name))
  if (err) return notify(s, err)
  return withDoc(s, { ...s.doc, params: [...s.doc.params, { name, value }] })
}

export function setParamValue(s: State, name: string, value: Len): State {
  return withDoc(s, { ...s.doc, params: s.doc.params.map((p) => (p.name === name ? { ...p, value } : p)) })
}

export function renameParam(s: State, from: string, to: string): State {
  if (from === to) return s
  const err = validateParamName(to, s.doc.params.map((p) => p.name))
  if (err) return notify(s, err)
  return withDoc(s, renameParamInDoc(s.doc, from, to))
}

export function deleteParam(s: State, name: string): State {
  const uses = usesOf(s.doc, name)
  if (uses.length) return notify(s, `${name} is used by ${uses.map((u) => u.where).join(', ')}`)
  return withDoc(s, { ...s.doc, params: s.doc.params.filter((p) => p.name !== name) })
}

export function select(s: State, selection: Partial<Selection>): State {
  return { ...s, selection: { ...EMPTY_SELECTION, ...selection } }
}

export function selectConstraint(s: State, constraint: ConstraintRef | undefined): State {
  return { ...s, selection: { ...s.selection, constraint } }
}

export function toggleRect(s: State, rectId: string, additive: boolean): State {
  const cur = s.selection.rectIds
  const has = cur.includes(rectId)
  const rectIds = additive ? (has ? cur.filter((x) => x !== rectId) : [...cur, rectId]) : [rectId]
  return { ...s, selection: { ...s.selection, rectIds, constraint: undefined } }
}

export function setMode(s: State, mode: Mode): State {
  const tool: Tool = mode.kind === 'sketch' ? s.tool : 'select'
  const selection = mode.kind === 'sketch' ? { featureId: mode.sketchId, rectIds: [] } : s.selection
  return { ...s, mode, tool, selection }
}

export function setTool(s: State, tool: Tool): State {
  return { ...s, tool }
}

export function toggleDims(s: State): State {
  return { ...s, showDims: !s.showDims }
}

export function loadDocument(s: State, doc: Document): State {
  return { ...initialState(doc), notices: s.notices, theme: s.theme }
}

/** Refusals and failures default to a persistent warning; file and storage failures pass danger. */
export function notify(s: State, text: string, tone: NoticeTone = 'warning'): State {
  if (s.notices.some((n) => n.text === text)) return s
  return { ...s, notices: [...s.notices, { text, tone }] }
}

export function dismissNotice(s: State, text: string): State {
  return { ...s, notices: s.notices.filter((n) => n.text !== text) }
}

export function selectRects(s: State, sketchId: string, rectIds: readonly string[]): State {
  return { ...s, selection: { featureId: sketchId, rectIds, constraint: undefined } }
}
