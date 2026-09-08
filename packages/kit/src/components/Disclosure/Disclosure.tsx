import type { ReactNode } from 'react'
import { Button, Disclosure as AriaDisclosure, DisclosurePanel, type DisclosureProps as AriaDisclosureProps, Heading } from 'react-aria-components'
import './Disclosure.css'

export interface DisclosureProps extends Omit<AriaDisclosureProps, 'children'> {
  readonly title: ReactNode
  readonly children: ReactNode
  /** Something at the right of the header row, for example a count. */
  readonly trailing?: ReactNode
}

/** A collapsible section with a section-style header. */
export function Disclosure({ title, trailing, children, className, defaultExpanded = true, ...props }: DisclosureProps) {
  return (
    <AriaDisclosure {...props} defaultExpanded={defaultExpanded} className={['kit-disclosure', typeof className === 'string' ? className : ''].join(' ').trim()}>
      <Heading className="kit-disclosure-heading">
        <Button slot="trigger" className="kit-disclosure-trigger">
          <span className="kit-disclosure-chevron" aria-hidden>
            {'>'}
          </span>
          <span className="kit-disclosure-title">{title}</span>
          {trailing && <span className="kit-disclosure-trailing">{trailing}</span>}
        </Button>
      </Heading>
      <DisclosurePanel className="kit-disclosure-panel">{children}</DisclosurePanel>
    </AriaDisclosure>
  )
}
