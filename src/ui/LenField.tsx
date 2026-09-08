import { TextField } from '@drawing/kit'
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

/** A kit text field that holds a length or an expression; the kit supplies commit, revert, and error display. */
export function LenField({ label, value, resolved, error, derived, onCommit, autoFocus, allowZero = true }: Props) {
  const expr = isExpr(value)
  return (
    <TextField<Len>
      label={label}
      value={lenText(value)}
      validate={(t) => parseLen(t, allowZero)}
      onCommit={(v) => onCommit(v)}
      error={error}
      description={expr && resolved !== undefined && !error ? `= ${formatLength(resolved as Sixteenths)}` : undefined}
      derived={derived}
      monospace={expr}
      autoFocus={autoFocus}
    />
  )
}
