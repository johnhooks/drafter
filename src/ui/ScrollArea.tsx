import { type ReactNode, useLayoutEffect, useRef, useState } from 'react'

/**
 * A scrolling region that fades at an edge while there is content beyond it, so a list that overflows says so
 * even where the platform hides its scrollbars.
 */
export function ScrollArea({ children, className }: { children: ReactNode; className?: string }) {
  const inner = useRef<HTMLDivElement>(null)
  const more = useScrollEdges(inner)
  return (
    <div className={['scroll-area', className ?? ''].join(' ').trim()} data-more={more}>
      <div className="scroll-area-inner" ref={inner}>
        {children}
      </div>
    </div>
  )
}

/**
 * Which edges of a scrolling element have content beyond them, as a space-separated token list for a data
 * attribute: "top", "bottom", both, or empty. Re-measured on scroll and whenever the element or its children resize.
 */
export function useScrollEdges(ref: React.RefObject<HTMLElement | null>): string {
  const [more, setMore] = useState('')
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => {
      const top = el.scrollTop > 1
      const bottom = el.scrollTop + el.clientHeight < el.scrollHeight - 1
      setMore([top ? 'top' : '', bottom ? 'bottom' : ''].filter(Boolean).join(' '))
    }
    const ro = new ResizeObserver(measure)
    const observe = () => {
      ro.disconnect()
      ro.observe(el)
      for (const child of el.children) ro.observe(child)
    }
    const mo = new MutationObserver(() => {
      observe()
      measure()
    })
    observe()
    measure()
    el.addEventListener('scroll', measure)
    mo.observe(el, { childList: true })
    return () => {
      el.removeEventListener('scroll', measure)
      ro.disconnect()
      mo.disconnect()
    }
  }, [ref])
  return more
}
