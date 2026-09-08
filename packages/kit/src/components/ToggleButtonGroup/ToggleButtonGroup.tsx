import { ToggleButtonGroup as AriaGroup, type ToggleButtonGroupProps as AriaGroupProps } from 'react-aria-components'
import './ToggleButtonGroup.css'

export type ToggleButtonGroupProps = AriaGroupProps

/** A row of ToggleButtons with one selection by default, for tool switchers. Arrow keys move between them. */
export function ToggleButtonGroup({ className, selectionMode = 'single', disallowEmptySelection = true, ...props }: ToggleButtonGroupProps) {
  return (
    <AriaGroup
      {...props}
      selectionMode={selectionMode}
      disallowEmptySelection={disallowEmptySelection}
      className={['kit-toggle-group', typeof className === 'string' ? className : ''].join(' ').trim()}
    />
  )
}
