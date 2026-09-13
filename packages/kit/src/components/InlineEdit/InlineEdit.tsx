import { useLayoutEffect, useRef, useState } from 'react'
import { FieldError, Input, TextField } from 'react-aria-components'
import { Button } from '../Button/Button'
import type { Validation } from '../TextField/TextField'
import '../TextField/TextField.css'
import './InlineEdit.css'

export interface InlineEditProps {
  readonly label: string
  readonly value: string
  readonly emptyLabel?: string
  readonly monospace?: boolean
  readonly validate?: (text: string) => Validation<string>
  readonly onCommit: (value: string, text: string) => void
}

export function InlineEdit({ label, value, emptyLabel = 'Empty', monospace, validate, onCommit }: InlineEditProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const [error, setError] = useState<string | null>(null)
  const button = useRef<HTMLButtonElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const restoreFocus = useRef(false)
  const closing = useRef(false)
  useLayoutEffect(() => {
    if (editing) {
      input.current?.focus()
      input.current?.select()
    } else if (restoreFocus.current) {
      restoreFocus.current = false
      button.current?.focus()
    }
  }, [editing])
  const close = (restore: boolean) => {
    closing.current = true
    restoreFocus.current = restore
    setEditing(false)
  }
  const commit = (restore: boolean) => {
    if (closing.current) return
    if (draft !== value) {
      const result = validate ? validate(draft) : { ok: true as const, value: draft }
      if (!result.ok) { setError(result.error); return }
      onCommit(result.value, draft)
    }
    close(restore)
  }
  return <div className="kit-inline-edit" data-monospace={monospace || undefined}>
    {editing ? <TextField aria-label={label} value={draft} onChange={(text) => { setDraft(text); setError(null) }} isInvalid={!!error} onBlur={() => commit(false)} onKeyDown={(event) => {
      if (event.key === 'Enter' || event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        if (event.key === 'Escape') close(true)
        else commit(true)
      }
    }}>
      <Input ref={input} className="kit-input" />
      <FieldError className="kit-field-error">{error}</FieldError>
    </TextField> : <Button ref={button} variant="quiet" aria-label={`Edit ${label}, currently ${value || emptyLabel}`} onPress={() => {
      closing.current = false
      setDraft(value)
      setError(null)
      setEditing(true)
    }}>{value || emptyLabel}</Button>}
  </div>
}
