import { Button, Select, SelectItem, TextField } from '@bitmachina/drafter-kit'
import { useEffect, useRef, useState } from 'react'
import type { Sheet, SheetDimension, SheetNote } from '../../core/sheets/types'
import { formatLength, type Sixteenths } from '../../core/units'
import { useStore } from '../store/store'
import { parsePaperCoordinate, parseSheetCoordinate } from './tools'

function CoordinateField({ label, value, onCommit }: { label: string; value: number; onCommit: (value: number) => void }) {
  return <TextField<number> label={label} value={formatLength(value as Sixteenths)} validate={parseSheetCoordinate} onCommit={onCommit} />
}

function PaperField({ label, value, onCommit }: { label: string; value: number; onCommit: (value: number) => void }) {
  return <TextField<number> label={label} value={String(Number(value.toFixed(6)))} description="Paper inches" validate={parsePaperCoordinate} onCommit={onCommit} />
}

function NoteText({ text, onCommit }: { text: string; onCommit: (text: string) => void }) {
  const [draft, setDraft] = useState(text)
  const [error, setError] = useState(false)
  const reverting = useRef(false)
  useEffect(() => { setDraft(text); setError(false) }, [text])
  return <label className="sheet-note-field">
    <span className="kit-field-label">Text</span>
    <textarea className="kit-input" value={draft} rows={3} aria-invalid={error || undefined} onChange={(event) => { setDraft(event.target.value); setError(false) }} onBlur={() => {
      if (reverting.current) { reverting.current = false; return }
      if (!draft.trim()) { setError(true); return }
      if (draft !== text) onCommit(draft)
    }} onKeyDown={(event) => {
      if (event.nativeEvent.isComposing) return
      if (event.key === 'Escape') {
        event.preventDefault()
        reverting.current = true
        setDraft(text)
        setError(false)
        event.currentTarget.blur()
      } else if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault()
        event.currentTarget.blur()
      }
    }} />
    {error && <span className="kit-field-error" role="alert">Enter note text</span>}
  </label>
}

export function AnnotationProperties({ sheet }: { sheet: Sheet }) {
  const selectedId = useStore((state) => state.sheetSelection)
  const dispatch = useStore((state) => state.dispatch)
  const dimension = sheet.dimensions?.find((dimension) => dimension.id === selectedId)
  const note = sheet.notes?.find((note) => note.id === selectedId)
  if (dimension) {
    const update = (patch: Partial<Omit<SheetDimension, 'id'>>) => dispatch('updateSheetDimension', sheet.id, dimension.id, patch)
    return <div className="kit-fields sheet-annotation-properties" key={dimension.id}>
      <h3 className="section-title">Dimension</h3>
      <CoordinateField label="First U" value={dimension.first[0]} onCommit={(value) => update({ first: [value, dimension.first[1]] })} />
      <CoordinateField label="First V" value={dimension.first[1]} onCommit={(value) => update({ first: [dimension.first[0], value] })} />
      <CoordinateField label="Second U" value={dimension.second[0]} onCommit={(value) => update({ second: [value, dimension.second[1]] })} />
      <CoordinateField label="Second V" value={dimension.second[1]} onCommit={(value) => update({ second: [dimension.second[0], value] })} />
      <Select label="Dimension orientation" selectedKey={dimension.orientation} onSelectionChange={(key) => update({ orientation: key as SheetDimension['orientation'] })}>
        <SelectItem id="horizontal">Horizontal</SelectItem><SelectItem id="vertical">Vertical</SelectItem>
      </Select>
      <CoordinateField label="Line position" value={dimension.position} onCommit={(position) => update({ position })} />
    </div>
  }
  if (note) {
    const LeaderField = sheet.view === 'isometric' ? PaperField : CoordinateField
    const update = (patch: Partial<Omit<SheetNote, 'id'>>) => dispatch('updateSheetNote', sheet.id, note.id, patch)
    return <div className="kit-fields sheet-annotation-properties" key={note.id}>
      <h3 className="section-title">Note</h3>
      <NoteText text={note.text} onCommit={(text) => update({ text })} />
      <PaperField label="Paper X" value={note.position[0]} onCommit={(value) => update({ position: [value, note.position[1]] })} />
      <PaperField label="Paper Y" value={note.position[1]} onCommit={(value) => update({ position: [note.position[0], value] })} />
      {note.leader ? <>
        <LeaderField label={sheet.view === 'isometric' ? 'Leader X' : 'Leader U'} value={note.leader[0]} onCommit={(value) => update({ leader: [value, note.leader![1]] })} />
        <LeaderField label={sheet.view === 'isometric' ? 'Leader Y' : 'Leader V'} value={note.leader[1]} onCommit={(value) => update({ leader: [note.leader![0], value] })} />
        <Button onPress={() => update({ leader: undefined })}>Remove leader</Button>
      </> : <Button onPress={() => update({ leader: [0, 0] })}>Add leader</Button>}
    </div>
  }
  return null
}
