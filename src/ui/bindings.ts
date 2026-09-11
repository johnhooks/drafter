import { type Command, COMMANDS, viewsOverlap } from './commands'
import { type Chord, parseChord, sameChord } from './keys'
import type { State } from './store/actions'

/** The chord a command is bound to now: the override if there is one, else its default; null when unbound. */
export function bindingOf(cmd: Command, keys: State['keys']): string | null {
  return cmd.id in keys ? keys[cmd.id]! : (cmd.key ?? null)
}

export function chordOf(cmd: Command, keys: State['keys']): Chord | null {
  const text = bindingOf(cmd, keys)
  if (!text) return null
  const p = parseChord(text)
  return p.ok ? p.chord : null
}

/** The other command already holding this chord in a view that can coincide with `cmd`'s, if any. */
export function conflictFor(cmd: Command, chord: Chord, keys: State['keys']): Command | undefined {
  return COMMANDS.find((other) => {
    if (other.id === cmd.id || !viewsOverlap(other.view, cmd.view)) return false
    const c = chordOf(other, keys)
    return !!c && sameChord(c, chord)
  })
}
