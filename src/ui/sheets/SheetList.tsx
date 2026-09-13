import { Button, Dialog, Hint, ListBox, ListBoxItem, Select, SelectItem } from '@bitmachina/drafter-kit'
import { useState } from 'react'
import type { Sheet } from '../../core/sheets/types'
import { useCommand, useViewHooks } from '../useCommands'
import { useStore } from '../store/store'
import { VIEW_NAMES } from '../../core/sheets/titleBlock'

export function SheetCommand({ id }: { id: string }) {
  const command = useCommand(id)
  return <Button aria-label={command.tooltip} isDisabled={!command.enabled} onPress={command.run}>{command.label}</Button>
}

export function SheetList() {
  const [isOpen, setOpen] = useState(false)
  const [view, setView] = useState<Sheet['view']>('front')
  useViewHooks({ openNewSheet: () => { setView('front'); setOpen(true) } })
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
    <Dialog title="Add Sheet" isOpen={isOpen} onOpenChange={setOpen}>
      <div className="kit-fields">
        <Select label="View" selectedKey={view} onSelectionChange={(key) => setView(key as Sheet['view'])}>
          {Object.entries(VIEW_NAMES).map(([key, name]) => <SelectItem id={key} key={key}>{name}</SelectItem>)}
        </Select>
        <Hint>{view === 'isometric' ? 'Captures and locks the current model camera orientation. Scale controls projected size on paper. Notes are supported; dimensions are unavailable.' : 'The view cannot be changed after creation.'}</Hint>
        <div className="kit-dialog-actions">
          <Button onPress={() => setOpen(false)}>Cancel</Button>
          <Button variant="primary" onPress={() => { dispatch('addSheet', undefined, view); setOpen(false) }}>Create</Button>
        </div>
      </div>
    </Dialog>
  </div>
}
