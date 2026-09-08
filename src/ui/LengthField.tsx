import { useEffect, useState } from 'react'
import { type Sixteenths, formatLength, parseLength } from '../core/units'

interface Props {
  label: string
  value: Sixteenths
  onCommit: (v: Sixteenths) => void
  autoFocus?: boolean
}

/** Text field that shows a length as inches and only commits when the text parses. */
export function LengthField({ label, value, onCommit, autoFocus }: Props) {
  const [text, setText] = useState(formatLength(value))
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    setText(formatLength(value))
    setError(null)
  }, [value])
  const commit = () => {
    const r = parseLength(text)
    if (!r.ok) return setError(r.error)
    setError(null)
    if (r.value !== value) onCommit(r.value)
  }
  return (
    <label className="field">
      <span>{label}</span>
      <input
        className={error ? 'invalid' : ''}
        value={text}
        autoFocus={autoFocus}
        onChange={(e) => setText(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit()
          if (e.key === 'Escape') {
            setText(formatLength(value))
            setError(null)
            ;(e.target as HTMLInputElement).blur()
          }
        }}
      />
      {error && <div className="error">{error}</div>}
    </label>
  )
}
