import { type EvalResult, evaluate } from '../../core/eval/evaluate'
import type { ResolvedLine } from '../../core/eval/resolveSketch'
import { parse, references } from '../../core/expr/parser'
import { type SketchRegion, regionByRef } from '../../core/geom/regions'
import { dependentsOf } from '../../core/model/deps'
import { defaultOp } from '../../core/model/extrude'
import { newId, nextHandle, nextName } from '../../core/model/names'
import { renameParam as renameParamInDoc, usesOf, validateParamName } from '../../core/model/params'
import { rectangleLines } from '../../core/model/sketch'
import { setSlot } from '../../core/model/slots'
import type {
  CameraState,
  DimLayout,
  Document,
  DocumentFile,
  ExtrudeFeature,
  Feature,
  Len,
  LineDir,
  LineSlot,
  PlaneDef,
  RegionLabelLayout,
  RegionRef,
  SketchFeature,
  SketchLine,
  Slot,
  ViewState,
} from '../../core/model/types'
import { DEFAULT_VIEW, isExpr, newDocument, regionKey, sameRegion } from '../../core/model/types'
import type { Sixteenths } from '../../core/units'

export type Mode = { kind: 'model' } | { kind: 'sketch'; sketchId: string } | { kind: 'pickFace' } | { kind: 'pickBody'; extrudeId: string }
export type Tool = 'select' | 'line' | 'rect' | 'link'

export interface ConstraintRef {
  readonly sketchId: string
  readonly lineId: string
  readonly slot: LineSlot
}

export interface Selection {
  readonly featureId?: string
  readonly bodyId?: string
  readonly lineIds: readonly string[]
  readonly regions: readonly RegionRef[]
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

/** Last known geometry of a line, kept so a failed line can still be drawn. */
export type LineShape = Pick<ResolvedLine, 'dir' | 'at' | 'min' | 'max'>

export interface State {
  /** The model. Undo snapshots this and only this. */
  readonly doc: Document
  /** Display state saved beside the model: camera and open sketch. Never on the undo stack. */
  readonly view: ViewState
  readonly eval: EvalResult
  readonly mode: Mode
  readonly tool: Tool
  readonly selection: Selection
  readonly notices: readonly Notice[]
  readonly theme: Theme
  /** Last successfully resolved shape per line id, so a failed line can still be drawn. */
  readonly lastGood: ReadonlyMap<string, LineShape>
  readonly showDims: boolean
  readonly history: History
}

export const EMPTY_SELECTION: Selection = { lineIds: [], regions: [] }
export const HISTORY_LIMIT = 200
export const COALESCE_MS = 2000

export function initialState(doc: Document = newDocument(), view: ViewState = DEFAULT_VIEW): State {
  const ev = evaluate(doc)
  return {
    doc,
    view,
    eval: ev,
    mode: { kind: 'model' },
    tool: 'select',
    selection: EMPTY_SELECTION,
    notices: [],
    theme: 'light',
    lastGood: goodLines(ev, new Map()),
    showDims: true,
    history: { past: [], future: [] },
  }
}

export function setTheme(s: State, theme: Theme): State {
  return { ...s, theme }
}

/** Camera changes are display state: saved, never undone. */
export function setCamera(s: State, camera: Partial<CameraState>): State {
  return { ...s, view: { ...s.view, camera: { ...s.view.camera, ...camera } } }
}

export function fileOf(s: State): DocumentFile {
  const sketchId = s.mode.kind === 'sketch' ? s.mode.sketchId : undefined
  return { version: 4, model: s.doc, view: sketchId ? { ...s.view, sketchId } : { camera: s.view.camera } }
}

function goodLines(ev: EvalResult, prev: ReadonlyMap<string, LineShape>): Map<string, LineShape> {
  const out = new Map(prev)
  for (const r of ev.results.values()) {
    if (r.kind !== 'sketch') continue
    for (const [id, l] of r.lines) out.set(id, { dir: l.dir, at: l.at, min: l.min, max: l.max })
  }
  return out
}

interface PushOptions {
  /** Edits sharing a key within COALESCE_MS collapse into one undo entry. */
  readonly key?: string
  readonly now?: number
}

/** Drops region label placements whose region no longer exists; labels are the one thing stored about regions. */
function pruneRegionLabels(doc: Document, ev: EvalResult): Document {
  let changed = false
  const features = doc.features.map((f) => {
    if (f.kind !== 'sketch' || !f.regionLabels) return f
    const r = ev.results.get(f.id)
    const regions = r?.kind === 'sketch' ? r.regions : []
    const kept: Record<string, RegionLabelLayout> = {}
    for (const [key, layout] of Object.entries(f.regionLabels)) {
      const [vertical, horizontal] = key.split('|')
      if (vertical && horizontal && regionByRef(regions, { vertical, horizontal })) kept[key] = layout
    }
    if (Object.keys(kept).length === Object.keys(f.regionLabels).length) return f
    changed = true
    const { regionLabels: _old, ...rest } = f
    return Object.keys(kept).length ? { ...rest, regionLabels: kept } : rest
  })
  return changed ? { ...doc, features } : doc
}

/** Drops selection entries that point at lines, regions, features, or bodies which no longer exist. */
function reconcileSelection(sel: Selection, doc: Document, ev: EvalResult): Selection {
  const ids = new Set(doc.features.map((f) => f.id))
  const lineIds = new Set(doc.features.flatMap((f) => (f.kind === 'sketch' ? f.lines.map((l) => l.id) : [])))
  const regions = [...ev.results.values()].flatMap((r) => (r.kind === 'sketch' ? r.regions : []))
  return {
    featureId: sel.featureId && ids.has(sel.featureId) ? sel.featureId : undefined,
    bodyId: sel.bodyId && ev.bodies.has(sel.bodyId) ? sel.bodyId : undefined,
    lineIds: sel.lineIds.filter((id) => lineIds.has(id)),
    regions: sel.regions.filter((ref) => regionByRef(regions, ref)),
    constraint: sel.constraint && lineIds.has(sel.constraint.lineId) ? sel.constraint : undefined,
  }
}

/** The one place a changed document enters state: evaluates it and records the previous one for undo. */
function withDoc(s: State, doc: Document, opts: PushOptions = {}): State {
  if (doc === s.doc) return s
  const ev = evaluate(doc)
  const pruned = pruneRegionLabels(doc, ev)
  const now = opts.now ?? Date.now()
  const coalesce = opts.key !== undefined && opts.key === s.history.lastKey && s.history.lastAt !== undefined && now - s.history.lastAt < COALESCE_MS
  const past = coalesce ? s.history.past : [...s.history.past, s.doc].slice(-HISTORY_LIMIT)
  return {
    ...s,
    doc: pruned,
    eval: ev,
    lastGood: goodLines(ev, s.lastGood),
    selection: reconcileSelection(s.selection, pruned, ev),
    history: { past, future: [], lastKey: opts.key, lastAt: opts.key !== undefined ? now : undefined },
  }
}

/** After a document swap, drop view state that points at things which no longer exist. */
function reconcile(s: State, doc: Document): State {
  const ev = evaluate(doc)
  const sketchIds = new Set(doc.features.filter((f) => f.kind === 'sketch').map((f) => f.id))
  const mode: Mode = s.mode.kind === 'sketch' && !sketchIds.has(s.mode.sketchId) ? { kind: 'model' } : s.mode
  return { ...s, doc, eval: ev, lastGood: goodLines(ev, s.lastGood), mode, selection: reconcileSelection(s.selection, doc, ev) }
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

/** Resolved lines of a sketch from the current evaluation, or an empty map. */
function resolvedLines(s: State, sketchId: string): ReadonlyMap<string, ResolvedLine> {
  const r = s.eval.results.get(sketchId)
  return r?.kind === 'sketch' ? r.lines : new Map()
}

export function regionsOf(s: State, sketchId: string): readonly SketchRegion[] {
  const r = s.eval.results.get(sketchId)
  return r?.kind === 'sketch' ? r.regions : []
}

export function setTitle(s: State, title: string, now?: number): State {
  return withDoc(s, { ...s.doc, title }, { key: 'title', now })
}

export function addSketch(s: State, plane: PlaneDef, id = newId('s')): State {
  const handles = s.doc.features.filter((f): f is SketchFeature => f.kind === 'sketch').map((f) => f.handle)
  const sketch: SketchFeature = { kind: 'sketch', id, handle: nextHandle('s', handles), name: nextName(s.doc, 'sketch'), plane, lines: [] }
  const next = withDoc(s, { ...s.doc, features: [...s.doc.features, sketch] })
  return { ...next, mode: { kind: 'sketch', sketchId: id }, tool: 'rect', selection: { featureId: id, lineIds: [], regions: [] } }
}

/** Appends an extrude of the given regions, or of every region when none are given, with the spec's default operation and target. */
export function addExtrude(s: State, sketchId: string, regions: readonly RegionRef[], distance: Len, id = newId('e')): State {
  const sketch = sketchOf(s, sketchId)
  if (!sketch) return s
  const refs = regions.length ? regions : regionsOf(s, sketchId).map((r) => r.ref)
  const op = defaultOp(sketch)
  let targetBodyId: string | undefined
  if (op === 'join' && sketch.plane.kind === 'face') {
    const r = s.eval.results.get(sketch.plane.featureId)
    if (r?.kind === 'extrude') targetBodyId = r.bodyId
  }
  if (op !== 'new' && !targetBodyId) targetBodyId = s.selection.bodyId
  const extrude: ExtrudeFeature = { kind: 'extrude', id, name: nextName(s.doc, 'extrude'), sketchId, regions: refs, distance, op, targetBodyId }
  const next = withDoc(s, { ...s.doc, features: [...s.doc.features, extrude] })
  return { ...next, selection: { featureId: id, lineIds: [], regions: [] } }
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

export interface NewLine {
  readonly dir: LineDir
  readonly at: number
  readonly from: number
  readonly to: number
  /** Attach endpoints that land on perpendicular lines, and attach existing plain endpoints that land on this line. Default true. */
  readonly attach?: boolean
  readonly construction?: boolean
}

/** The first perpendicular line whose position equals `coord` and whose run contains `along`. */
function perpendicularAt(lines: readonly SketchLine[], resolved: ReadonlyMap<string, ResolvedLine>, dir: LineDir, coord: number, along: number): SketchLine | undefined {
  return lines.find((l) => {
    if (l.dir === dir) return false
    const r = resolved.get(l.id)
    return r !== undefined && r.at === coord && r.min <= along && along <= r.max
  })
}

/**
 * Adds a line. An endpoint lying on a perpendicular line is stored as a bare reference to that line's
 * position, and a plain-number endpoint of an existing perpendicular line lying on the new one is
 * attached to it, so a chain of drawn lines closes into a rectangle that stays closed when edited.
 */
export function addLine(s: State, sketchId: string, spec: NewLine, id = newId('l')): State {
  const sketch = sketchOf(s, sketchId)
  if (!sketch) return s
  const min = Math.min(spec.from, spec.to)
  const max = Math.max(spec.from, spec.to)
  if (min === max) return s
  const resolved = resolvedLines(s, sketchId)
  const handle = nextHandle('l', sketch.lines.map((l) => l.handle))
  const attach = spec.attach !== false
  const endpoint = (coord: number): Len => {
    const hit = attach ? perpendicularAt(sketch.lines, resolved, spec.dir, coord, spec.at) : undefined
    return hit ? `${hit.handle}.at` : (coord as Sixteenths)
  }
  const line: SketchLine = {
    id,
    handle,
    dir: spec.dir,
    at: spec.at as Sixteenths,
    run: { min: endpoint(min), max: endpoint(max) },
    ...(spec.construction ? { construction: true } : {}),
  }
  const lines = sketch.lines.map((l) => {
    if (!attach || l.dir === spec.dir) return l
    const r = resolved.get(l.id)
    if (!r || r.at < min || r.at > max) return l
    // a plain endpoint sitting exactly on the new line attaches to it
    const run = { ...l.run }
    if (typeof run.min === 'number' && run.min === spec.at) run.min = `${handle}.at`
    if (typeof run.max === 'number' && run.max === spec.at) run.max = `${handle}.at`
    return run.min === l.run.min && run.max === l.run.max ? l : { ...l, run }
  })
  return withDoc(s, mapFeature<SketchFeature>(s.doc, sketchId, (f) => ({ ...f, lines: [...lines, line] })))
}

/** Adds the four attached lines of a rectangle; nothing for a zero width or height. */
export function addRectangle(s: State, sketchId: string, u0: number, u1: number, v0: number, v1: number, ids?: readonly [string, string, string, string]): State {
  const sketch = sketchOf(s, sketchId)
  if (!sketch || u0 === u1 || v0 === v1) return s
  const taken = sketch.lines.map((l) => l.handle)
  const handles: string[] = []
  for (let i = 0; i < 4; i++) handles.push(nextHandle('l', [...taken, ...handles]))
  const lines = rectangleLines(ids ?? [newId('l'), newId('l'), newId('l'), newId('l')], handles as [string, string, string, string], u0, u1, v0, v1)
  return withDoc(s, mapFeature<SketchFeature>(s.doc, sketchId, (f) => ({ ...f, lines: [...f.lines, ...lines] })))
}

export function updateLine(s: State, sketchId: string, line: SketchLine): State {
  return withDoc(s, mapFeature<SketchFeature>(s.doc, sketchId, (f) => ({ ...f, lines: f.lines.map((l) => (l.id === line.id ? line : l)) })))
}

/** Sets a line slot: the position directly, a run slot through the slot rule; a refusal becomes a notice. */
export function setLineSlot(s: State, sketchId: string, lineId: string, slot: LineSlot, value: Len): State {
  const sketch = sketchOf(s, sketchId)
  const line = sketch?.lines.find((l) => l.id === lineId)
  if (!sketch || !line) return s
  if (slot === 'at') return updateLine(s, sketchId, { ...line, at: value })
  const r = setSlot(line.run, slot, value, currentRun(s, lineId))
  if (!r.ok) return notify(s, `${line.handle}: ${r.error}`)
  return updateLine(s, sketchId, { ...line, run: r.slots })
}

function currentRun(s: State, lineId: string) {
  const shape = [...s.eval.results.values()].flatMap((r) => (r.kind === 'sketch' ? [r.lines.get(lineId)] : [])).find((x) => x) ?? s.lastGood.get(lineId)
  if (!shape) return { min: 0, max: 16, size: 16 }
  return { min: shape.min, max: shape.max, size: shape.max - shape.min }
}

export function setConstruction(s: State, sketchId: string, lineIds: readonly string[], construction: boolean): State {
  const ids = new Set(lineIds)
  return withDoc(
    s,
    mapFeature<SketchFeature>(s.doc, sketchId, (f) => ({
      ...f,
      lines: f.lines.map((l) => {
        if (!ids.has(l.id)) return l
        const { construction: _c, ...rest } = l
        return construction ? { ...rest, construction: true } : rest
      }),
    })),
  )
}

export function toggleConstruction(s: State, sketchId: string, lineIds: readonly string[]): State {
  const sketch = sketchOf(s, sketchId)
  if (!sketch || lineIds.length === 0) return s
  const all = lineIds.every((id) => sketch.lines.find((l) => l.id === id)?.construction)
  return setConstruction(s, sketchId, lineIds, !all)
}

/**
 * Sets a region's bounding width or height by moving every line on its far extreme, as numbers. Refused
 * when any of those positions is an expression, so nothing moves halfway.
 */
export function setRegionSize(s: State, sketchId: string, ref: RegionRef, axis: 'u' | 'v', value: number): State {
  const sketch = sketchOf(s, sketchId)
  const region = regionByRef(regionsOf(s, sketchId), ref)
  if (!sketch || !region) return s
  if (value <= 0) return notify(s, 'A region must be wider and taller than zero')
  const far = axis === 'u' ? region.bounds.u1 : region.bounds.v1
  const near = axis === 'u' ? region.bounds.u0 : region.bounds.v0
  const dir: LineDir = axis === 'u' ? 'v' : 'h'
  const ids = new Set(region.boundary.filter((e) => e.dir === dir && e.outward === 1 && e.at === far).map((e) => e.lineId))
  const moving = sketch.lines.filter((l) => ids.has(l.id))
  const fixed = moving.find((l) => isExpr(l.at))
  if (fixed) return notify(s, `${fixed.handle} is fixed by ${fixed.at}; remove that constraint to type a ${axis === 'u' ? 'width' : 'height'}`)
  const at = (near + value) as Sixteenths
  return withDoc(s, mapFeature<SketchFeature>(s.doc, sketchId, (f) => ({ ...f, lines: f.lines.map((l) => (ids.has(l.id) ? { ...l, at } : l)) })))
}

/** Replaces an expression slot with its current resolved number and drops its placement. */
export function removeConstraint(s: State, c: ConstraintRef): State {
  const sketch = sketchOf(s, c.sketchId)
  const line = sketch?.lines.find((l) => l.id === c.lineId)
  if (!sketch || !line) return s
  const value = slotValue(s, c.sketchId, line, c.slot)
  if (value === undefined) return notify(s, `${line.handle}.${c.slot} has no value to keep`)
  const next = c.slot === 'at' ? { ...line, at: value as Sixteenths } : { ...line, run: { ...line.run, [c.slot]: value } }
  const out = updateLine(s, c.sketchId, withLayout(next, c.slot, undefined))
  return { ...out, selection: { ...out.selection, constraint: undefined } }
}

/** Current number for a slot: its evaluated value, or the derived value from the resolved run, or the last good shape. */
function slotValue(s: State, sketchId: string, line: SketchLine, slot: LineSlot): number | undefined {
  const r = s.eval.results.get(sketchId)
  const values = r?.kind === 'sketch' ? r.slotValues.get(line.id) : undefined
  const v = values?.[slot]
  if (v !== undefined) return v
  const shape = (r?.kind === 'sketch' ? r.lines.get(line.id) : undefined) ?? s.lastGood.get(line.id)
  if (!shape) return undefined
  if (slot === 'at') return shape.at
  if (slot === 'size') return shape.max - shape.min
  return shape[slot]
}

function withLayout(line: SketchLine, slot: LineSlot, layout: DimLayout | undefined): SketchLine {
  const all = { ...(line.layout ?? {}) }
  if (layout) all[slot] = layout
  else delete all[slot]
  const { layout: _old, ...rest } = line
  return Object.keys(all).length ? { ...rest, layout: all } : rest
}

/** Stores where a line's dimension is drawn; undefined returns it to automatic placement. */
export function setDimLayout(s: State, sketchId: string, lineId: string, slot: LineSlot, layout: DimLayout | undefined): State {
  const sketch = sketchOf(s, sketchId)
  const line = sketch?.lines.find((l) => l.id === lineId)
  if (!sketch || !line) return s
  return updateLine(s, sketchId, withLayout(line, slot, layout))
}

/** Stores where a region's width or height label is drawn, keyed by the region's corner. */
export function setRegionLabelLayout(s: State, sketchId: string, ref: RegionRef, which: 'width' | 'height', layout: DimLayout | undefined): State {
  const sketch = sketchOf(s, sketchId)
  const region = regionByRef(regionsOf(s, sketchId), ref)
  if (!sketch || !region) return s
  const key = region.key
  const cur = { ...(sketch.regionLabels?.[key] ?? {}) }
  if (layout) cur[which] = layout
  else delete cur[which]
  const all = { ...(sketch.regionLabels ?? {}) }
  if (Object.keys(cur).length) all[key] = cur
  else delete all[key]
  const { regionLabels: _old, ...rest } = sketch
  const next: SketchFeature = Object.keys(all).length ? { ...rest, regionLabels: all } : rest
  return withDoc(s, mapFeature<SketchFeature>(s.doc, sketchId, () => next))
}

/**
 * Removes lines. Every slot that referenced a removed line is frozen to its current number first, so the
 * rest of the sketch keeps its shape; a slot with no value refuses the deletion. Extrudes lose regions
 * named by the lines, and an extrude left with no regions is deleted with its dependents.
 */
export function removeLines(s: State, sketchId: string, lineIds: readonly string[]): State {
  const sketch = sketchOf(s, sketchId)
  if (!sketch || lineIds.length === 0) return s
  const gone = new Set(lineIds)
  const goneHandles = new Set(sketch.lines.filter((l) => gone.has(l.id)).map((l) => l.handle))
  const mentions = (v: Len | undefined): boolean => {
    if (v === undefined || !isExpr(v)) return false
    try {
      return references(parse(v)).some((p) => p.length === 2 && goneHandles.has(p[0]!))
    } catch {
      return false
    }
  }
  const kept: SketchLine[] = []
  for (const l of sketch.lines) {
    if (gone.has(l.id)) continue
    let next = l
    for (const slot of ['at', 'min', 'max', 'size'] as const) {
      const v = slot === 'at' ? l.at : l.run[slot]
      if (!mentions(v)) continue
      const value = slotValue(s, sketchId, l, slot)
      if (value === undefined) return notify(s, `${l.handle}.${slot} depends on a deleted line and has no value to keep`)
      next = slot === 'at' ? { ...next, at: value as Sixteenths } : { ...next, run: { ...next.run, [slot]: value } }
    }
    kept.push(next)
  }
  let doc = mapFeature<SketchFeature>(s.doc, sketchId, (f) => ({ ...f, lines: kept }))
  const emptied: string[] = []
  doc = {
    ...doc,
    features: doc.features.map((f) => {
      if (f.kind !== 'extrude' || f.sketchId !== sketchId) return f
      const rest = f.regions.filter((r) => !gone.has(r.vertical) && !gone.has(r.horizontal))
      if (rest.length === 0) emptied.push(f.id)
      return rest.length === f.regions.length ? f : { ...f, regions: rest }
    }),
  }
  let next = withDoc(s, doc)
  for (const id of emptied) next = deleteFeature(next, id)
  return {
    ...next,
    selection: {
      ...next.selection,
      lineIds: next.selection.lineIds.filter((id) => !gone.has(id)),
      regions: next.selection.regions.filter((r) => !gone.has(r.vertical) && !gone.has(r.horizontal)),
    },
  }
}

/** Deletes selected lines, and for selected regions the lines that bound only those regions. */
export function deleteSelection(s: State, sketchId: string): State {
  const sel = s.selection
  if (sel.constraint) return removeConstraint(s, sel.constraint)
  const regions = regionsOf(s, sketchId)
  const chosen = sel.regions.map((ref) => regionByRef(regions, ref)).filter((r): r is SketchRegion => !!r)
  const chosenKeys = new Set(chosen.map((r) => r.key))
  const ids = new Set(sel.lineIds)
  for (const r of chosen) {
    for (const e of r.boundary) {
      const elsewhere = regions.some((o) => !chosenKeys.has(o.key) && o.boundary.some((b) => b.lineId === e.lineId))
      if (!elsewhere) ids.add(e.lineId)
    }
  }
  return ids.size ? removeLines(s, sketchId, [...ids]) : s
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

export function toggleLine(s: State, lineId: string, additive: boolean): State {
  const cur = s.selection.lineIds
  const has = cur.includes(lineId)
  const lineIds = additive ? (has ? cur.filter((x) => x !== lineId) : [...cur, lineId]) : [lineId]
  return { ...s, selection: { ...s.selection, lineIds, regions: additive ? s.selection.regions : [], constraint: undefined } }
}

export function toggleRegion(s: State, ref: RegionRef, additive: boolean): State {
  const cur = s.selection.regions
  const has = cur.some((r) => sameRegion(r, ref))
  const regions = additive ? (has ? cur.filter((r) => !sameRegion(r, ref)) : [...cur, ref]) : [ref]
  return { ...s, selection: { ...s.selection, regions, lineIds: additive ? s.selection.lineIds : [], constraint: undefined } }
}

export function selectLines(s: State, sketchId: string, lineIds: readonly string[]): State {
  return { ...s, selection: { featureId: sketchId, lineIds, regions: [], constraint: undefined } }
}

export function selectRegions(s: State, sketchId: string, regions: readonly RegionRef[]): State {
  return { ...s, selection: { featureId: sketchId, lineIds: [], regions, constraint: undefined } }
}

export function setMode(s: State, mode: Mode): State {
  const tool: Tool = mode.kind === 'sketch' ? s.tool : 'select'
  const selection = mode.kind === 'sketch' ? { featureId: mode.sketchId, lineIds: [], regions: [] } : s.selection
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

/** Loads a whole file, restoring the camera and reopening the stored sketch if it still exists. */
export function loadFile(s: State, file: DocumentFile): State {
  const next = { ...initialState(file.model, { camera: file.view.camera }), notices: s.notices, theme: s.theme }
  const id = file.view.sketchId
  if (id && file.model.features.some((f) => f.kind === 'sketch' && f.id === id)) return setMode(next, { kind: 'sketch', sketchId: id })
  return next
}

/** Refusals and failures default to a persistent warning; file and storage failures pass danger. */
export function notify(s: State, text: string, tone: NoticeTone = 'warning'): State {
  if (s.notices.some((n) => n.text === text)) return s
  return { ...s, notices: [...s.notices, { text, tone }] }
}

export function dismissNotice(s: State, text: string): State {
  return { ...s, notices: s.notices.filter((n) => n.text !== text) }
}

export { regionKey }
export type { Slot }
