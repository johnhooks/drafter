import type { ReactNode } from 'react'
import { Button, Checkbox, Disclosure, Field, Fields, Hint, IconButton, ListBox, ListBoxItem, Row, Select, SelectItem, TextField } from '@bitmachina/drafter-kit'
import { FRAMES } from '../core/model/planes'
import type { ExtrudeFeature, Len, LineDir, LineSlot, SketchFeature, SketchLine, SketchRect, Slot } from '../core/model/types'
import { isExpr, regionKey, sameRegion } from '../core/model/types'
import { regionIsRectangle } from '../core/geom/regions'
import { isAttachment } from './sketch/Dimensions'
import { type Sixteenths, formatLength } from '../core/units'
import { LenField } from './LenField'
import { ScrollArea } from './ScrollArea'
import { Parameters } from './Parameters'
import type { SketchResult } from '../core/eval/evaluate'
import type { RectSlot } from './store/actions'
import { useStore } from './store/store'

export function Properties() {
  const doc = useStore((s) => s.doc)
  const selection = useStore((s) => s.selection)
  const feature = doc.features.find((f) => f.id === selection.featureId)
  if (!feature || feature.kind === 'sketch') return <DocumentProperties />
  return <ExtrudeProperties extrude={feature} />
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

/** The sketch's own fields: name, plane, offset, and the way into the editor. */
export function SketchFields({ sketch }: { sketch: SketchFeature }) {
  const ev = useStore((s) => s.eval)
  const mode = useStore((s) => s.mode)
  const dispatch = useStore((s) => s.dispatch)
  const r = ev.results.get(sketch.id)
  const plane = r?.kind === 'sketch' ? r.plane : null
  return (
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
  )
}

export type SketchList = 'rectangles' | 'regions' | 'lines' | 'constraints'

/** The sketch's lists as an accordion: one open at a time, and the open one takes the remaining height and scrolls. */
export function SketchLists({ sketch, open, onOpen }: { sketch: SketchFeature; open: SketchList | null; onOpen: (list: SketchList | null) => void }) {
  const ev = useStore((s) => s.eval)
  const selection = useStore((s) => s.selection)
  const dispatch = useStore((s) => s.dispatch)
  const r = ev.results.get(sketch.id)
  const regions = r?.kind === 'sketch' ? r.regions : []
  const selectedRegionKeys = selection.regions.map(regionKey)
  const lineAt = (id: string) => (r?.kind === 'sketch' ? r.lines.get(id)?.at : undefined)
  const lineError = (id: string) => (r?.kind === 'sketch' ? r.lineErrors.get(id) : undefined)
  const selectedLines = new Set(selection.lineIds)
  const wholeRects = sketch.rects.filter((rect) => rect.lines.every((id) => selectedLines.has(id)))
  const handleOf = (id: string) => sketch.lines.find((l) => l.id === id)?.handle ?? id
  // the open list can disappear from under the accordion (the last rectangle exploded, the last constraint removed)
  const available = new Set<SketchList>(['regions', 'lines', ...(sketch.rects.length > 0 ? ['rectangles' as const] : []), ...(constraintEntries(sketch, r?.kind === 'sketch' ? r : undefined).length > 0 ? ['constraints' as const] : [])])
  const shown: SketchList | null = open === null ? null : available.has(open) ? open : 'regions'
  const section = (list: SketchList) => ({ isExpanded: shown === list, onExpandedChange: (on: boolean) => onOpen(on ? list : null) })
  return (
    <>
      {sketch.rects.length > 0 && (
        <Disclosure title="Rectangles" trailing={String(sketch.rects.length)} {...section('rectangles')}>
          <ScrollArea>
            <ListBox
              aria-label="Rectangles"
              dense
              selectionMode="multiple"
              selectedKeys={wholeRects.map((rect) => rect.id)}
              onSelectionChange={(keys) => {
                const chosen = keys === 'all' ? sketch.rects : sketch.rects.filter((rect) => ([...keys] as string[]).includes(rect.id))
                dispatch('selectLines', sketch.id, chosen.flatMap((rect) => rect.lines))
              }}
            >
              {sketch.rects.map((rect) => {
                const [left, bottom, right, top] = rect.lines.map(lineAt)
                const handles = rect.lines.map(handleOf).join(' ')
                if (left === undefined || bottom === undefined || right === undefined || top === undefined) {
                  const failed = rect.lines.find((id) => lineError(id) !== undefined)
                  const why = failed ? `${handleOf(failed)}: ${lineError(failed)}` : 'unresolved'
                  return (
                    <ListBoxItem key={rect.id} id={rect.id} textValue={rect.handle} tone="error" detail={why}>
                      {rect.handle}
                    </ListBoxItem>
                  )
                }
                const size = `${formatLength((right - left) as Sixteenths)} x ${formatLength((top - bottom) as Sixteenths)}`
                return (
                  <ListBoxItem key={rect.id} id={rect.id} textValue={`${rect.handle} ${size}`} detail={`at (${formatLength(left as Sixteenths)}, ${formatLength(bottom as Sixteenths)}), lines ${handles}`}>
                    {rect.handle} {size}
                  </ListBoxItem>
                )
              })}
            </ListBox>
          </ScrollArea>
        </Disclosure>
      )}
      <Disclosure title="Regions" trailing={String(regions.length)} {...section('regions')}>
        <ScrollArea>
          {regions.length === 0 && <Hint>None yet. Close an outline with lines or draw a rectangle.</Hint>}
          <ListBox
            aria-label="Regions"
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
              const fills = sketch.rects.find((rect) => regionIsRectangle(region, rect.lines, lineAt))
              // in sketch order, so a rectangle reads l1 l2 l3 l4
              const bounding = sketch.lines.filter((l) => region.boundary.some((e) => e.lineId === l.id)).map((l) => l.handle).join(' ')
              const detail = `at (${formatLength(b.u0 as Sixteenths)}, ${formatLength(b.v0 as Sixteenths)}), lines ${bounding}${fills ? `, fills ${fills.handle}` : ''}`
              return (
                <ListBoxItem key={region.key} id={region.key} textValue={`Region ${size}`} detail={detail}>
                  Region {size}
                </ListBoxItem>
              )
            })}
          </ListBox>
        </ScrollArea>
      </Disclosure>
      <Disclosure title="Lines" trailing={String(sketch.lines.length)} {...section('lines')}>
        <ScrollArea>
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
              const err = lineError(line.id)
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
        </ScrollArea>
      </Disclosure>
      <ConstraintList sketch={sketch} {...section('constraints')} />
    </>
  )
}

export function SelectionPanel() {
  const doc = useStore((s) => s.doc)
  const selection = useStore((s) => s.selection)
  const ev = useStore((s) => s.eval)
  const dispatch = useStore((s) => s.dispatch)
  const sketch = doc.features.find((f): f is SketchFeature => f.kind === 'sketch' && f.id === selection.featureId)
  if (!sketch) return null
  const r = ev.results.get(sketch.id)
  const regions = r?.kind === 'sketch' ? r.regions : []
  const lineAt = (id: string) => (r?.kind === 'sketch' ? r.lines.get(id)?.at : undefined)
  const single = selection.lineIds.length === 1 ? sketch.lines.find((x) => x.id === selection.lineIds[0]) : undefined
  // one selected region that is exactly a rectangle's area shows that rectangle's form, as a click inside it always did
  const selectedRegion = selection.regions.length === 1 ? regions.find((x) => sameRegion(x.ref, selection.regions[0]!)) : undefined
  const selectedRect = selectedRegion ? sketch.rects.find((rect) => regionIsRectangle(selectedRegion, rect.lines, lineAt)) : undefined
  const selectedLines = new Set(selection.lineIds)
  // four selected lines that already are a rectangle get its form, not the grouping action
  const fourRect = selection.lineIds.length === 4 ? sketch.rects.find((rect) => rect.lines.every((id) => selectedLines.has(id))) : undefined
  const rect = selectedRect ?? fourRect
  const lines = selection.lineIds.length
  const regionCount = selection.regions.length
  let body: ReactNode
  if (selection.constraint) {
    const constraint = selection.constraint
    const entry = constraint.sketchId === sketch.id ? constraintEntries(sketch, r?.kind === 'sketch' ? r : undefined).find(e => e.line.id === constraint.lineId && e.slot === constraint.slot) : undefined
    body = entry ? <Fields>
      <strong>Constraint {entry.line.handle}.{SLOT_NAME[entry.line.dir][entry.slot]}</strong>
      <Field label="Target">{entry.line.handle} · {SLOT_NAME[entry.line.dir][entry.slot]}</Field>
      <LenField label="Expression" value={entry.expr} resolved={entry.value} error={entry.error} onCommit={value => dispatch('setLineSlot', sketch.id, entry.line.id, entry.slot, value)} />
      {entry.value !== undefined && <Field label="Evaluated value">{formatLength(entry.value as Sixteenths)}</Field>}
      <Button tone="danger" onPress={() => dispatch('removeConstraint', constraint)}>Remove constraint</Button>
      <Button onPress={() => dispatch('selectLines', sketch.id, [entry.line.id])}>Inspect line {entry.line.handle}</Button>
    </Fields> : <Hint>Nothing selected. This constraint is no longer available.</Hint>
  } else if (single) {
    body = (
      <>
        {sketch.rects.filter(rect => rect.lines.includes(single.id)).map(rect => <Field key={rect.id} label="Belongs to"><Button onPress={() => dispatch('selectLines', sketch.id, rect.lines)}>Inspect rectangle {rect.handle}</Button></Field>)}
        <LineProperties sketch={sketch} line={single} />
      </>
    )
  } else if (rect) body = <RectangleProperties sketch={sketch} rect={rect} />
  else if (lines === 4) {
    body = (
      <Fields>
        <div>
          <Button onPress={() => dispatch('groupRectangle', sketch.id, selection.lineIds)}>Make rectangle</Button>
        </div>
      </Fields>
    )
  } else if (lines > 1) body = <Hint>{lines} lines selected</Hint>
  else if (regionCount > 0) body = <Hint>{regionCount === 1 ? '1 region' : `${regionCount} regions`} selected</Hint>
  else body = <Hint>Nothing selected. Click a line or region in the view, or choose one from the lists.</Hint>
  return (
    <div className="props-selection">
      <ScrollArea>{body}</ScrollArea>
    </div>
  )
}

function featureName(id: string): string {
  const f = useStore.getState().doc.features.find((x) => x.id === id)
  return f?.name ?? id
}

const SIDE_NAME = ['Left', 'Bottom', 'Right', 'Top'] as const
const SIDE_SLOT: readonly RectSlot[] = ['left', 'bottom', 'right', 'top']

function RectangleProperties({ sketch, rect }: { sketch: SketchFeature; rect: SketchRect }) {
  const ev = useStore((s) => s.eval)
  const dispatch = useStore((s) => s.dispatch)
  const r = ev.results.get(sketch.id)
  const resolved = r?.kind === 'sketch' ? r.lines : undefined
  const members = rect.lines.map((id) => sketch.lines.find((l) => l.id === id))
  const at = (i: number) => resolved?.get(rect.lines[i]!)?.at
  const sideField = (i: number) => {
    const m = members[i]
    if (!m) return null
    const err = r?.kind === 'sketch' ? r.lineErrors.get(m.id) : undefined
    return (
      <LenField
        key={SIDE_SLOT[i]}
        label={SIDE_NAME[i]!}
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
    <div><h3 className="section-title">Rectangle {rect.handle}</h3>
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
    </div>
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
    <div><h3 className="section-title">Line {line.handle}</h3>
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
    </div>
  )
}

/** Every expression-driven slot in the sketch other than endpoint attachments, selectable and removable. */
/** Every listed constraint: the expression slots that are not corner attachments, with their values or errors. */
function constraintEntries(sketch: SketchFeature, r: SketchResult | undefined) {
  return sketch.lines.flatMap((line) =>
    (['at', 'min', 'max', 'size'] as const).flatMap((slot) => {
      const v = slot === 'at' ? line.at : line.run[slot]
      if (v === undefined || !isExpr(v) || isAttachment(sketch, line, slot)) return []
      const value = r?.kind === 'sketch' ? r.slotValues.get(line.id)?.[slot] : undefined
      const error = r?.kind === 'sketch' && value === undefined ? r.lineErrors.get(line.id) : undefined
      return [{ key: `${line.id}:${slot}`, line, slot, expr: v, value, error }]
    }),
  )
}

function ConstraintList({ sketch, isExpanded, onExpandedChange }: { sketch: SketchFeature; isExpanded: boolean; onExpandedChange: (on: boolean) => void }) {
  const ev = useStore((s) => s.eval)
  const selected = useStore((s) => s.selection.constraint)
  const dispatch = useStore((s) => s.dispatch)
  const r = ev.results.get(sketch.id)
  const entries = constraintEntries(sketch, r?.kind === 'sketch' ? r : undefined)
  if (entries.length === 0) return null
  const selectedKey = selected ? `${selected.lineId}:${selected.slot}` : undefined
  return (
    <Disclosure title="Constraints" trailing={String(entries.length)} isExpanded={isExpanded} onExpandedChange={onExpandedChange}>
      <ScrollArea>
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
      </ScrollArea>
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
