import { describe, expect, it } from 'vitest'
import { bindingOf, conflictFor } from '../../src/ui/bindings'
import { COMMANDS, commandById, commandsFor, viewsOverlap } from '../../src/ui/commands'
import * as keys from '../../src/ui/keys'
import * as A from '../../src/ui/store/actions'

const ev = (key: string, mods: Partial<{ meta: boolean; ctrl: boolean; shift: boolean; alt: boolean }> = {}) => ({
  key,
  metaKey: !!mods.meta,
  ctrlKey: !!mods.ctrl,
  shiftKey: !!mods.shift,
  altKey: !!mods.alt,
})

describe('chords', () => {
  it('parses modifiers in any order and case, letters upper case, named keys by name', () => {
    expect(keys.parseChord('mod+shift+z')).toEqual({ ok: true, chord: { key: 'Z', mod: true, shift: true, alt: false } })
    expect(keys.parseChord('Shift+Cmd+z')).toEqual({ ok: true, chord: { key: 'Z', mod: true, shift: true, alt: false } })
    expect(keys.parseChord('a')).toEqual({ ok: true, chord: { key: 'A', mod: false, shift: false, alt: false } })
    expect(keys.parseChord('delete')).toEqual({ ok: true, chord: { key: 'Delete', mod: false, shift: false, alt: false } })
    expect(keys.parseChord('1')).toEqual({ ok: true, chord: { key: '1', mod: false, shift: false, alt: false } })
    expect(keys.parseChord('')).toMatchObject({ ok: false })
    expect(keys.parseChord('Foo+A')).toMatchObject({ ok: false, error: /Foo is not a modifier/ })
    expect(keys.parseChord('Bogus')).toMatchObject({ ok: false, error: /Bogus is not a key/ })
  })
  it('formats with Mod, or Cmd and Ctrl by platform', () => {
    const c = keys.parseChord('mod+shift+z')
    if (!c.ok) throw new Error()
    expect(keys.formatChord(c.chord)).toBe('Mod+Shift+Z')
    expect(keys.formatChord(c.chord, true, true)).toBe('Cmd+Shift+Z')
    expect(keys.formatChord(c.chord, true, false)).toBe('Ctrl+Shift+Z')
  })
  it('matches events by platform modifier and ignores case on letters', () => {
    const z = keys.parseChord('Mod+Shift+Z')
    const a = keys.parseChord('A')
    if (!z.ok || !a.ok) throw new Error()
    expect(keys.matchesChord(ev('z', { meta: true, shift: true }), z.chord, true)).toBe(true)
    expect(keys.matchesChord(ev('Z', { meta: true, shift: true }), z.chord, true)).toBe(true)
    expect(keys.matchesChord(ev('z', { ctrl: true, shift: true }), z.chord, true)).toBe(false)
    expect(keys.matchesChord(ev('z', { meta: true }), z.chord, true)).toBe(false)
    expect(keys.matchesChord(ev('a'), a.chord, true)).toBe(true)
    expect(keys.matchesChord(ev('a', { shift: true }), a.chord, true)).toBe(false)
    expect(keys.matchesChord(ev('z', { ctrl: true, shift: true }), z.chord, false)).toBe(true)
    expect(keys.matchesChord(ev('z', { meta: true, shift: true }), z.chord, false)).toBe(false)
  })
})

describe('command table', () => {
  it('has unique ids and no two defaults share a chord in views that can coincide', () => {
    const ids = COMMANDS.map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const c of COMMANDS) {
      const chord = c.key ? keys.parseChord(c.key) : null
      if (!chord) continue
      if (!chord.ok) throw new Error(`${c.id}: ${chord.error}`)
      expect(conflictFor(c, chord.chord, {})?.id, `${c.id} shares ${c.key}`).toBeUndefined()
    }
  })
  it('scopes commands by view', () => {
    expect(commandsFor({ kind: 'sketch', sketchId: 's' }).map((c) => c.id)).toContain('tool.select')
    expect(commandsFor({ kind: 'sketch', sketchId: 's' }).map((c) => c.id)).not.toContain('view.front')
    expect(commandsFor({ kind: 'model' }).map((c) => c.id)).toContain('view.front')
    expect(commandsFor({ kind: 'model' }).map((c) => c.id)).toContain('edit.undo')
    expect(viewsOverlap('model', 'sketch')).toBe(false)
    expect(viewsOverlap('any', 'sketch')).toBe(true)
  })
  it('the drawing-program defaults are in place', () => {
    expect(['tool.select', 'tool.line', 'tool.rect', 'tool.link'].map((id) => commandById(id)!.key)).toEqual(['A', 'L', 'R', 'D'])
    expect(commandById('view.fit')!.key).toBe('F')
    expect(commandById('edit.undo')!.key).toBe('Mod+Z')
  })
})

describe('bindings', () => {
  it('override wins, null unbinds, a default value drops the override', () => {
    const select = commandById('tool.select')!
    let s = A.initialState()
    expect(bindingOf(select, s.keys)).toBe('A')
    s = A.setKey(s, 'tool.select', 'V', false)
    expect(bindingOf(select, s.keys)).toBe('V')
    s = A.setKey(s, 'tool.select', null, false)
    expect(bindingOf(select, s.keys)).toBeNull()
    s = A.setKey(s, 'tool.select', 'A', true)
    expect(s.keys).toEqual({})
    s = A.setKey(s, 'tool.select', 'V', false)
    s = A.resetKeys(s)
    expect(s.keys).toEqual({})
  })
  it('a chord held by another command in a coinciding view is a conflict; another view is not', () => {
    const line = commandById('tool.line')!
    const fit = commandById('view.fit')!
    const a = keys.parseChord('A')
    if (!a.ok) throw new Error()
    expect(conflictFor(line, a.chord, {})?.id).toBe('tool.select')
    expect(conflictFor(fit, a.chord, {})).toBeUndefined()
    // an override moves the conflict with it
    expect(conflictFor(line, a.chord, { 'tool.select': 'V' })).toBeUndefined()
    const z = keys.parseChord('Mod+Z')
    if (!z.ok) throw new Error()
    expect(conflictFor(fit, z.chord, {})?.id).toBe('edit.undo')
  })
  it('bindings survive loading a document', () => {
    let s = A.setKey(A.initialState(), 'tool.select', 'V', false)
    s = A.loadDocument(s, A.initialState().doc)
    expect(s.keys).toEqual({ 'tool.select': 'V' })
  })
})
