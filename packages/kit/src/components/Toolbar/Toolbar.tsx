import { Separator, Toolbar as AriaToolbar, type ToolbarProps as AriaToolbarProps } from 'react-aria-components'
import './Toolbar.css'

export type ToolbarProps = AriaToolbarProps

/** A horizontal strip of controls. Arrow keys move between them; Tab leaves the toolbar. */
export function Toolbar({ className, ...props }: ToolbarProps) {
  return <AriaToolbar {...props} className={['kit-toolbar', typeof className === 'string' ? className : ''].join(' ').trim()} />
}

export function ToolbarSeparator() {
  return <Separator orientation="vertical" className="kit-toolbar-separator" />
}

/** Pushes what follows to the far end of the toolbar. */
export function ToolbarSpacer() {
  return <span className="kit-toolbar-spacer" aria-hidden />
}
