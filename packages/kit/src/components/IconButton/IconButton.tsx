import { Button as AriaButton, type ButtonProps as AriaButtonProps } from 'react-aria-components'
import { Icon, type IconName } from '../Icon/Icon'
import { Tooltip, TooltipTrigger } from '../Tooltip/Tooltip'
import './IconButton.css'

export type IconButtonSize = 'sm' | 'md'

export interface IconButtonProps extends Omit<AriaButtonProps, 'children'> {
  readonly icon: IconName
  /** Required: icon-only controls need a name. Shown as the tooltip too. */
  readonly 'aria-label': string
  /** sm is 18 px for inside rows and toasts; md is the 24 px control height. */
  readonly size?: IconButtonSize
  readonly tone?: 'neutral' | 'danger'
  readonly tooltip?: boolean
}

/** A square, quiet button holding one icon. No chrome at rest; hover shows a faint square. */
export function IconButton({ icon, size = 'md', tone = 'neutral', tooltip = true, className, ...props }: IconButtonProps) {
  const button = (
    <AriaButton {...props} data-size={size} data-tone={tone} className={['kit-icon-button', typeof className === 'string' ? className : ''].join(' ').trim()}>
      <Icon name={icon} size={size === 'sm' ? 12 : 14} />
    </AriaButton>
  )
  if (!tooltip) return button
  return (
    <TooltipTrigger>
      {button}
      <Tooltip>{props['aria-label']}</Tooltip>
    </TooltipTrigger>
  )
}
