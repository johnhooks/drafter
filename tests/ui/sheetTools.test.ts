import { describe, expect, it } from 'vitest'
import type { SheetDimension, SheetNote } from '../../src/core/sheets/types'
import { makeSheetTool, parsePaperCoordinate, parseSheetCoordinate, pickedSegments, type SheetAnnotation, type SheetPointer, type SheetToolHost } from '../../src/ui/sheets/tools'
import type { Segment } from '../../src/core/projection/hidden'

describe('typed sheet coordinates', () => {
  it.each([['-1', -16], ['+1', 16], ['-1 1/4"', -20], ['-3/4', -12], ['+3/4', 12], ['-0', 0], ['  - 1/2 in ', -8]])('parses signed view coordinate %s', (text, value) => {
    expect(parseSheetCoordinate(text)).toEqual({ ok: true, value })
  })

  it.each(['', '-', '+', '--1', '+-1', '1/0', 'Infinity', '9007199254740992', '-9007199254740992'])('rejects invalid or unsafe view coordinate %s', (text) => {
    expect(parseSheetCoordinate(text).ok).toBe(false)
  })

  it.each([['-1 1/4"', -1.25], ['+3/4', 0.75], ['-3/4', -0.75], ['-0.123456', -0.123456], ['+0.123456', 0.123456]])('parses paper coordinate %s without quantizing decimals', (text, value) => {
    expect(parsePaperCoordinate(text)).toEqual({ ok: true, value })
  })

  it.each(['', '-', '--1/2', '1/0', 'Infinity', '-Infinity', 'NaN'])('rejects invalid paper coordinate %s', (text) => {
    expect(parsePaperCoordinate(text).ok).toBe(false)
  })
})

function pointer(u: number, v: number, extra: Partial<SheetPointer> = {}): SheetPointer {
  return { point: [u, v], raw: [u, v], paper: [u / 16, v / 16], px: [u, v], shift: false, ...extra }
}

function setup(name: 'select' | 'dimension' | 'note', annotation?: SheetAnnotation) {
  const dimensions: SheetDimension[] = []
  const notes: SheetNote[] = []
  const updates: SheetAnnotation[] = []
  let selected: string | undefined
  const host: SheetToolHost = {
    newId: () => 'annotation-1',
    changed: () => {},
    annotation: (id) => annotation?.value.id === id ? annotation : undefined,
    select: (id) => { selected = id },
    addDimension: (dimension) => { dimensions.push(dimension) },
    addNote: (note) => { notes.push(note) },
    update: (next) => { updates.push(next) },
  }
  return { tool: makeSheetTool(name, host), dimensions, notes, updates, selected: () => selected }
}

describe('sheet annotation tools', () => {
  it('highlights only confirmed dimension points until commit', () => {
    const { tool } = setup('dimension')
    expect(tool.pickedPoints()).toEqual([])
    tool.down(pointer(0, 0))
    expect(tool.pickedPoints()).toEqual([])
    tool.up(pointer(0, 0))
    expect(tool.pickedPoints()).toEqual([[0, 0]])
    tool.move(pointer(384, 0))
    expect(tool.pickedPoints()).toEqual([[0, 0]])
    tool.up(pointer(384, 0))
    expect(tool.pickedPoints()).toEqual([[0, 0], [384, 0]])
    tool.move(pointer(180, -64))
    expect(tool.pickedPoints()).toEqual([[0, 0], [384, 0]])
    tool.up(pointer(180, -64))
    expect(tool.pickedPoints()).toEqual([])
  })

  it.each([1, 2])('clears %s confirmed picks on Escape and cancellation', (count) => {
    const { tool } = setup('dimension')
    for (const cancel of [() => tool.key('Escape'), () => tool.cancel()]) {
      tool.up(pointer(0, 0))
      if (count === 2) tool.up(pointer(384, 0))
      cancel()
      expect(tool.pickedPoints()).toEqual([])
    }
    expect(setup('select').tool.pickedPoints()).toEqual([])
    expect(setup('note').tool.pickedPoints()).toEqual([])
    expect(setup('dimension').tool.pickedPoints()).toEqual([])
  })

  it('highlights incident edges once, retaining hidden visibility and ignoring free grid points', () => {
    const segments: Segment[] = [
      { dir: 'h', at: 0, min: 0, max: 64, visible: true },
      { dir: 'v', at: 0, min: 0, max: 64, visible: false },
      { dir: 'h', at: 64, min: 0, max: 64, visible: true },
    ]
    expect(pickedSegments(segments, [[0, 0]])).toEqual(segments.slice(0, 2))
    expect(pickedSegments(segments, [[32, 0]])).toEqual([segments[0]])
    expect(pickedSegments(segments, [[0, 32]])).toEqual([segments[1]])
    expect(pickedSegments(segments, [[0, 0], [32, 0]])).toEqual(segments.slice(0, 2))
    expect(pickedSegments(segments, [[32, 32], [80, 0]])).toEqual([])
  })

  it('previews the third click and commits one horizontal dimension', () => {
    const { tool, dimensions } = setup('dimension')
    tool.up(pointer(0, 0))
    tool.up(pointer(384, 0))
    tool.move(pointer(180, -64))
    expect(tool.preview()).toEqual({ kind: 'dimension', value: { id: 'annotation-1', first: [0, 0], second: [384, 0], orientation: 'horizontal', position: -64 } })
    expect(dimensions).toHaveLength(0)
    tool.up(pointer(180, -64))
    expect(dimensions).toHaveLength(1)
    expect(dimensions[0]?.position).toBe(-64)
    expect(tool.preview()).toBeNull()
  })

  it('chooses orientation from placement and avoids zero-length dimensions', () => {
    const { tool, dimensions } = setup('dimension')
    tool.up(pointer(0, 0))
    tool.up(pointer(32, 64))
    tool.move(pointer(80, 32))
    expect(tool.preview()?.value).toMatchObject({ orientation: 'vertical', position: 80 })
    tool.move(pointer(16, 100))
    expect(tool.preview()?.value).toMatchObject({ orientation: 'horizontal', position: 100 })
    tool.cancel()
    tool.up(pointer(0, 0))
    tool.up(pointer(0, 0))
    tool.up(pointer(0, 64))
    expect(dimensions).toHaveLength(0)
    tool.up(pointer(80, 32))
    expect(dimensions[0]?.orientation).toBe('vertical')
  })

  it('cancels either point-placement stage without adding a dimension', () => {
    for (const clicks of [1, 2]) {
      const { tool, dimensions } = setup('dimension')
      tool.up(pointer(0, 0))
      if (clicks === 2) tool.up(pointer(32, 0))
      expect(tool.key('Escape')).toBe(true)
      expect(tool.preview()).toBeNull()
      expect(dimensions).toHaveLength(0)
      expect(tool.key('Escape')).toBe(false)
    }
  })

  it('ignores the release of a dimension click cancelled while held', () => {
    const { tool, dimensions } = setup('dimension')
    tool.up(pointer(0, 0))
    tool.up(pointer(384, 0))
    tool.down(pointer(180, -64))
    expect(tool.key('Escape')).toBe(true)
    tool.up(pointer(180, -64))
    tool.move(pointer(180, -100))
    expect(tool.preview()).toBeNull()
    expect(dimensions).toHaveLength(0)
    tool.down(pointer(0, 0))
    tool.up(pointer(0, 0))
    tool.up(pointer(384, 0))
    tool.up(pointer(180, -64))
    expect(dimensions).toHaveLength(1)
  })

  it('opens note entry in paper coordinates and commits multiline text once', () => {
    const { tool, notes } = setup('note')
    tool.down(pointer(32, 48, { paper: [2.3, 1.7] }))
    tool.up(pointer(32, 48, { paper: [2.3, 1.7] }))
    expect(tool.prompt()?.position).toEqual([2.3, 1.7])
    expect(notes).toHaveLength(0)
    tool.commitPrompt('First line\nSecond line')
    expect(notes).toEqual([{ id: 'annotation-1', text: 'First line\nSecond line', position: [2.3, 1.7] }])
    tool.commitPrompt('duplicate')
    expect(notes).toHaveLength(1)
  })

  it('cancels note entry and rejects blank text', () => {
    const { tool, notes } = setup('note')
    tool.down(pointer(32, 48))
    tool.up(pointer(32, 48))
    expect(tool.key('Escape')).toBe(true)
    expect(tool.prompt()).toBeNull()
    tool.down(pointer(32, 48))
    tool.up(pointer(32, 48))
    tool.commitPrompt('   ')
    expect(notes).toHaveLength(0)
  })

  it('shift-drags a new note leader to the snapped view point', () => {
    const { tool, notes } = setup('note')
    tool.down(pointer(16, 32, { shift: true, paper: [4, 3] }))
    tool.move(pointer(96, 128, { shift: true, raw: [95.7, 128.2] }))
    tool.up(pointer(96, 128, { shift: true }))
    expect(notes).toHaveLength(0)
    tool.commitPrompt('Leader')
    expect(notes[0]).toMatchObject({ position: [4, 3], leader: [96, 128] })
  })

  it('previews a dimension drag and commits once on release without moving its points', () => {
    const dimension: SheetDimension = { id: 'dimension', first: [0, 0], second: [384, 0], orientation: 'horizontal', position: -32 }
    const { tool, updates, selected } = setup('select', { kind: 'dimension', value: dimension })
    tool.down(pointer(96, -30, { hit: 'dimension' }))
    expect(selected()).toBe('dimension')
    tool.move(pointer(100, -60.4))
    tool.move(pointer(100, -70.4))
    expect(updates).toHaveLength(0)
    expect(tool.preview()?.value).toEqual({ ...dimension, position: -72 })
    tool.up(pointer(100, -70.4))
    expect(updates).toEqual([{ kind: 'dimension', value: { ...dimension, position: -72 } }])
    expect(tool.preview()).toBeNull()
  })

  it('moves note text in paper coordinates and leaves its leader fixed', () => {
    const note: SheetNote = { id: 'note', text: 'Text', position: [2, 3], leader: [0, 0] }
    const { tool, updates } = setup('select', { kind: 'note', value: note })
    tool.down(pointer(10, 10, { hit: 'note', paper: [2.1, 3.1] }))
    tool.move(pointer(30, 40, { paper: [3.1, 5.1] }))
    tool.up(pointer(30, 40, { paper: [3.1, 5.1] }))
    expect(updates).toHaveLength(1)
    expect(updates[0]?.value).toMatchObject({ id: 'note', text: 'Text', leader: [0, 0] })
    const moved = updates[0]?.value as SheetNote
    expect(moved.position[0]).toBeCloseTo(3)
    expect(moved.position[1]).toBeCloseTo(5)
  })

  it('cancels a drag and treats motion below the screen threshold as selection only', () => {
    const note: SheetNote = { id: 'note', text: 'Text', position: [2, 3] }
    const { tool, updates } = setup('select', { kind: 'note', value: note })
    tool.down(pointer(10, 10, { hit: 'note' }))
    tool.move(pointer(11, 11))
    tool.up(pointer(11, 11))
    expect(updates).toHaveLength(0)
    tool.down(pointer(10, 10, { hit: 'note' }))
    tool.move(pointer(50, 50))
    expect(tool.key('Escape')).toBe(true)
    tool.up(pointer(50, 50))
    expect(updates).toHaveLength(0)
    expect(tool.preview()).toBeNull()
  })

  it('edits existing note text without replacing its placement or leader', () => {
    const note: SheetNote = { id: 'note', text: 'Text', position: [2, 3], leader: [16, 32] }
    const { tool, updates, notes } = setup('select', { kind: 'note', value: note })
    tool.edit(note)
    expect(tool.prompt()?.text).toBe('Text')
    tool.commitPrompt('Changed\ntext')
    expect(updates).toEqual([{ kind: 'note', value: { ...note, text: 'Changed\ntext' } }])
    expect(notes).toHaveLength(0)
  })
})
