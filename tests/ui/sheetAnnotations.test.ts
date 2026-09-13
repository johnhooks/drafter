import { describe, expect, it, vi } from 'vitest'
import * as actions from '../../src/ui/store/actions'
import { commandById, commandsFor } from '../../src/ui/commands'

const dimension = { id: 'dimension', first: [0, 0] as const, second: [384, 0] as const, orientation: 'horizontal' as const, position: -32 }
const note = { id: 'note', text: 'Note', position: [1.25, 2.5] as const, leader: [160, 256] as const }
const sheetState = () => actions.addSheet(actions.initialState(), 'sheet')

describe('sheet annotations', () => {
  it('adds and updates dimensions with one undo step for each edit', () => {
    const before = sheetState()
    const added = actions.addSheetDimension(before, 'sheet', dimension)
    expect(added.doc.sheets?.[0]?.dimensions).toEqual([dimension])
    expect(added.history.past).toHaveLength(before.history.past.length + 1)
    expect(actions.undo(added).doc).toEqual(before.doc)
    const updated = actions.updateSheetDimension(added, 'sheet', 'dimension', { position: -64 })
    expect(updated.doc.sheets?.[0]?.dimensions?.[0]).toEqual({ ...dimension, position: -64 })
    expect(updated.history.past).toHaveLength(added.history.past.length + 1)
    expect(actions.undo(updated).doc).toEqual(added.doc)
    expect(actions.redo(actions.undo(updated)).doc).toEqual(updated.doc)
  })

  it('adds and edits note paper positions and view leaders in single undo steps', () => {
    const before = sheetState()
    const added = actions.addSheetNote(before, 'sheet', note)
    expect(added.doc.sheets?.[0]?.notes).toEqual([note])
    expect(actions.undo(added).doc).toEqual(before.doc)
    const updated = actions.updateSheetNote(added, 'sheet', 'note', { text: 'Changed\nNote', position: [3.5, 4.25], leader: undefined })
    expect(updated.doc.sheets?.[0]?.notes?.[0]).toEqual({ ...note, text: 'Changed\nNote', position: [3.5, 4.25], leader: undefined })
    expect(updated.history.past).toHaveLength(added.history.past.length + 1)
    expect(actions.undo(updated).doc).toEqual(added.doc)
  })

  it.each(['dimension', 'note'])('deletes the selected %s and restores it with undo', (id) => {
    let state = actions.addSheetNote(actions.addSheetDimension(sheetState(), 'sheet', dimension), 'sheet', note)
    state = actions.selectSheetAnnotation(state, id)
    const deleted = actions.deleteSheetAnnotation(state)
    expect(deleted.sheetSelection).toBeUndefined()
    expect(deleted.doc.sheets?.[0]?.dimensions).toHaveLength(id === 'dimension' ? 0 : 1)
    expect(deleted.doc.sheets?.[0]?.notes).toHaveLength(id === 'note' ? 0 : 1)
    expect(deleted.history.past).toHaveLength(state.history.past.length + 1)
    expect(actions.undo(deleted).doc).toEqual(state.doc)
  })

  it('clears stale selection on undo and sheet switches even when ids coincide', () => {
    let state = actions.addSheetNote(sheetState(), 'sheet', note)
    state = actions.selectSheetAnnotation(state, 'note')
    expect(actions.undo(state).sheetSelection).toBeUndefined()
    const changed = actions.updateSheetNote(state, 'sheet', 'note', { text: 'Changed' })
    expect(actions.undo(changed).sheetSelection).toBe('note')
    state = actions.addSheet(state, 'other')
    state = actions.addSheetNote(state, 'other', note)
    state = actions.selectSheetAnnotation(state, 'note')
    expect(actions.setMode(state, { kind: 'sheet', sheetId: 'sheet' }).sheetSelection).toBeUndefined()
    expect(actions.setMode(state, { kind: 'model' }).sheetSelection).toBeUndefined()
    expect(actions.deleteSheet(state, 'other').sheetSelection).toBeUndefined()
    expect(actions.selectSheetAnnotation(state, 'missing').sheetSelection).toBeUndefined()
  })

  it('does not record missing targets or duplicate annotation ids', () => {
    const state = actions.addSheetNote(sheetState(), 'sheet', note)
    expect(actions.addSheetNote(state, 'missing', note)).toBe(state)
    expect(actions.addSheetNote(state, 'sheet', note)).toBe(state)
    expect(actions.addSheetDimension(state, 'sheet', { ...dimension, id: 'note' })).toBe(state)
    expect(actions.updateSheetNote(state, 'sheet', 'missing', { text: 'Changed' })).toBe(state)
    expect(actions.updateSheetDimension(state, 'missing', 'dimension', { position: 0 })).toBe(state)
    expect(actions.deleteSheetAnnotation(actions.selectSheetAnnotation(state))).toEqual(actions.selectSheetAnnotation(state))
  })

  it('keeps sheet tool changes and selection out of document history', () => {
    const before = actions.addSheetNote(sheetState(), 'sheet', note)
    expect(before.sheetTool).toBe('select')
    const state = actions.selectSheetAnnotation(actions.setSheetTool(before, 'dimension'), 'note')
    expect(state.sheetTool).toBe('dimension')
    expect(state.sheetSelection).toBe('note')
    expect(state.doc).toBe(before.doc)
    expect(state.history).toBe(before.history)
  })
})

describe('sheet annotation commands', () => {
  it.each([['select', 'A'], ['dimension', 'D'], ['note', 'N']] as const)('runs sheet %s through its scoped command', (tool, key) => {
    const command = commandById(`sheet.tool.${tool}`)!
    expect(command).toBeDefined()
    expect(command.key).toBe(key)
    expect(commandsFor({ kind: 'sketch', sketchId: 'sketch' })).not.toContain(command)
    expect(commandsFor({ kind: 'sheet', sheetId: 'sheet' })).toContain(command)
    const dispatch = vi.fn()
    const cancelTool = vi.fn()
    command.run({ state: sheetState(), dispatch, hooks: { cancelTool } })
    expect(cancelTool).toHaveBeenCalledOnce()
    expect(dispatch).toHaveBeenCalledWith('setSheetTool', tool)
    expect(command.when?.(actions.setSheetTool(sheetState(), tool))).toBe(false)
    expect(command.when?.(actions.setMode(sheetState(), { kind: 'sheet' }))).toBe(false)
  })

  it('binds Delete and Backspace to annotation deletion only when selected', () => {
    const command = commandById('sheet.deleteAnnotation')!
    expect(command).toBeDefined()
    expect(command.key).toBe('Delete')
    expect(command.alias).toBe('Backspace')
    const state = actions.selectSheetAnnotation(actions.addSheetNote(sheetState(), 'sheet', note), 'note')
    expect(command.when?.(state)).toBe(true)
    expect(command.when?.(sheetState())).toBe(false)
    const dispatch = vi.fn()
    command.run({ state, dispatch, hooks: {} })
    expect(dispatch).toHaveBeenCalledWith('deleteSheetAnnotation')
  })

  it('clears annotation selection on Escape while keeping the current sheet', () => {
    const state = actions.selectSheetAnnotation(actions.addSheetNote(sheetState(), 'sheet', note), 'note')
    const dispatch = vi.fn()
    commandById('edit.cancel')!.run({ state, dispatch, hooks: {} })
    expect(dispatch).toHaveBeenCalledWith('selectSheetAnnotation')
    expect(dispatch).not.toHaveBeenCalledWith('setMode', { kind: 'sheet' })
  })

  it('clears the current sheet on Escape when no annotation is selected', () => {
    const dispatch = vi.fn()
    commandById('edit.cancel')!.run({ state: sheetState(), dispatch, hooks: {} })
    expect(dispatch).toHaveBeenCalledWith('setMode', { kind: 'sheet' })
  })
})
