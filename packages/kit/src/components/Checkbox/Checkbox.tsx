import type { ReactNode } from 'react'
import { Checkbox as AriaCheckbox, type CheckboxProps as AriaCheckboxProps } from 'react-aria-components'
import { Icon } from '../Icon/Icon'
import './Checkbox.css'

export interface CheckboxProps extends Omit<AriaCheckboxProps, 'children'> {
  readonly children?: ReactNode
}

export function Checkbox({ children, className, ...props }: CheckboxProps) {
  return (
    <AriaCheckbox {...props} className={['kit-checkbox', typeof className === 'string' ? className : ''].join(' ').trim()}>
      {({ isSelected, isIndeterminate }) => (
        <>
          <span className="kit-checkbox-box" aria-hidden>
            {isIndeterminate ? <Icon name="minus" size={10} /> : isSelected ? <Icon name="check" size={10} /> : null}
          </span>
          {children}
        </>
      )}
    </AriaCheckbox>
  )
}
