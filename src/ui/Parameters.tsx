import { Button, Disclosure, Hint, IconButton, ListBox, ListBoxItem, Row, TextField } from '@bitmachina/drafter-kit'
import { useState } from 'react'
import type { Sixteenths } from '../core/units'
import { formatLength } from '../core/units'
import { validateParamName } from '../core/model/params'
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
  const trimmedName = name.trim()
  const nameError = trimmedName ? validateParamName(trimmedName, params.map((p) => p.name)) : null
  const parsed = value.trim() ? parseLen(value) : null
  const valueError = parsed && !parsed.ok ? parsed.error : null
  const canAdd = !!trimmedName && !nameError && !!parsed && parsed.ok
  const add = () => {
    if (!canAdd || !parsed || !parsed.ok) return
    dispatch('addParam', trimmedName, parsed.value)
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
        {/* live inputs, not commit-on-blur fields: the Add button must see what is typed as it is typed */}
        <Row>
          <label className="kit-textfield">
            <span className="kit-field-label">New name</span>
            <input
              className="kit-input"
              aria-label="New name"
              value={name}
              placeholder="ply"
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && canAdd && add()}
            />
          </label>
          <label className="kit-textfield">
            <span className="kit-field-label">Value</span>
            <input
              className="kit-input"
              aria-label="Value"
              value={value}
              placeholder="3/4"
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && canAdd && add()}
            />
          </label>
        </Row>
        {nameError && <Hint>{nameError}</Hint>}
        {valueError && <Hint>{valueError}</Hint>}
        <Button isDisabled={!canAdd} onPress={add}>
          Add parameter
        </Button>
      </div>
    </Disclosure>
  )
}
