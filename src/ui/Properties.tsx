import { FRAMES } from '../core/model/planes'
import type { ExtrudeFeature, Len, SketchFeature, SketchRect, Slot } from '../core/model/types'
import { isExpr } from '../core/model/types'
import { type Sixteenths, formatLength } from '../core/units'
import { LenField } from './LenField'
import { Parameters } from './Parameters'
import { useStore } from './store/store'

export function Properties() {
  const doc = useStore((s) => s.doc)
  const selection = useStore((s) => s.selection)
  const feature = doc.features.find((f) => f.id === selection.featureId)
  if (!feature) return <DocumentProperties />
  return feature.kind === 'sketch' ? <SketchProperties sketch={feature} /> : <ExtrudeProperties extrude={feature} />
}

function DocumentProperties() {
  const title = useStore((s) => s.doc.title)
  const dispatch = useStore((s) => s.dispatch)
  return (
    <div>
      <h3>Document</h3>
      <label className="field">
        <span>Title</span>
        <input value={title} onChange={(e) => dispatch('setTitle', e.target.value)} />
      </label>
      <Parameters />
      <div className="muted">Select a feature in the timeline or a body in the view to edit it.</div>
    </div>
  )
}

function NameField({ id, name }: { id: string; name: string }) {
  const dispatch = useStore((s) => s.dispatch)
  return (
    <label className="field">
      <span>Name</span>
      <input value={name} onChange={(e) => dispatch('renameFeature', id, e.target.value)} />
    </label>
  )
}

function SketchProperties({ sketch }: { sketch: SketchFeature }) {
  const ev = useStore((s) => s.eval)
  const selection = useStore((s) => s.selection)
  const mode = useStore((s) => s.mode)
  const dispatch = useStore((s) => s.dispatch)
  const r = ev.results.get(sketch.id)
  const plane = r?.kind === 'sketch' ? r.plane : null
  const single = selection.rectIds.length === 1 ? sketch.rects.find((x) => x.id === selection.rectIds[0]) : undefined
  return (
    <div>
      <h3>
        Sketch <span className="muted">{sketch.handle}</span>
      </h3>
      <NameField id={sketch.id} name={sketch.name} />
      <div className="field">
        <span>Plane</span>
        {sketch.plane.kind === 'principal' ? (
          <div>
            {sketch.plane.plane}, normal {sketch.plane.normal > 0 ? '+' : '-'}
            {FRAMES[sketch.plane.plane].n.toUpperCase()}
          </div>
        ) : (
          <div>
            {sketch.plane.face} face of {featureName(sketch.plane.featureId)}
            {plane && (
              <span className="muted">
                {' '}
                ({plane.plane} at {formatLength(plane.offset)})
              </span>
            )}
          </div>
        )}
      </div>
      {sketch.plane.kind === 'principal' && (
        <LenField
          label="Offset"
          value={sketch.plane.offset}
          resolved={plane?.offset}
          error={r?.kind === 'error' && isExpr(sketch.plane.offset) ? r.message : undefined}
          onCommit={(v) => dispatch('setSketchPlaneOffset', sketch.id, v)}
        />
      )}
      {r?.kind === 'error' && <div className="field error">{r.message}</div>}
      {mode.kind !== 'sketch' && <button onClick={() => dispatch('setMode', { kind: 'sketch', sketchId: sketch.id })}>Edit sketch</button>}
      <h3>Rectangles</h3>
      <div className="rect-list">
        {sketch.rects.length === 0 && <div className="muted">None yet. Use the rectangle tool.</div>}
        {sketch.rects.map((rect) => {
          const res = r?.kind === 'sketch' ? r.rects.get(rect.id) : undefined
          const err = r?.kind === 'sketch' ? r.rectErrors.get(rect.id) : undefined
          return (
            <div key={rect.id} className={`item ${selection.rectIds.includes(rect.id) ? 'selected' : ''} ${err ? 'error' : ''}`} onClick={(e) => dispatch('toggleRect', rect.id, e.shiftKey)}>
              <span className="handle">{rect.handle}</span>
              {res
                ? `${formatLength((res.u1 - res.u0) as Sixteenths)} x ${formatLength((res.v1 - res.v0) as Sixteenths)} at (${formatLength(res.u0 as Sixteenths)}, ${formatLength(res.v0 as Sixteenths)})`
                : (err ?? 'unresolved')}
            </div>
          )
        })}
      </div>
      {single && <RectProperties sketch={sketch} rect={single} />}
    </div>
  )
}

function featureName(id: string): string {
  const f = useStore.getState().doc.features.find((x) => x.id === id)
  return f?.name ?? id
}

const SLOT_LABEL: Record<'u' | 'v', Record<Slot, string>> = {
  u: { min: 'Left', max: 'Right', size: 'Width' },
  v: { min: 'Bottom', max: 'Top', size: 'Height' },
}

function RectProperties({ sketch, rect }: { sketch: SketchFeature; rect: SketchRect }) {
  const ev = useStore((s) => s.eval)
  const dispatch = useStore((s) => s.dispatch)
  const r = ev.results.get(sketch.id)
  const resolved = r?.kind === 'sketch' ? r.rects.get(rect.id) : undefined
  const slotValues = r?.kind === 'sketch' ? r.slotValues.get(rect.id) : undefined
  const err = r?.kind === 'sketch' ? r.rectErrors.get(rect.id) : undefined
  const axisFields = (axis: 'u' | 'v') => {
    const slots = rect[axis]
    const ax = resolved ? (axis === 'u' ? resolved.uAxis : resolved.vAxis) : undefined
    return (['min', 'max', 'size'] as const).map((slot) => {
      const driven = slots[slot] !== undefined
      const value: Len = driven ? (slots[slot] as Len) : ((ax?.[slot] ?? 0) as Sixteenths)
      const evaluated = driven && isExpr(value) ? slotValues?.[axis]?.[slot] : undefined
      return (
        <LenField
          key={`${axis}-${slot}`}
          label={SLOT_LABEL[axis][slot]}
          value={value}
          derived={!driven}
          resolved={evaluated}
          error={driven && isExpr(value) && err ? err : undefined}
          onCommit={(v) => dispatch('setRectSlot', sketch.id, rect.id, axis, slot, v)}
        />
      )
    })
  }
  return (
    <div>
      <h3>
        Rectangle <span className="muted">{rect.handle}</span>
      </h3>
      {err && <div className="field error">{err}</div>}
      <div className="muted small">Two values per axis drive it; the third is derived. Expressions may use {'{'}r1.right, face.left, ply{'}'} and + - * /.</div>
      <div className="row">{axisFields('u')}</div>
      <div className="row">{axisFields('v')}</div>
      <button className="danger" onClick={() => dispatch('removeRects', sketch.id, [rect.id])}>
        Delete rectangle
      </button>
    </div>
  )
}

/** Splits a stored distance into a positive magnitude and a direction; expressions are wrapped as -(expr) when against the normal. */
export function splitDistance(d: Len): { magnitude: Len; against: boolean } {
  if (!isExpr(d)) return { magnitude: Math.abs(d) as Sixteenths, against: d < 0 }
  const m = /^-\((.*)\)$/.exec(d.trim())
  return m ? { magnitude: m[1]!, against: true } : { magnitude: d, against: false }
}

export function joinDistance(magnitude: Len, against: boolean): Len {
  if (!isExpr(magnitude)) return (against ? -Math.abs(magnitude) : Math.abs(magnitude)) as Sixteenths
  return against ? `-(${magnitude})` : magnitude
}

function ExtrudeProperties({ extrude }: { extrude: ExtrudeFeature }) {
  const ev = useStore((s) => s.eval)
  const features = useStore((s) => s.doc.features)
  const dispatch = useStore((s) => s.dispatch)
  const r = ev.results.get(extrude.id)
  const sketch = features.find((f) => f.id === extrude.sketchId)
  const idx = features.findIndex((f) => f.id === extrude.id)
  const bodies = features.slice(0, idx).filter((f): f is ExtrudeFeature => f.kind === 'extrude' && f.op === 'new')
  const { magnitude, against } = splitDistance(extrude.distance)
  return (
    <div>
      <h3>Extrude</h3>
      <NameField id={extrude.id} name={extrude.name} />
      <div className="field">
        <span>From</span>
        <div>
          {sketch?.name ?? extrude.sketchId}, {extrude.rectIds.length} rect{extrude.rectIds.length === 1 ? '' : 's'}
        </div>
      </div>
      <LenField
        label="Distance"
        value={magnitude}
        resolved={r?.kind === 'extrude' ? Math.abs(r.distance) : undefined}
        error={r?.kind === 'error' && /^Distance:/.test(r.message) ? r.message : undefined}
        autoFocus
        allowZero={false}
        onCommit={(v) => dispatch('updateExtrude', extrude.id, { distance: joinDistance(v, against) })}
      />
      <label className="field">
        <span>Direction</span>
        <select value={against ? 'against' : 'along'} onChange={(e) => dispatch('updateExtrude', extrude.id, { distance: joinDistance(magnitude, e.target.value === 'against') })}>
          <option value="along">Along the plane normal (out of the face)</option>
          <option value="against">Against the normal (into the face)</option>
        </select>
      </label>
      <label className="field">
        <span>Operation</span>
        <select value={extrude.op} onChange={(e) => dispatch('updateExtrude', extrude.id, { op: e.target.value as ExtrudeFeature['op'] })}>
          <option value="new">New body</option>
          <option value="join">Join</option>
          <option value="cut">Cut</option>
        </select>
      </label>
      {extrude.op !== 'new' && (
        <label className="field">
          <span>Target body</span>
          <select value={extrude.targetBodyId ?? ''} onChange={(e) => dispatch('updateExtrude', extrude.id, { targetBodyId: e.target.value || undefined })}>
            <option value="">Choose a body</option>
            {bodies.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </label>
      )}
      {r?.kind === 'error' && !/^Distance:/.test(r.message) && <div className="field error">{r.message}</div>}
    </div>
  )
}
