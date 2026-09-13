import { expect, it } from 'vitest'
import { conflictFor } from '../../src/ui/bindings'
import { commandById } from '../../src/ui/commands'
import { parseChord } from '../../src/ui/keys'

const backspace = parseChord('Backspace')
if (!backspace.ok) throw new Error(backspace.error)
const chord = backspace.chord

it.each([
  ['sheet.tool.note', 'sheet.deleteAnnotation'],
  ['tool.line', 'sketch.delete'],
])('rejects binding %s to the fixed alias of %s', (commandId, deleteId) => {
  const command = commandById(commandId)!
  expect(conflictFor(command, chord, {})?.id).toBe(deleteId)
  expect(conflictFor(command, chord, { [deleteId]: 'Mod+D' })?.id).toBe(deleteId)
  expect(conflictFor(command, chord, { [deleteId]: null })?.id).toBe(deleteId)
})

it.each(['sheet.deleteAnnotation', 'sketch.delete'])('allows %s to bind its own alias', (commandId) => {
  expect(conflictFor(commandById(commandId)!, chord, {})).toBeUndefined()
})

it('allows alias reuse in a nonoverlapping view', () => {
  expect(conflictFor(commandById('view.front')!, chord, {})).toBeUndefined()
})
