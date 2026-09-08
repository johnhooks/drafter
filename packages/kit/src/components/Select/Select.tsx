import type { ReactNode } from 'react'
import {
  Button,
  FieldError,
  Label,
  ListBox,
  ListBoxItem,
  type ListBoxItemProps,
  Popover,
  Select as AriaSelect,
  type SelectProps as AriaSelectProps,
  SelectValue,
  Text,
} from 'react-aria-components'
import { Icon } from '../Icon/Icon'
import '../TextField/TextField.css'
import './Select.css'

export interface SelectProps<T extends object> extends Omit<AriaSelectProps<T>, 'children'> {
  readonly label?: ReactNode
  readonly description?: ReactNode
  readonly error?: string
  readonly items?: Iterable<T>
  readonly children: ReactNode | ((item: T) => ReactNode)
}

/** A dropdown for choosing one of a few options. */
export function Select<T extends object>({ label, description, error, items, children, className, ...props }: SelectProps<T>) {
  return (
    <AriaSelect {...props} isInvalid={!!error || props.isInvalid} className={['kit-textfield', 'kit-select', typeof className === 'string' ? className : ''].join(' ').trim()}>
      {label && <Label className="kit-field-label">{label}</Label>}
      <Button className="kit-select-button">
        <SelectValue className="kit-select-value" />
        <Icon name="chevron-down" className="kit-select-chevron" />
      </Button>
      {description && !error && (
        <Text slot="description" className="kit-field-description">
          {description}
        </Text>
      )}
      <FieldError className="kit-field-error">{error}</FieldError>
      <Popover className="kit-popover" offset={2}>
        <ListBox className="kit-select-list" items={items}>
          {children}
        </ListBox>
      </Popover>
    </AriaSelect>
  )
}

export function SelectItem(props: ListBoxItemProps & { children: ReactNode }) {
  return <ListBoxItem {...props} className="kit-select-item" />
}
