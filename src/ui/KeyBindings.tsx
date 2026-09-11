import { Button, Disclosure, Hint, ListBox, ListBoxItem, Row, TextField } from '@bitmachina/drafter-kit'
import { useState } from 'react'
import { bindingOf, conflictFor } from './bindings'
import { COMMANDS, type Command, type CommandView, commandById } from './commands'
import { displayChord, formatChord, parseChord } from './keys'
import { useStore } from './store/store'

const VIEW_LABEL: Record<CommandView, string> = { sketch: 'sketch', model: 'model view', any: 'everywhere' }

/** Every command with its chord; select one to retype its key. Bindings are a browser preference. */
export function KeyBindings() {
  const keys = useStore((s) => s.keys)
  const dispatch = useStore((s) => s.dispatch)
  const [selected, setSelected] = useState<string | null>(null)
  const current = selected ? commandById(selected) : undefined
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
    <Disclosure title="Keys" trailing={overridden ? 'custom' : undefined} defaultExpanded={false}>
      <Hint>Select a command and type its key, such as V or Mod+Shift+Z. Leave it empty to unbind. Keys are remembered in this browser.</Hint>
      <ListBox aria-label="Keys" dense selectionMode="single" selectedKeys={selected ? [selected] : []} onSelectionChange={(k) => setSelected(k === 'all' ? null : (([...k][0] as string) ?? null))}>
        {COMMANDS.map((cmd) => (
          <ListBoxItem key={cmd.id} id={cmd.id} textValue={cmd.label} detail={`${shown(cmd) || 'unbound'}, ${VIEW_LABEL[cmd.view]}`}>
            {cmd.label}
          </ListBoxItem>
        ))}
      </ListBox>
      {current && (
        <Row>
          <TextField
            key={current.id}
            label={`${current.label} key`}
            value={shown(current)}
            monospace
            validate={validate(current)}
            onCommit={(v) => commit(current, v)}
          />
        </Row>
      )}
      <div>
        <Button isDisabled={!overridden} onPress={() => dispatch('resetKeys')}>
          Reset keys
        </Button>
      </div>
    </Disclosure>
  )
}
