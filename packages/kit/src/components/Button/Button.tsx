import { Button as AriaButton, type ButtonProps as AriaButtonProps } from 'react-aria-components'
import './Button.css'

export type ButtonVariant = 'default' | 'primary' | 'quiet'
export type ButtonTone = 'neutral' | 'danger'

export interface ButtonProps extends AriaButtonProps {
  readonly variant?: ButtonVariant
  readonly tone?: ButtonTone
  /** Square button for an icon or a single character. */
  readonly square?: boolean
}

export function Button({ variant = 'default', tone = 'neutral', square, className, ...props }: ButtonProps) {
  return (
    <AriaButton
      {...props}
      data-variant={variant}
      data-tone={tone}
      data-square={square || undefined}
      className={['kit-button', typeof className === 'string' ? className : ''].join(' ').trim()}
    />
  )
}
