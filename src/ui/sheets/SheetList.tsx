import { Button, Hint, ListBox, ListBoxItem } from '@bitmachina/drafter-kit'
import { useCommand } from '../useCommands'
import { useStore } from '../store/store'
import { VIEW_NAMES } from '../../core/sheets/titleBlock'

export function SheetCommand({ id }: { id: string }) {
  const command = useCommand(id)
  return <Button aria-label={command.tooltip} isDisabled={!command.enabled} onPress={command.run}>{command.label}</Button>
}

export function SheetList() {
  const sheets = useStore((state) => state.doc.sheets)
  const mode = useStore((state) => state.mode)
  const dispatch = useStore((state) => state.dispatch)
  return <div className="sheet-list">
    <h3 className="section-title">Sheets</h3>
    <SheetCommand id="sheet.add" />
    <ListBox aria-label="Sheets" selectionMode="single" disallowEmptySelection selectedKeys={mode.kind === 'sheet' && mode.sheetId ? [mode.sheetId] : []}
      onSelectionChange={(keys) => dispatch('setMode', { kind: 'sheet', sheetId: keys === 'all' ? undefined : [...keys][0] as string | undefined })}>
      {(sheets ?? []).map((sheet) => <ListBoxItem key={sheet.id} id={sheet.id} textValue={sheet.name} detail={`${VIEW_NAMES[sheet.view]} · 1:${sheet.scale}`}>{sheet.name}</ListBoxItem>)}
    </ListBox>
    {!sheets?.length && <Hint>Add a sheet to create a printable view of the model.</Hint>}
    <div className="sheet-actions"><SheetCommand id="sheet.up" /><SheetCommand id="sheet.down" /><SheetCommand id="sheet.delete" /></div>
  </div>
}
