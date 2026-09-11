import { useEffect, useMemo } from 'react'
import { bindingOf, chordOf } from './bindings'
import { type Command, type CommandContext, type ViewHooks, commandById, commandsFor } from './commands'
import { displayChord, matchesChord, parseChord } from './keys'
import { useStore } from './store/store'

/**
 * The views' callbacks, registered while a view is mounted. A plain module object rather than store
 * state because the callbacks close over refs and animation frames the store must not hold.
 */
const hooks: ViewHooks = {}

/** Registers a view's callbacks for the commands that need them, and clears them on unmount. */
export function useViewHooks(h: ViewHooks) {
  useEffect(() => {
    Object.assign(hooks, h)
    return () => {
      for (const k of Object.keys(h) as Array<keyof ViewHooks>) delete hooks[k]
    }
  })
}

function contextNow(): CommandContext {
  const state = useStore.getState()
  return { state, dispatch: state.dispatch, hooks }
}

export function runCommand(cmd: Command): boolean {
  const ctx = contextNow()
  if (cmd.when && !cmd.when(ctx.state)) return false
  cmd.run(ctx)
  return true
}

const isText = (t: EventTarget | null) => t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement || (t instanceof HTMLElement && t.isContentEditable)

/**
 * The one key handler: a press resolves against the commands of the current view and their bound
 * chords, and the first enabled match runs. Text fields keep every key; Escape there is the field's
 * own revert. A tool with a drag or chain in progress consumes Escape and Enter itself first.
 */
export function useKeyHandler() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isText(e.target)) return
      const s = useStore.getState()
      if (s.mode.kind === 'sketch' && (e.key === 'Escape' || e.key === 'Enter') && hooks.toolConsumes?.(e.key)) {
        e.preventDefault()
        return
      }
      for (const cmd of commandsFor(s.mode)) {
        const chord = chordOf(cmd, s.keys)
        const alias = cmd.alias ? parseChord(cmd.alias) : null
        const hit = (chord && matchesChord(e, chord)) || (alias?.ok && matchesChord(e, alias.chord))
        if (!hit) continue
        if (runCommand(cmd)) e.preventDefault()
        return
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}

export interface CommandView {
  readonly label: string
  /** Label plus the bound chord, for tooltips: "Select (A)". */
  readonly tooltip: string
  readonly chord: string | null
  readonly enabled: boolean
  readonly run: () => void
}

/** What a control needs from a command: its label, its key for the tooltip, and whether it is enabled now. */
export function useCommand(id: string): CommandView {
  const cmd = commandById(id)
  if (!cmd) throw new Error(`Unknown command ${id}`)
  const keys = useStore((s) => s.keys)
  const enabled = useStore((s) => (cmd.when ? cmd.when(s) : true))
  return useMemo(() => {
    const bound = bindingOf(cmd, keys)
    const chord = bound ? displayChord(bound) : null
    return { label: cmd.label, tooltip: chord ? `${cmd.label} (${chord})` : cmd.label, chord, enabled, run: () => runCommand(cmd) }
  }, [cmd, keys, enabled])
}
