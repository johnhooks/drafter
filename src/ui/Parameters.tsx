import { useState } from 'react'
import type { Sixteenths } from '../core/units'
import { LenField, parseLen } from './LenField'
import { useStore } from './store/store'

export function Parameters() {
  const params = useStore((s) => s.doc.params)
  const values = useStore((s) => s.eval.params)
  const errors = useStore((s) => s.eval.paramErrors)
  const dispatch = useStore((s) => s.dispatch)
  const [name, setName] = useState('')
  const [value, setValue] = useState('')
  const add = () => {
    const r = parseLen(value)
    if (!r.ok) return dispatch('notify', r.error)
    dispatch('addParam', name.trim(), r.value)
    setName('')
    setValue('')
  }
  return (
    <div className="params">
      <h3>Parameters</h3>
      {params.length === 0 && <div className="muted">Named lengths you can use in expressions, like ply = 3/4.</div>}
      {params.map((p) => (
        <div className="param" key={p.name}>
          <NameField name={p.name} />
          <LenField
            label="Value"
            value={p.value}
            resolved={values.get(p.name)?.value as Sixteenths | undefined}
            error={errors.get(p.name)}
            onCommit={(v) => dispatch('setParamValue', p.name, v)}
          />
          <button className="danger" title="Delete" onClick={() => dispatch('deleteParam', p.name)}>
            x
          </button>
        </div>
      ))}
      <div className="param add">
        <label className="field">
          <span>Name</span>
          <input value={name} placeholder="ply" onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} />
        </label>
        <label className="field">
          <span>Value</span>
          <input value={value} placeholder="3/4" onChange={(e) => setValue(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} />
        </label>
        <button disabled={!name.trim() || !value.trim()} onClick={add}>
          Add
        </button>
      </div>
    </div>
  )
}

function NameField({ name }: { name: string }) {
  const dispatch = useStore((s) => s.dispatch)
  const [text, setText] = useState(name)
  const commit = () => {
    if (text.trim() !== name) dispatch('renameParam', name, text.trim())
  }
  return (
    <label className="field">
      <span>Name</span>
      <input value={text} onChange={(e) => setText(e.target.value)} onBlur={commit} onKeyDown={(e) => e.key === 'Enter' && commit()} />
    </label>
  )
}
