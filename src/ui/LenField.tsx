import { useEffect, useRef, useState } from 'react'
import { parse } from '../core/expr/parser'
import type { Len } from '../core/model/types'
import { isExpr } from '../core/model/types'
import { type Sixteenths, formatLength, parseLength } from '../core/units'

interface Props {
  label: string
  value: Len
  /** Current evaluated value of an expression slot, if it evaluated. */
  resolved?: number
  /** Evaluation error for this slot, if any. */
  error?: string
  /** The slot is derived from the other two; shown muted, still editable. */
  derived?: boolean
  onCommit: (v: Len) => void
  autoFocus?: boolean
  allowZero?: boolean
}

export function lenText(value: Len): string {
  return isExpr(value) ? value : formatLength(value as Sixteenths)
}

/** Parses field text as a length first, then as an expression; returns the value to store or a syntax error. */
export function parseLen(text: string, allowZero = true): { ok: true; value: Len } | { ok: false; error: string } {
  const asLength = parseLength(text)
  if (asLength.ok) {
    if (!allowZero && asLength.value === 0) return { ok: false, error: 'Must not be zero' }
    return { ok: true, value: asLength.value }
  }
  const trimmed = text.trim()
  if (trimmed === '') return { ok: false, error: 'Enter a length or an expression' }
  try {
    parse(trimmed)
    return { ok: true, value: trimmed }
  } catch (e) {
    return { ok: false, error: `Not a length or a valid expression: ${(e as Error).message}` }
  }
}

/** Text field that holds a length or an expression and only commits when the text parses. */
export function LenField({ label, value, resolved, error, derived, onCommit, autoFocus, allowZero = true }: Props) {
  const [text, setText] = useState(lenText(value))
  const [syntax, setSyntax] = useState<string | null>(null)
  // Escape reverts then blurs; the blur must not commit the draft that state has not yet dropped
  const reverting = useRef(false)
  useEffect(() => {
    setText(lenText(value))
    setSyntax(null)
  }, [value])
  const commit = () => {
    if (reverting.current) {
      reverting.current = false
      return
    }
    if (text === lenText(value)) return
    const r = parseLen(text, allowZero)
    if (!r.ok) return setSyntax(r.error)
    setSyntax(null)
    onCommit(r.value)
  }
  const shown = syntax ?? error
  return (
    <label className={`field ${derived ? 'derived' : ''}`}>
      <span>
        {label}
        {derived && <em> (derived)</em>}
      </span>
      <input
        className={shown ? 'invalid' : isExpr(value) ? 'expr' : ''}
        value={text}
        autoFocus={autoFocus}
        onChange={(e) => setText(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit()
          if (e.key === 'Escape') {
            reverting.current = true
            setText(lenText(value))
            setSyntax(null)
            ;(e.target as HTMLInputElement).blur()
          }
        }}
      />
      {shown ? (
        <div className="error">{shown}</div>
      ) : isExpr(value) && resolved !== undefined ? (
        <div className="value">= {formatLength(resolved as Sixteenths)}</div>
      ) : null}
    </label>
  )
}
