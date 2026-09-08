import type { HTMLAttributes, ReactNode } from 'react'
import './Layout.css'

export interface PanelProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  readonly title?: ReactNode
  /** Controls at the right of the header. */
  readonly actions?: ReactNode
  readonly children: ReactNode
  /** Which edge carries the divider line. */
  readonly edge?: 'left' | 'right' | 'top' | 'bottom' | 'none'
}

/** A panel with an optional header, on the panel surface, with a divider on one edge. */
export function Panel({ title, actions, children, edge = 'none', className, ...props }: PanelProps) {
  return (
    <div {...props} data-edge={edge} className={['kit-panel', className ?? ''].join(' ').trim()}>
      {(title || actions) && (
        <div className="kit-panel-header">
          {title && <span className="kit-panel-title">{title}</span>}
          {actions && <span className="kit-panel-actions">{actions}</span>}
        </div>
      )}
      <div className="kit-panel-body">{children}</div>
    </div>
  )
}

/** Vertical stack of fields with the standard gap. */
export function Fields({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...props} className={['kit-fields', className ?? ''].join(' ').trim()}>
      {children}
    </div>
  )
}

/** Horizontal group of equal-width children, for pairs like Left and Bottom. */
export function Row({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...props} className={['kit-row', className ?? ''].join(' ').trim()}>
      {children}
    </div>
  )
}

export interface FieldProps extends HTMLAttributes<HTMLDivElement> {
  readonly label?: ReactNode
  readonly error?: ReactNode
  readonly children: ReactNode
}

/** Label above any content that is not itself a field component, for example a read-only value. */
export function Field({ label, error, children, className, ...props }: FieldProps) {
  return (
    <div {...props} className={['kit-field', className ?? ''].join(' ').trim()}>
      {label && <span className="kit-field-label">{label}</span>}
      <div className="kit-field-content">{children}</div>
      {error && <span className="kit-field-error">{error}</span>}
    </div>
  )
}

/** Muted helper text. */
export function Hint({ children, className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p {...props} className={['kit-hint', className ?? ''].join(' ').trim()}>
      {children}
    </p>
  )
}
