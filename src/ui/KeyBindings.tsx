import { Button, Hint, InlineEdit } from '@bitmachina/drafter-kit'
import { useState } from 'react'
import { bindingOf, conflictFor } from './bindings'
import { COMMANDS, type Command, type CommandView } from './commands'
import { displayChord, formatChord, parseChord } from './keys'
import { useStore } from './store/store'
import './KeyBindings.css'

const VIEW_LABEL: Record<CommandView, string> = { sketch: 'sketch', model: 'model view', sheet: 'sheets', any: 'everywhere' }

export function KeyBindings() {
  const keys = useStore((s) => s.keys)
  const dispatch = useStore((s) => s.dispatch)
  const [resetVersion, setResetVersion] = useState(0)
  const bound = (cmd: Command) => bindingOf(cmd, keys)
  const shown = (cmd: Command) => {
    const b = bound(cmd)
    return b ? displayChord(b) : ''
  }
  const validate = (cmd: Command) => (text: string) => {
    if (text.trim() === '') return { ok: true as const, value: '' }
    const p = parseChord(text)
    if (!p.ok) return p
    const other = conflictFor(cmd, p.chord, keys)
    if (other) return { ok: false as const, error: `${formatChord(p.chord, true)} is already ${other.label} (${VIEW_LABEL[other.view]})` }
    return { ok: true as const, value: formatChord(p.chord) }
  }
  const commit = (cmd: Command, value: string) => {
    const chord = value === '' ? null : value
    dispatch('setKey', cmd.id, chord, chord === (cmd.key ?? null))
  }
  const overridden = Object.keys(keys).length > 0
  return (
    <div className="key-bindings">
      <Hint>Click a key, or focus it and press Enter, to edit. Type V or Mod+Shift+Z; leave it empty to unbind. Keys are remembered in this browser.</Hint>
      <div className="key-bindings-list">
        <table aria-label="Keyboard shortcuts">
          <thead><tr><th scope="col">Command</th><th scope="col">View</th><th scope="col">Key</th></tr></thead>
          <tbody key={resetVersion}>{COMMANDS.map((cmd) => (
            <tr key={cmd.id}>
              <th scope="row">{cmd.label}</th>
              <td>{VIEW_LABEL[cmd.view]}</td>
              <td><InlineEdit label={`${cmd.label} key`} value={shown(cmd)} emptyLabel="Unbound" monospace validate={validate(cmd)} onCommit={(value) => commit(cmd, value)} /></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      <div>
        <Button isDisabled={!overridden} onPress={() => { dispatch('resetKeys'); setResetVersion((version) => version + 1) }}>
          Reset keys
        </Button>
      </div>
    </div>
  )
}
