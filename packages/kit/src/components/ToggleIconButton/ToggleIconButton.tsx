import { ToggleButton as AriaToggleButton, type ToggleButtonProps as AriaToggleButtonProps } from 'react-aria-components'
import { Icon, type IconName } from '../Icon/Icon'
import '../IconButton/IconButton.css'
import { Tooltip, TooltipTrigger } from '../Tooltip/Tooltip'
import './ToggleIconButton.css'

export interface ToggleIconButtonProps extends Omit<AriaToggleButtonProps, 'children'> {
  readonly icon: IconName
  /** Required: icon-only controls need a name. Shown as the tooltip too. */
  readonly 'aria-label': string
  readonly tooltip?: boolean
}

/**
 * An icon that is on or off: view state such as grid or dimensions. Quiet at rest like an IconButton,
 * accent-filled when on like an active tool. A cluster of these at a toolbar's edge is how the
 * application shows view toggles; menus hold actions, not state.
 */
export function ToggleIconButton({ icon, tooltip = true, className, ...props }: ToggleIconButtonProps) {
  const button = (
    <AriaToggleButton {...props} className={['kit-icon-button', 'kit-toggle-icon-button', typeof className === 'string' ? className : ''].join(' ').trim()}>
      <Icon name={icon} size={14} />
    </AriaToggleButton>
  )
  if (!tooltip) return button
  return (
    <TooltipTrigger>
      {button}
      <Tooltip>{props['aria-label']}</Tooltip>
    </TooltipTrigger>
  )
}
