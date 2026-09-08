import type { ReactNode } from 'react'
import {
  Header,
  Menu as AriaMenu,
  MenuItem as AriaMenuItem,
  type MenuItemProps as AriaMenuItemProps,
  type MenuProps as AriaMenuProps,
  MenuSection as AriaMenuSection,
  type MenuSectionProps as AriaMenuSectionProps,
  MenuTrigger,
  Popover,
  Separator,
} from 'react-aria-components'
import '../Select/Select.css'
import './Menu.css'

export { MenuTrigger }

export interface MenuProps<T extends object> extends AriaMenuProps<T> {
  readonly placement?: 'bottom start' | 'bottom end' | 'top start' | 'top end'
}

/** A popup list of actions. Wrap a Button and a Menu in MenuTrigger. */
export function Menu<T extends object>({ placement = 'bottom start', className, ...props }: MenuProps<T>) {
  return (
    <Popover className="kit-popover" placement={placement} offset={2}>
      <AriaMenu {...props} className={['kit-menu', typeof className === 'string' ? className : ''].join(' ').trim()} />
    </Popover>
  )
}

export interface MenuItemProps extends Omit<AriaMenuItemProps, 'children'> {
  readonly children: ReactNode
  readonly tone?: 'neutral' | 'danger'
  /** Keyboard hint shown at the right, for example "Del". */
  readonly shortcut?: string
}

export function MenuItem({ children, tone = 'neutral', shortcut, className, ...props }: MenuItemProps) {
  return (
    <AriaMenuItem {...props} data-tone={tone} className={['kit-menu-item', typeof className === 'string' ? className : ''].join(' ').trim()}>
      <span className="kit-menu-item-label">{children}</span>
      {shortcut && <kbd className="kit-menu-shortcut">{shortcut}</kbd>}
    </AriaMenuItem>
  )
}

export function MenuSection<T extends object>({ title, children, ...props }: AriaMenuSectionProps<T> & { title?: ReactNode; children: ReactNode }) {
  return (
    <AriaMenuSection {...props} className="kit-menu-section">
      {title && <Header className="kit-menu-header">{title}</Header>}
      {children}
    </AriaMenuSection>
  )
}

export function MenuSeparator() {
  return <Separator className="kit-menu-separator" />
}
