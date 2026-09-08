import { FRAMES } from '../core/model/planes'
import { normRect, setRectHeight, setRectLowerLeft, setRectWidth } from '../core/model/sketch'
import type { ExtrudeFeature, SketchFeature } from '../core/model/types'
import { type Sixteenths, formatLength, sx } from '../core/units'
import { LengthField } from './LengthField'
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
      <h3>Sketch</h3>
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
            {sketch.plane.face} face of {doc(sketch.plane.featureId)}
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
        <LengthField label="Offset" value={sketch.plane.offset} onCommit={(v) => dispatch('setSketchPlaneOffset', sketch.id, v)} />
      )}
      {r?.kind === 'error' && <div className="field error">{r.message}</div>}
      {mode.kind !== 'sketch' && (
        <button onClick={() => dispatch('setMode', { kind: 'sketch', sketchId: sketch.id })}>Edit sketch</button>
      )}
      <h3>Rectangles</h3>
      <div className="rect-list">
        {sketch.rects.length === 0 && <div className="muted">None yet. Use the rectangle tool.</div>}
        {sketch.rects.map((rect) => {
          const n = normRect(rect)
          return (
            <div
              key={rect.id}
              className={`item ${selection.rectIds.includes(rect.id) ? 'selected' : ''}`}
              onClick={(e) => dispatch('toggleRect', rect.id, e.shiftKey)}
            >
              {formatLength(sx(n.u1 - n.u0))} x {formatLength(sx(n.v1 - n.v0))} at ({formatLength(sx(n.u0))}, {formatLength(sx(n.v0))})
            </div>
          )
        })}
      </div>
      {single && <RectProperties sketchId={sketch.id} rect={single} />}
    </div>
  )
}

function doc(id: string): string {
  const f = useStore.getState().doc.features.find((x) => x.id === id)
  return f?.name ?? id
}

function RectProperties({ sketchId, rect }: { sketchId: string; rect: SketchFeature['rects'][number] }) {
  const dispatch = useStore((s) => s.dispatch)
  const n = normRect(rect)
  return (
    <div>
      <h3>Rectangle</h3>
      <div className="row">
        <LengthField label="Left (u)" value={sx(n.u0)} onCommit={(u) => dispatch('updateRect', sketchId, setRectLowerLeft(rect, u, sx(n.v0)))} />
        <LengthField label="Bottom (v)" value={sx(n.v0)} onCommit={(v) => dispatch('updateRect', sketchId, setRectLowerLeft(rect, sx(n.u0), v))} />
      </div>
      <div className="row">
        <LengthField label="Width" value={sx(n.u1 - n.u0)} onCommit={(w) => w > 0 && dispatch('updateRect', sketchId, setRectWidth(rect, w))} />
        <LengthField label="Height" value={sx(n.v1 - n.v0)} onCommit={(h) => h > 0 && dispatch('updateRect', sketchId, setRectHeight(rect, h))} />
      </div>
      <button className="danger" onClick={() => dispatch('removeRects', sketchId, [rect.id])}>
        Delete rectangle
      </button>
    </div>
  )
}

function ExtrudeProperties({ extrude }: { extrude: ExtrudeFeature }) {
  const ev = useStore((s) => s.eval)
  const features = useStore((s) => s.doc.features)
  const dispatch = useStore((s) => s.dispatch)
  const r = ev.results.get(extrude.id)
  const sketch = features.find((f) => f.id === extrude.sketchId)
  // bodies that exist before this extrude: created by earlier extrudes with op new
  const idx = features.findIndex((f) => f.id === extrude.id)
  const bodies = features
    .slice(0, idx)
    .filter((f): f is ExtrudeFeature => f.kind === 'extrude' && f.op === 'new')
  const sign = Math.sign(extrude.distance) || 1
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
      <LengthField
        label="Distance"
        value={Math.abs(extrude.distance) as Sixteenths}
        autoFocus
        onCommit={(d) => d > 0 && dispatch('updateExtrude', extrude.id, { distance: (sign * d) as Sixteenths })}
      />
      <label className="field">
        <span>Direction</span>
        <select
          value={sign > 0 ? 'along' : 'against'}
          onChange={(e) =>
            dispatch('updateExtrude', extrude.id, {
              distance: ((e.target.value === 'along' ? 1 : -1) * Math.abs(extrude.distance)) as Sixteenths,
            })
          }
        >
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
      {r?.kind === 'error' && <div className="field error">{r.message}</div>}
    </div>
  )
}
