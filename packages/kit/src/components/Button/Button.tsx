import { Button as AriaButton, type ButtonProps as AriaButtonProps } from 'react-aria-components'
import './Button.css'

export type ButtonVariant = 'default' | 'primary' | 'quiet'
export type ButtonTone = 'neutral' | 'danger'

export interface ButtonProps extends AriaButtonProps {
  readonly variant?: ButtonVariant
  readonly tone?: ButtonTone
}

/** A labelled action. For an icon-only control use IconButton. */
export function Button({ variant = 'default', tone = 'neutral', className, ...props }: ButtonProps) {
  return (
    <AriaButton
      {...props}
      data-variant={variant}
      data-tone={tone}
      className={['kit-button', typeof className === 'string' ? className : ''].join(' ').trim()}
    />
  )
}
