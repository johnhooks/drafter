/**
 * Key chords as data: `Mod+Shift+Z`, `A`, `Delete`, `1`. Mod is Cmd on macOS and Ctrl elsewhere,
 * so one default reads the same on both. Letters are stored upper case and matched without case.
 */
export interface Chord {
  readonly key: string
  readonly mod: boolean
  readonly shift: boolean
  readonly alt: boolean
}

export const isMac = () => typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)

const NAMED = new Set(['Delete', 'Backspace', 'Escape', 'Enter', 'Home', 'End', 'Tab', 'Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'PageUp', 'PageDown'])

export type ChordParse = { ok: true; chord: Chord } | { ok: false; error: string }

/** Parses text such as `mod+shift+z` or `Delete`; the last part is the key, the rest modifiers. */
export function parseChord(text: string): ChordParse {
  const parts = text
    .trim()
    .split('+')
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
  if (parts.length === 0) return { ok: false, error: 'Type a key, such as A or Mod+Shift+Z' }
  const chord = { key: '', mod: false, shift: false, alt: false }
  for (const part of parts.slice(0, -1)) {
    const m = part.toLowerCase()
    if (m === 'mod' || m === 'cmd' || m === 'ctrl' || m === 'command' || m === 'control') chord.mod = true
    else if (m === 'shift') chord.shift = true
    else if (m === 'alt' || m === 'option') chord.alt = true
    else return { ok: false, error: `${part} is not a modifier; use Mod, Shift, or Alt` }
  }
  const raw = parts[parts.length - 1]!
  const named = [...NAMED].find((n) => n.toLowerCase() === raw.toLowerCase())
  if (named) chord.key = named
  else if (raw.length === 1) chord.key = raw.toUpperCase()
  else return { ok: false, error: `${raw} is not a key; use a single character or Delete, Backspace, Escape, Enter, Home, End` }
  return { ok: true, chord }
}

/** The stored and displayed form: modifiers in Mod, Shift, Alt order, then the key. */
export function formatChord(c: Chord, platformMod = false, mac = isMac()): string {
  const mod = platformMod ? (mac ? 'Cmd' : 'Ctrl') : 'Mod'
  return [c.mod ? mod : null, c.shift ? 'Shift' : null, c.alt ? 'Alt' : null, c.key].filter((x): x is string => !!x).join('+')
}

/** Display text for a stored chord string, with Mod spelled for this platform; unparsable text is returned as is. */
export function displayChord(stored: string): string {
  const p = parseChord(stored)
  return p.ok ? formatChord(p.chord, true) : stored
}

/** True when a keyboard event is exactly this chord: the same key and the same modifiers, no more. */
export function matchesChord(e: Pick<KeyboardEvent, 'key' | 'metaKey' | 'ctrlKey' | 'shiftKey' | 'altKey'>, c: Chord, mac = isMac()): boolean {
  const mod = mac ? e.metaKey : e.ctrlKey
  const other = mac ? e.ctrlKey : e.metaKey
  if (other || mod !== c.mod || e.shiftKey !== c.shift || e.altKey !== c.alt) return false
  const key = e.key === ' ' ? 'Space' : e.key
  return key.length === 1 ? key.toUpperCase() === c.key : key === c.key
}

export const sameChord = (a: Chord, b: Chord) => a.key === b.key && a.mod === b.mod && a.shift === b.shift && a.alt === b.alt
