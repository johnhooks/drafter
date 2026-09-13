import { expect, it, vi } from 'vitest'
import { commandsFor } from '../../src/ui/commands'
import { parseDocument, serializeDocument } from '../../src/core/model/document'
import { DEFAULT_PLANE } from '../../src/core/model/types'
import * as actions from '../../src/ui/store/actions'

it.each(['delete', 'rename'])('initializes an imported sheet counter before %s', (edit) => {
  let state = actions.addSheet(actions.addSheet(actions.initialState(), 'first'), 'second')
  const { nextSheetNumber: counter, ...file } = actions.fileOf(state)
  expect(counter).toBe(3)
  state = actions.loadFile(state, file)
  state = edit === 'delete' ? actions.deleteSheet(state, 'second') : actions.updateSheet(state, 'second', { name: 'Detail' })
  state = actions.loadFile(state, actions.fileOf(state))
  expect(actions.addSheet(state, 'third').doc.sheets?.at(-1)?.name).toBe('Sheet 3')
})

it('keeps sheet names past deletion and reload, with undoable list edits', () => {
  let state = actions.addSheet(actions.initialState(), 'first')
  state = actions.addSheet(state, 'second')
  expect(state.doc.sheets?.map((sheet) => sheet.name)).toEqual(['Sheet 1', 'Sheet 2'])
  state = actions.moveSheet(state, 'second', -1)
  expect(state.doc.sheets?.map((sheet) => sheet.id)).toEqual(['second', 'first'])
  state = actions.updateSheet(state, 'first', { name: 'Renamed' })
  expect(actions.undo(state).doc.sheets?.[1]?.name).toBe('Sheet 1')
  state = actions.deleteSheet(state, 'second')
  expect(actions.undo(state).doc.sheets).toHaveLength(2)
  const parsed = parseDocument(serializeDocument(actions.fileOf(state)))
  expect(parsed.ok).toBe(true)
  if (!parsed.ok) return
  state = actions.addSheet(actions.loadFile(state, parsed.file), 'third')
  expect(state.doc.sheets?.at(-1)?.name).toBe('Sheet 3')
  expect(state.mode).toEqual({ kind: 'sheet', sheetId: 'third' })
  state = actions.undo(state)
  expect(state.doc.sheets).toHaveLength(1)
  expect(state.mode).toEqual({ kind: 'sheet' })
  state = actions.redo(state)
  expect(state.doc.sheets).toHaveLength(2)
})

it('regenerates projections for model edits, reuses them for sheet renames, and warns for deleted targets', () => {
  let state = actions.addSketch(actions.initialState(), DEFAULT_PLANE, 'sketch')
  state = actions.addRectangle(state, 'sketch', 0, 384, 0, 480)
  state = actions.addExtrude(state, 'sketch', [], 192, 'extrude')
  state = actions.addSheet(state, 'sheet')
  state = actions.updateSheet(state, 'sheet', { view: 'top', targetBodyId: 'extrude' })
  const before = state.sheets.get('sheet')!
  expect(before.projection.bounds).not.toBeNull()
  state = actions.updateSheet(state, 'sheet', { name: 'Top' })
  expect(state.sheets.get('sheet')!.projection).toBe(before.projection)
  state = actions.updateExtrude(state, 'extrude', { distance: 384 })
  expect(state.sheets.get('sheet')!.projection.bounds).not.toEqual(before.projection.bounds)
  state = actions.deleteFeature(state, 'extrude')
  expect(state.sheets.get('sheet')!.projection.segments).toHaveLength(0)
  expect(state.sheets.get('sheet')!.warnings.join()).toContain('extrude')
})

it('limits sheet commands to sheet and shared actions', () => {
  const commands = commandsFor({ kind: 'sheet' })
  expect(commands.map((command) => command.id)).toEqual(expect.arrayContaining(['edit.undo', 'edit.cancel', 'view.fit', 'sheet.add']))
  expect(commands.some((command) => command.view === 'model' || command.view === 'sketch')).toBe(false)
})

it('records the local edit date and preserves it across reload', () => {
  vi.useFakeTimers()
  try {
    vi.setSystemTime(new Date(2026, 8, 12, 23, 0))
    const state = actions.addSheet(actions.initialState(), 'sheet')
    expect(state.doc.modifiedDate).toBe('2026-09-12')
    vi.setSystemTime(new Date(2026, 8, 13, 10, 0))
    expect(actions.loadFile(state, actions.fileOf(state)).doc.modifiedDate).toBe('2026-09-12')
  } finally {
    vi.useRealTimers()
  }
})
