import { Hint, Select, SelectItem, TextField } from '@bitmachina/drafter-kit'
import type { ViewKind } from '../../core/projection/frame'
import { type Orientation, type SheetScale, SCALES } from '../../core/sheets/types'
import { VIEW_NAMES } from '../../core/sheets/titleBlock'
import { useStore } from '../store/store'

export function SheetProperties() {
  const mode = useStore((state) => state.mode)
  const id = mode.kind === 'sheet' ? mode.sheetId : undefined
  const result = useStore((state) => id ? state.sheets.get(id) : undefined)
  const bodies = useStore((state) => state.eval.bodies)
  const dispatch = useStore((state) => state.dispatch)
  if (!result) return <Hint>Select a sheet to edit its settings.</Hint>
  const { sheet, warnings } = result
  return <div className="kit-fields">
    <h3 className="section-title">Sheet</h3>
    <TextField label="Name" value={sheet.name} onCommit={(_value, text) => dispatch('updateSheet', sheet.id, { name: text })} />
    <Select label="Orientation" selectedKey={sheet.orientation} onSelectionChange={(key) => dispatch('updateSheet', sheet.id, { orientation: key as Orientation })}>
      <SelectItem id="landscape">Landscape</SelectItem><SelectItem id="portrait">Portrait</SelectItem>
    </Select>
    <Select label="View" selectedKey={sheet.view} onSelectionChange={(key) => dispatch('updateSheet', sheet.id, { view: key as ViewKind })}>
      {Object.entries(VIEW_NAMES).map(([key, name]) => <SelectItem id={key} key={key}>{name}</SelectItem>)}
    </Select>
    <Select label="Target" selectedKey={sheet.targetBodyId ?? '__all__'} onSelectionChange={(key) => dispatch('updateSheet', sheet.id, { targetBodyId: key === '__all__' ? undefined : String(key) })}>
      <SelectItem id="__all__">Whole model</SelectItem>
      {[...bodies.values()].map((body) => <SelectItem id={body.id} key={body.id}>{body.name}</SelectItem>)}
      {sheet.targetBodyId && !bodies.has(sheet.targetBodyId) && <SelectItem id={sheet.targetBodyId}>{sheet.targetBodyId} (missing)</SelectItem>}
    </Select>
    <Select label="Scale" selectedKey={String(sheet.scale)} onSelectionChange={(key) => dispatch('updateSheet', sheet.id, { scale: Number(key) as SheetScale })}>
      {SCALES.map((scale) => <SelectItem key={scale} id={String(scale)}>{`1:${scale}`}</SelectItem>)}
    </Select>
    {warnings.map((warning) => <p className="sheet-warning" role="status" key={warning}>{warning}</p>)}
  </div>
}
