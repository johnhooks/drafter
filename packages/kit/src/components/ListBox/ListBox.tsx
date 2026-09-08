import type { ReactNode } from 'react'
import { ListBox as AriaListBox, ListBoxItem as AriaListBoxItem, type ListBoxItemProps as AriaListBoxItemProps, type ListBoxProps as AriaListBoxProps, Text } from 'react-aria-components'
import './ListBox.css'

export interface ListBoxProps<T extends object> extends AriaListBoxProps<T> {
  /** Dense rows, 20 px; the default is the 24 px control height. */
  readonly dense?: boolean
  /**
   * The most actions any row carries. Every row reserves a gutter that wide so details align
   * whether a row's actions are hidden, fewer, or absent.
   */
  readonly actionSlots?: number
}

const SLOT_W = 18
const SLOT_GAP = 2

/** A list of selectable rows: the timeline, rectangle lists, constraint lists. */
export function ListBox<T extends object>({ dense, actionSlots = 0, className, style, ...props }: ListBoxProps<T>) {
  const gutter = actionSlots > 0 ? actionSlots * SLOT_W + (actionSlots - 1) * SLOT_GAP : 0
  return (
    <AriaListBox
      {...props}
      data-dense={dense || undefined}
      style={{ ...(style as object), ['--kit-listbox-actions-w' as string]: `${gutter}px` }}
      className={['kit-listbox', typeof className === 'string' ? className : ''].join(' ').trim()}
    />
  )
}

export interface ListBoxItemProps extends Omit<AriaListBoxItemProps, 'children'> {
  readonly children: ReactNode
  /** Secondary text after the label, muted. */
  readonly detail?: ReactNode
  /** Trailing controls, for example remove or edit buttons. Clicks inside do not select the row. */
  readonly actions?: ReactNode
  readonly tone?: 'neutral' | 'error'
}

export function ListBoxItem({ children, detail, actions, tone = 'neutral', className, textValue, ...props }: ListBoxItemProps) {
  return (
    <AriaListBoxItem
      {...props}
      textValue={textValue ?? (typeof children === 'string' ? children : undefined)}
      data-tone={tone}
      className={['kit-listbox-item', typeof className === 'string' ? className : ''].join(' ').trim()}
    >
      <Text slot="label" className="kit-listbox-label">
        {children}
      </Text>
      {detail !== undefined && (
        <Text slot="description" className="kit-listbox-detail">
          {detail}
        </Text>
      )}
      {actions && (
        <span className="kit-listbox-actions" onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
          {actions}
        </span>
      )}
    </AriaListBoxItem>
  )
}
