import { Button, Disclosure, Field, Fields, Hint, IconButton, ListBox, ListBoxItem, Row, Select, SelectItem, TextField } from '@drawing/kit'
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
      <h3 className="section-title">Document</h3>
      <Fields>
        <TextField label="Title" value={title} onCommit={(_v, t) => dispatch('setTitle', t)} />
      </Fields>
      <Parameters />
      <Hint>Select a feature in the timeline or a body in the view to edit it.</Hint>
    </div>
  )
}

function NameField({ id, name }: { id: string; name: string }) {
  const dispatch = useStore((s) => s.dispatch)
  return <TextField label="Name" value={name} onCommit={(_v, t) => dispatch('renameFeature', id, t)} />
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
      <h3 className="section-title">
        Sketch <span className="handle">{sketch.handle}</span>
      </h3>
      <Fields>
        <NameField id={sketch.id} name={sketch.name} />
        <Field label="Plane">
          {sketch.plane.kind === 'principal'
            ? `${sketch.plane.plane}, normal ${sketch.plane.normal > 0 ? '+' : '-'}${FRAMES[sketch.plane.plane].n.toUpperCase()}`
            : `${sketch.plane.face} face of ${featureName(sketch.plane.featureId)}${plane ? ` (${plane.plane} at ${formatLength(plane.offset)})` : ''}`}
        </Field>
        {sketch.plane.kind === 'principal' && (
          <LenField
            label="Offset"
            value={sketch.plane.offset}
            resolved={plane?.offset}
            error={r?.kind === 'error' && isExpr(sketch.plane.offset) ? r.message : undefined}
            onCommit={(v) => dispatch('setSketchPlaneOffset', sketch.id, v)}
          />
        )}
        {r?.kind === 'error' && <Field error={r.message}>{null}</Field>}
        {mode.kind !== 'sketch' && <Button onPress={() => dispatch('setMode', { kind: 'sketch', sketchId: sketch.id })}>Edit sketch</Button>}
      </Fields>
      <Disclosure title="Rectangles" trailing={String(sketch.rects.length)}>
        {sketch.rects.length === 0 && <Hint>None yet. Use the rectangle tool.</Hint>}
        <ListBox
          aria-label="Rectangles"
          dense
          selectionMode="multiple"
          selectedKeys={selection.rectIds}
          onSelectionChange={(keys) => dispatch('selectRects', sketch.id, keys === 'all' ? sketch.rects.map((x) => x.id) : ([...keys] as string[]))}
        >
          {sketch.rects.map((rect) => {
            const res = r?.kind === 'sketch' ? r.rects.get(rect.id) : undefined
            const err = r?.kind === 'sketch' ? r.rectErrors.get(rect.id) : undefined
            return (
              <ListBoxItem
                key={rect.id}
                id={rect.id}
                textValue={rect.handle}
                tone={err ? 'error' : 'neutral'}
                detail={res ? `${formatLength((res.u1 - res.u0) as Sixteenths)} x ${formatLength((res.v1 - res.v0) as Sixteenths)} at (${formatLength(res.u0 as Sixteenths)}, ${formatLength(res.v0 as Sixteenths)})` : (err ?? 'unresolved')}
              >
                {rect.handle}
              </ListBoxItem>
            )
          })}
        </ListBox>
      </Disclosure>
      {single && <RectProperties sketch={sketch} rect={single} />}
      <ConstraintList sketch={sketch} />
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
const SIDE: Record<'u' | 'v', Record<Slot, string>> = {
  u: { min: 'left', max: 'right', size: 'width' },
  v: { min: 'bottom', max: 'top', size: 'height' },
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
    <Disclosure title={`Rectangle ${rect.handle}`}>
      <Fields>
        {err && <Field error={err}>{null}</Field>}
        <Hint>Two values per axis drive it; the third is derived. Expressions may use r1.right, face.left, ply and + - * /.</Hint>
        <Row>{axisFields('u')}</Row>
        <Row>{axisFields('v')}</Row>
        <div>
          <Button tone="danger" onPress={() => dispatch('removeRects', sketch.id, [rect.id])}>
            Delete rectangle
          </Button>
        </div>
      </Fields>
    </Disclosure>
  )
}

/** Every expression-driven slot in the sketch, selectable and removable. */
function ConstraintList({ sketch }: { sketch: SketchFeature }) {
  const ev = useStore((s) => s.eval)
  const selected = useStore((s) => s.selection.constraint)
  const dispatch = useStore((s) => s.dispatch)
  const r = ev.results.get(sketch.id)
  const entries = sketch.rects.flatMap((rect) =>
    (['u', 'v'] as const).flatMap((axis) =>
      (['min', 'max', 'size'] as const).flatMap((slot) => {
        const v = rect[axis][slot]
        if (v === undefined || !isExpr(v)) return []
        const value = r?.kind === 'sketch' ? r.slotValues.get(rect.id)?.[axis]?.[slot] : undefined
        const error = r?.kind === 'sketch' && value === undefined ? r.rectErrors.get(rect.id) : undefined
        return [{ key: `${rect.id}:${axis}:${slot}`, rect, axis, slot, expr: v, value, error }]
      }),
    ),
  )
  if (entries.length === 0) return null
  const selectedKey = selected ? `${selected.rectId}:${selected.axis}:${selected.slot}` : undefined
  return (
    <Disclosure title="Constraints" trailing={String(entries.length)}>
      <ListBox
        aria-label="Constraints"
        dense
        selectionMode="single"
        actionSlots={1}
        selectedKeys={selectedKey ? [selectedKey] : []}
        onSelectionChange={(keys) => {
          const k = keys === 'all' ? undefined : ([...keys][0] as string | undefined)
          const e = entries.find((x) => x.key === k)
          dispatch('selectConstraint', e ? { sketchId: sketch.id, rectId: e.rect.id, axis: e.axis, slot: e.slot } : undefined)
        }}
      >
        {entries.map((e) => (
          <ListBoxItem
            key={e.key}
            id={e.key}
            textValue={`${e.rect.handle}.${SIDE[e.axis][e.slot]} = ${e.expr}`}
            tone={e.error ? 'error' : 'neutral'}
            detail={e.error ?? (e.value !== undefined ? formatLength(e.value as Sixteenths) : '')}
            actions={
              <IconButton
                icon="close"
                size="sm"
                tone="danger"
                aria-label="Remove"
                onPress={() => dispatch('removeConstraint', { sketchId: sketch.id, rectId: e.rect.id, axis: e.axis, slot: e.slot })}
              />
            }
          >
            <span className="mono">
              {e.rect.handle}.{SIDE[e.axis][e.slot]} = {e.expr}
            </span>
          </ListBoxItem>
        ))}
      </ListBox>
    </Disclosure>
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
  const distanceError = r?.kind === 'error' && /^Distance:/.test(r.message) ? r.message : undefined
  return (
    <div>
      <h3 className="section-title">Extrude</h3>
      <Fields>
        <NameField id={extrude.id} name={extrude.name} />
        <Field label="From">
          {sketch?.name ?? extrude.sketchId}, {extrude.rectIds.length} rect{extrude.rectIds.length === 1 ? '' : 's'}
        </Field>
        <LenField
          label="Distance"
          value={magnitude}
          resolved={r?.kind === 'extrude' ? Math.abs(r.distance) : undefined}
          error={distanceError}
          autoFocus
          allowZero={false}
          onCommit={(v) => dispatch('updateExtrude', extrude.id, { distance: joinDistance(v, against) })}
        />
        <Select label="Direction" selectedKey={against ? 'against' : 'along'} onSelectionChange={(k) => dispatch('updateExtrude', extrude.id, { distance: joinDistance(magnitude, k === 'against') })}>
          <SelectItem id="along">Along the plane normal (out of the face)</SelectItem>
          <SelectItem id="against">Against the normal (into the face)</SelectItem>
        </Select>
        <Select
          label="Operation"
          selectedKey={extrude.op}
          onSelectionChange={(k) => {
            const op = k as ExtrudeFeature['op']
            // switching to join or cut without a target would only show an error; start with the newest body
            const targetBodyId = op !== 'new' && !extrude.targetBodyId ? bodies.at(-1)?.id : extrude.targetBodyId
            dispatch('updateExtrude', extrude.id, { op, targetBodyId })
          }}
        >
          <SelectItem id="new">New body</SelectItem>
          <SelectItem id="join">Join</SelectItem>
          <SelectItem id="cut">Cut</SelectItem>
        </Select>
        {extrude.op !== 'new' && (
          <Row>
            <Select
              label="Target body"
              placeholder="Choose a body"
              selectedKey={extrude.targetBodyId ?? null}
              onSelectionChange={(k) => dispatch('updateExtrude', extrude.id, { targetBodyId: k ? String(k) : undefined })}
            >
              {bodies.map((b) => (
                <SelectItem key={b.id} id={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </Select>
            <Field label=" ">
              <Button onPress={() => dispatch('setMode', { kind: 'pickBody', extrudeId: extrude.id })}>Pick in view</Button>
            </Field>
          </Row>
        )}
        {r?.kind === 'error' && !distanceError && <Field error={r.message}>{null}</Field>}
      </Fields>
    </div>
  )
}
