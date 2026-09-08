import { type ReactNode, useEffect, useRef, useState } from 'react'
import { FieldError, Input, Label, Text, TextField as AriaTextField, type TextFieldProps as AriaTextFieldProps } from 'react-aria-components'
import './TextField.css'

export type Validation<T> = { ok: true; value: T } | { ok: false; error: string }

export interface TextFieldProps<T = string> extends Omit<AriaTextFieldProps, 'value' | 'defaultValue' | 'onChange' | 'validate'> {
  readonly label?: ReactNode
  readonly description?: ReactNode
  /** The committed text. The field edits a draft and only reports back through onCommit. */
  readonly value: string
  /** Parses the draft; a failure keeps the field open with the message. Defaults to accepting any text. */
  readonly validate?: (text: string) => Validation<T>
  /** Called on Enter or blur when the draft differs from `value` and validates. */
  readonly onCommit: (value: T, text: string) => void
  /** Error from outside, shown when the draft is clean. */
  readonly error?: string
  /** Shown muted with a dashed frame: the value is computed from others. */
  readonly derived?: boolean
  readonly monospace?: boolean
  readonly placeholder?: string
}

/**
 * A text field with commit semantics: type freely, Enter or blur commits, Escape reverts.
 * Invalid text stays in the field with its message until fixed or reverted.
 */
export function TextField<T = string>({ label, description, value, validate, onCommit, error, derived, monospace, placeholder, className, ...props }: TextFieldProps<T>) {
  const [draft, setDraft] = useState(value)
  const [draftError, setDraftError] = useState<string | null>(null)
  // Escape reverts then blurs; the blur must not commit the draft that state has not yet dropped
  const reverting = useRef(false)
  useEffect(() => {
    setDraft(value)
    setDraftError(null)
  }, [value])
  const commit = () => {
    if (reverting.current) {
      reverting.current = false
      return
    }
    if (draft === value) {
      setDraftError(null)
      return
    }
    const r = validate ? validate(draft) : ({ ok: true, value: draft as unknown as T } as Validation<T>)
    if (!r.ok) return setDraftError(r.error)
    setDraftError(null)
    onCommit(r.value, draft)
  }
  const shown = draftError ?? (draft === value ? error : undefined)
  return (
    <AriaTextField
      {...props}
      value={draft}
      onChange={(t) => {
        setDraft(t)
        setDraftError(null)
      }}
      isInvalid={!!shown}
      data-derived={derived || undefined}
      data-monospace={monospace || undefined}
      className={['kit-textfield', typeof className === 'string' ? className : ''].join(' ').trim()}
      onKeyDown={(e) => {
        if (e.key === 'Enter') commit()
        if (e.key === 'Escape') {
          reverting.current = true
          setDraft(value)
          setDraftError(null)
          ;(e.target as HTMLElement).blur()
        }
      }}
      onBlur={commit}
    >
      {label && (
        <Label className="kit-field-label">
          {label}
          {derived && <em className="kit-field-derived"> (derived)</em>}
        </Label>
      )}
      <Input className="kit-input" placeholder={placeholder} />
      {description && !shown && (
        <Text slot="description" className="kit-field-description">
          {description}
        </Text>
      )}
      <FieldError className="kit-field-error">{shown}</FieldError>
    </AriaTextField>
  )
}
