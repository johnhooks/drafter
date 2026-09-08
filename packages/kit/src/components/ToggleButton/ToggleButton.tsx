import { ToggleButton as AriaToggleButton, type ToggleButtonProps as AriaToggleButtonProps } from 'react-aria-components'
import '../Button/Button.css'
import './ToggleButton.css'

export interface ToggleButtonProps extends AriaToggleButtonProps {
  readonly square?: boolean
}

/** A button that stays pressed. Selected state uses the accent, like an active tool. */
export function ToggleButton({ square, className, ...props }: ToggleButtonProps) {
  return (
    <AriaToggleButton
      {...props}
      data-square={square || undefined}
      className={['kit-button', 'kit-toggle-button', typeof className === 'string' ? className : ''].join(' ').trim()}
    />
  )
}
