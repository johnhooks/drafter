import { ToggleButton as AriaToggleButton, type ToggleButtonProps as AriaToggleButtonProps } from 'react-aria-components'
import '../Button/Button.css'
import './ToggleButton.css'

export type ToggleButtonProps = AriaToggleButtonProps

/** A button that stays pressed. Selected state uses the accent, like an active tool. */
export function ToggleButton({ className, ...props }: ToggleButtonProps) {
  return (
    <AriaToggleButton
      {...props}
      className={['kit-button', 'kit-toggle-button', typeof className === 'string' ? className : ''].join(' ').trim()}
    />
  )
}
