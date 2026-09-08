import type { ReactNode } from 'react'
import { OverlayArrow, Tooltip as AriaTooltip, type TooltipProps as AriaTooltipProps, TooltipTrigger as AriaTooltipTrigger, type TooltipTriggerComponentProps } from 'react-aria-components'
import './Tooltip.css'

export interface TooltipProps extends Omit<AriaTooltipProps, 'children'> {
  readonly children: ReactNode
}

/** Wrap a focusable trigger and a Tooltip in TooltipTrigger. Shows on hover and on keyboard focus. */
export function TooltipTrigger({ delay = 500, ...props }: TooltipTriggerComponentProps) {
  return <AriaTooltipTrigger delay={delay} {...props} />
}

export function Tooltip({ children, className, ...props }: TooltipProps) {
  return (
    <AriaTooltip {...props} offset={4} className={['kit-tooltip', typeof className === 'string' ? className : ''].join(' ').trim()}>
      <OverlayArrow className="kit-tooltip-arrow">
        <svg width={8} height={8} viewBox="0 0 8 8" aria-hidden>
          <path d="M0 0 L4 4 L8 0" />
        </svg>
      </OverlayArrow>
      {children}
    </AriaTooltip>
  )
}
