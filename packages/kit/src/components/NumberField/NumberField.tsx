import type { ReactNode } from 'react'
import { Button, FieldError, Group, Input, Label, NumberField as AriaNumberField, type NumberFieldProps as AriaNumberFieldProps, Text } from 'react-aria-components'
import { Icon } from '../Icon/Icon'
import '../TextField/TextField.css'
import './NumberField.css'

export interface NumberFieldProps extends AriaNumberFieldProps {
  readonly label?: ReactNode
  readonly description?: ReactNode
  readonly error?: string
}

/** A plain number with steppers. Lengths in inches use TextField with the application's parser instead. */
export function NumberField({ label, description, error, className, ...props }: NumberFieldProps) {
  return (
    <AriaNumberField {...props} isInvalid={!!error || props.isInvalid} className={['kit-textfield', 'kit-numberfield', typeof className === 'string' ? className : ''].join(' ').trim()}>
      {label && <Label className="kit-field-label">{label}</Label>}
      <Group className="kit-numberfield-group">
        <Input className="kit-input" />
        <div className="kit-numberfield-steppers">
          <Button slot="increment" className="kit-numberfield-step" aria-label="Increase">
            <Icon name="chevron-up" size={10} />
          </Button>
          <Button slot="decrement" className="kit-numberfield-step" aria-label="Decrease">
            <Icon name="chevron-down" size={10} />
          </Button>
        </div>
      </Group>
      {description && !error && (
        <Text slot="description" className="kit-field-description">
          {description}
        </Text>
      )}
      <FieldError className="kit-field-error">{error}</FieldError>
    </AriaNumberField>
  )
}
