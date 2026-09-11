import { Button, Checkbox, Disclosure, Field, Fields, Hint, IconButton, ListBox, ListBoxItem, Row, Select, SelectItem, TextField } from '@bitmachina/drafter-kit'
import { FRAMES } from '../core/model/planes'
import type { ExtrudeFeature, Len, LineDir, LineSlot, SketchFeature, SketchLine, SketchRect, Slot } from '../core/model/types'
import { isExpr, regionKey, sameRegion } from '../core/model/types'
import { regionIsRectangle } from '../core/geom/regions'
import { isAttachment } from './sketch/Dimensions'
import { type Sixteenths, formatLength } from '../core/units'
import { LenField } from './LenField'
import { KeyBindings } from './KeyBindings'
import { Parameters } from './Parameters'
import type { RectSlot } from './store/actions'
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
      <KeyBindings />
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
  const regions = r?.kind === 'sketch' ? r.regions : []
  const single = selection.lineIds.length === 1 ? sketch.lines.find((x) => x.id === selection.lineIds[0]) : undefined
  const selectedRegionKeys = selection.regions.map(regionKey)
  const lineAt = (id: string) => (r?.kind === 'sketch' ? r.lines.get(id)?.at : undefined)
  // one selected region that is exactly a rectangle's area shows that rectangle's form, as a click inside it always did
  const selectedRegion = selection.regions.length === 1 ? regions.find((x) => sameRegion(x.ref, selection.regions[0]!)) : undefined
  const selectedRect = selectedRegion ? sketch.rects.find((rect) => regionIsRectangle(selectedRegion, rect.lines, lineAt)) : undefined
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
      <Disclosure title="Shapes" trailing={String(regions.length)}>
        {regions.length === 0 && <Hint>None yet. Close an outline with lines or draw a rectangle.</Hint>}
        <ListBox
          aria-label="Shapes"
          dense
          selectionMode="multiple"
          selectedKeys={selectedRegionKeys}
          onSelectionChange={(keys) => {
            const chosen = keys === 'all' ? regions.map((x) => x.key) : ([...keys] as string[])
            dispatch('selectRegions', sketch.id, regions.filter((x) => chosen.includes(x.key)).map((x) => x.ref))
          }}
        >
          {regions.map((region) => {
            const b = region.bounds
            const size = `${formatLength((b.u1 - b.u0) as Sixteenths)} x ${formatLength((b.v1 - b.v0) as Sixteenths)}`
            const kind = sketch.rects.find((rect) => regionIsRectangle(region, rect.lines, lineAt))?.handle ?? 'Region'
            // in sketch order, so a rectangle reads l1 l2 l3 l4
            const bounding = sketch.lines.filter((l) => region.boundary.some((e) => e.lineId === l.id)).map((l) => l.handle).join(' ')
            return (
              <ListBoxItem key={region.key} id={region.key} textValue={`${kind} ${size}`} detail={`at (${formatLength(b.u0 as Sixteenths)}, ${formatLength(b.v0 as Sixteenths)}), lines ${bounding}`}>
                {kind} {size}
              </ListBoxItem>
            )
          })}
        </ListBox>
      </Disclosure>
      <Disclosure title="Lines" trailing={String(sketch.lines.length)} defaultExpanded={false}>
        {sketch.lines.length === 0 && <Hint>None yet. Use the line or rectangle tool.</Hint>}
        <ListBox
          aria-label="Lines"
          dense
          selectionMode="multiple"
          selectedKeys={selection.lineIds}
          onSelectionChange={(keys) => dispatch('selectLines', sketch.id, keys === 'all' ? sketch.lines.map((x) => x.id) : ([...keys] as string[]))}
        >
          {sketch.lines.map((line) => {
            const res = r?.kind === 'sketch' ? r.lines.get(line.id) : undefined
            const err = r?.kind === 'sketch' ? r.lineErrors.get(line.id) : undefined
            const dir = line.dir === 'h' ? 'horizontal' : 'vertical'
            return (
              <ListBoxItem
                key={line.id}
                id={line.id}
                textValue={line.handle}
                tone={err ? 'error' : 'neutral'}
                detail={
                  res
                    ? `${dir}${line.construction ? ', construction' : ''} at ${formatLength(res.at as Sixteenths)}, ${formatLength(res.min as Sixteenths)} to ${formatLength(res.max as Sixteenths)}`
                    : (err ?? 'unresolved')
                }
              >
                {line.handle}
              </ListBoxItem>
            )
          })}
        </ListBox>
      </Disclosure>
      {selection.lineIds.length === 4 && (
        <Fields>
          <div>
            <Button onPress={() => dispatch('groupRectangle', sketch.id, selection.lineIds)}>Make rectangle</Button>
          </div>
        </Fields>
      )}
      {single && <RectangleProperties sketch={sketch} line={single} />}
      {!single && selectedRect && <RectangleProperties sketch={sketch} rect={selectedRect} />}
      {single && <LineProperties sketch={sketch} line={single} />}
      <ConstraintList sketch={sketch} />
    </div>
  )
}

function featureName(id: string): string {
  const f = useStore.getState().doc.features.find((x) => x.id === id)
  return f?.name ?? id
}

const SIDE_NAME = ['Left', 'Bottom', 'Right', 'Top'] as const
const SIDE_SLOT: readonly RectSlot[] = ['left', 'bottom', 'right', 'top']

/** The form of a rectangle, reached from a selected member line or from its selected region; every field writes to a member line. */
function RectangleProperties({ sketch, line, rect: given }: { sketch: SketchFeature; line?: SketchLine; rect?: SketchRect }) {
  const ev = useStore((s) => s.eval)
  const dispatch = useStore((s) => s.dispatch)
  const rect = given ?? sketch.rects.find((r) => line !== undefined && r.lines.includes(line.id))
  if (!rect) return null
  const r = ev.results.get(sketch.id)
  const resolved = r?.kind === 'sketch' ? r.lines : undefined
  const members = rect.lines.map((id) => sketch.lines.find((l) => l.id === id))
  const at = (i: number) => resolved?.get(rect.lines[i]!)?.at
  const side = line ? rect.lines.indexOf(line.id) : -1
  const sideField = (i: number) => {
    const m = members[i]
    if (!m) return null
    const err = r?.kind === 'sketch' ? r.lineErrors.get(m.id) : undefined
    return (
      <LenField
        key={SIDE_SLOT[i]}
        label={i === side ? `${SIDE_NAME[i]} (this line)` : SIDE_NAME[i]!}
        value={m.at}
        resolved={isExpr(m.at) ? at(i) : undefined}
        error={isExpr(m.at) && err ? err : undefined}
        onCommit={(v) => dispatch('setRectSlot', sketch.id, rect.id, SIDE_SLOT[i]!, v)}
      />
    )
  }
  const width = at(2) !== undefined && at(0) !== undefined ? ((at(2)! - at(0)!) as Sixteenths) : (0 as Sixteenths)
  const height = at(3) !== undefined && at(1) !== undefined ? ((at(3)! - at(1)!) as Sixteenths) : (0 as Sixteenths)
  return (
    <Disclosure title={`Rectangle ${rect.handle}`}>
      <Fields>
        <Hint>Sides move that line. Width and Height move the right and top lines; both accept expressions.</Hint>
        <Row>
          {sideField(0)}
          {sideField(2)}
          <LenField label="Width" value={width} derived onCommit={(v) => dispatch('setRectSlot', sketch.id, rect.id, 'width', v)} />
        </Row>
        <Row>
          {sideField(1)}
          {sideField(3)}
          <LenField label="Height" value={height} derived onCommit={(v) => dispatch('setRectSlot', sketch.id, rect.id, 'height', v)} />
        </Row>
        <div>
          <Button onPress={() => dispatch('explodeRectangle', sketch.id, rect.id)}>Explode</Button>
        </div>
      </Fields>
    </Disclosure>
  )
}

const RUN_LABEL: Record<LineDir, Record<Slot, string>> = {
  h: { min: 'Left', max: 'Right', size: 'Length' },
  v: { min: 'Bottom', max: 'Top', size: 'Length' },
}
const SLOT_NAME: Record<LineDir, Record<LineSlot, string>> = {
  h: { at: 'at', min: 'left', max: 'right', size: 'length' },
  v: { at: 'at', min: 'bottom', max: 'top', size: 'length' },
}

function LineProperties({ sketch, line }: { sketch: SketchFeature; line: SketchLine }) {
  const ev = useStore((s) => s.eval)
  const dispatch = useStore((s) => s.dispatch)
  const r = ev.results.get(sketch.id)
  const resolved = r?.kind === 'sketch' ? r.lines.get(line.id) : undefined
  const slotValues = r?.kind === 'sketch' ? r.slotValues.get(line.id) : undefined
  const err = r?.kind === 'sketch' ? r.lineErrors.get(line.id) : undefined
  const runFields = (['min', 'max', 'size'] as const).map((slot) => {
    const driven = line.run[slot] !== undefined
    const fallback = resolved ? (slot === 'size' ? resolved.size : resolved[slot]) : 0
    const value: Len = driven ? (line.run[slot] as Len) : (fallback as Sixteenths)
    const evaluated = driven && isExpr(value) ? slotValues?.[slot] : undefined
    return (
      <LenField
        key={slot}
        label={RUN_LABEL[line.dir][slot]}
        value={value}
        derived={!driven}
        resolved={evaluated}
        error={driven && isExpr(value) && err ? err : undefined}
        onCommit={(v) => dispatch('setLineSlot', sketch.id, line.id, slot, v)}
      />
    )
  })
  return (
    <Disclosure title={`Line ${line.handle}`}>
      <Fields>
        {err && <Field error={err}>{null}</Field>}
        <Field label="Direction">{line.dir === 'h' ? 'Horizontal' : 'Vertical'}</Field>
        <LenField
          label={line.dir === 'h' ? 'Position (v)' : 'Position (u)'}
          value={line.at}
          resolved={isExpr(line.at) ? slotValues?.at : undefined}
          error={isExpr(line.at) && err ? err : undefined}
          onCommit={(v) => dispatch('setLineSlot', sketch.id, line.id, 'at', v)}
        />
        <Hint>Two of the run values drive the line; the third is derived. Expressions may use l1.at, l2.right, face.left, ply and + - * /.</Hint>
        <Row>{runFields}</Row>
        <Checkbox isSelected={!!line.construction} onChange={(on) => dispatch('setConstruction', sketch.id, [line.id], on)}>
          Construction
        </Checkbox>
        <div>
          <Button tone="danger" onPress={() => dispatch('removeLines', sketch.id, [line.id])}>
            Delete line
          </Button>
        </div>
      </Fields>
    </Disclosure>
  )
}

/** Every expression-driven slot in the sketch other than endpoint attachments, selectable and removable. */
function ConstraintList({ sketch }: { sketch: SketchFeature }) {
  const ev = useStore((s) => s.eval)
  const selected = useStore((s) => s.selection.constraint)
  const dispatch = useStore((s) => s.dispatch)
  const r = ev.results.get(sketch.id)
  const entries = sketch.lines.flatMap((line) =>
    (['at', 'min', 'max', 'size'] as const).flatMap((slot) => {
      const v = slot === 'at' ? line.at : line.run[slot]
      if (v === undefined || !isExpr(v) || isAttachment(sketch, line, slot)) return []
      const value = r?.kind === 'sketch' ? r.slotValues.get(line.id)?.[slot] : undefined
      const error = r?.kind === 'sketch' && value === undefined ? r.lineErrors.get(line.id) : undefined
      return [{ key: `${line.id}:${slot}`, line, slot, expr: v, value, error }]
    }),
  )
  if (entries.length === 0) return null
  const selectedKey = selected ? `${selected.lineId}:${selected.slot}` : undefined
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
          dispatch('selectConstraint', e ? { sketchId: sketch.id, lineId: e.line.id, slot: e.slot } : undefined)
        }}
      >
        {entries.map((e) => (
          <ListBoxItem
            key={e.key}
            id={e.key}
            textValue={`${e.line.handle}.${SLOT_NAME[e.line.dir][e.slot]} = ${e.expr}`}
            tone={e.error ? 'error' : 'neutral'}
            detail={e.error ?? (e.value !== undefined ? formatLength(e.value as Sixteenths) : '')}
            actions={
              <IconButton
                icon="close"
                size="sm"
                tone="danger"
                aria-label="Remove"
                onPress={() => dispatch('removeConstraint', { sketchId: sketch.id, lineId: e.line.id, slot: e.slot })}
              />
            }
          >
            <span className="mono">
              {e.line.handle}.{SLOT_NAME[e.line.dir][e.slot]} = {e.expr}
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
          {sketch?.name ?? extrude.sketchId}, {extrude.regions.length} region{extrude.regions.length === 1 ? '' : 's'}
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
