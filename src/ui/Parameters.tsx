import { Button, Disclosure, Hint, IconButton, ListBox, ListBoxItem, Row, TextField } from '@drawing/kit'
import { useState } from 'react'
import type { Len } from '../core/model/types'
import type { Sixteenths } from '../core/units'
import { formatLength } from '../core/units'
import { LenField, parseLen } from './LenField'
import { useStore } from './store/store'

export function Parameters() {
  const params = useStore((s) => s.doc.params)
  const values = useStore((s) => s.eval.params)
  const errors = useStore((s) => s.eval.paramErrors)
  const dispatch = useStore((s) => s.dispatch)
  const [selected, setSelected] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [value, setValue] = useState('')
  const current = params.find((p) => p.name === selected)
  const add = () => {
    const r = parseLen(value)
    if (!r.ok) return dispatch('notify', r.error)
    dispatch('addParam', name.trim(), r.value)
    setName('')
    setValue('')
  }
  return (
    <Disclosure title="Parameters" trailing={String(params.length)}>
      {params.length === 0 && <Hint>Named lengths you can use in expressions, like ply = 3/4.</Hint>}
      <ListBox
        aria-label="Parameters"
        dense
        selectionMode="single"
        actionSlots={1}
        selectedKeys={selected ? [selected] : []}
        onSelectionChange={(keys) => setSelected(keys === 'all' ? null : ((([...keys][0] as string) ?? null) as string | null))}
      >
        {params.map((p) => {
          const err = errors.get(p.name)
          const v = values.get(p.name)?.value
          return (
            <ListBoxItem
              key={p.name}
              id={p.name}
              textValue={p.name}
              tone={err ? 'error' : 'neutral'}
              detail={err ?? (v !== undefined ? formatLength(v as Sixteenths) : '')}
              actions={<IconButton icon="trash" size="sm" tone="danger" aria-label="Delete" onPress={() => dispatch('deleteParam', p.name)} />}
            >
              {p.name}
            </ListBoxItem>
          )
        })}
      </ListBox>
      {current && (
        <Row>
          <TextField
            label="Name"
            value={current.name}
            validate={(t) => (/^[A-Za-z_][A-Za-z0-9_]*$/.test(t.trim()) ? { ok: true, value: t.trim() } : { ok: false, error: 'Letters, digits, and underscores; start with a letter' })}
            onCommit={(v) => {
              dispatch('renameParam', current.name, v)
              setSelected(v)
            }}
          />
          <LenField label="Value" value={current.value} resolved={values.get(current.name)?.value} error={errors.get(current.name)} onCommit={(v) => dispatch('setParamValue', current.name, v)} />
        </Row>
      )}
      <div className="param-add">
        <Row>
          <TextField label="New name" value={name} onCommit={(_v, t) => setName(t.trim())} />
          <TextField<Len> label="Value" value={value} onCommit={(_v, t) => setValue(t.trim())} validate={(t) => parseLen(t)} />
        </Row>
        <Button isDisabled={!name || !value} onPress={add}>
          Add parameter
        </Button>
      </div>
    </Disclosure>
  )
}
