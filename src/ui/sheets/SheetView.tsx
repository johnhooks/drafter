import { Hint } from '@bitmachina/drafter-kit'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { pageLayout } from '../../core/sheets/layout'
import { renderSheet } from '../../core/sheets/render'
import { useStore } from '../store/store'
import { useViewHooks } from '../useCommands'
import { calendarDate } from '../date'

export function SheetView() {
  const mode = useStore((state) => state.mode)
  const doc = useStore((state) => state.doc)
  const id = mode.kind === 'sheet' ? mode.sheetId : undefined
  const result = useStore((state) => id ? state.sheets.get(id) : undefined)
  const viewport = useRef<HTMLDivElement>(null)
  const space = useRef(false)
  const drag = useRef<{ pointer: number; x: number; y: number; panX: number; panY: number } | null>(null)
  const [view, setView] = useState({ scale: 1, x: 0, y: 0 })
  const page = pageLayout(result?.sheet.orientation ?? 'landscape')
  const fit = () => {
    const element = viewport.current
    if (element) setView({ scale: Math.max(0.01, Math.min((element.clientWidth - 40) / (page.width * 96), (element.clientHeight - 40) / (page.height * 96))), x: 0, y: 0 })
  }
  useViewHooks({ fit })
  useLayoutEffect(() => {
    const element = viewport.current
    if (!element) return
    const observer = new ResizeObserver(fit)
    observer.observe(element)
    fit()
    return () => observer.disconnect()
  }, [id, page.width, page.height])
  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || (event.target instanceof HTMLElement && event.target.isContentEditable)) return
      if (event.code === 'Space') {
        space.current = true
        if (event.target === viewport.current || event.target === document.body) event.preventDefault()
      }
    }
    const up = (event: KeyboardEvent) => { if (event.code === 'Space') space.current = false }
    const blur = () => { space.current = false; drag.current = null }
    window.addEventListener('keydown', down, true)
    window.addEventListener('keyup', up, true)
    window.addEventListener('blur', blur)
    return () => { window.removeEventListener('keydown', down, true); window.removeEventListener('keyup', up, true); window.removeEventListener('blur', blur) }
  }, [])
  useEffect(() => {
    const element = viewport.current
    if (!element) return
    const wheel = (event: WheelEvent) => {
      event.preventDefault()
      const bounds = element.getBoundingClientRect()
      const pointerX = event.clientX - bounds.x - bounds.width / 2
      const pointerY = event.clientY - bounds.y - bounds.height / 2
      setView((current) => {
        const scale = Math.max(0.05, Math.min(10, current.scale * Math.exp(-event.deltaY * 0.001)))
        const ratio = scale / current.scale
        return { scale, x: pointerX - (pointerX - current.x) * ratio, y: pointerY - (pointerY - current.y) * ratio }
      })
    }
    element.addEventListener('wheel', wheel, { passive: false })
    return () => element.removeEventListener('wheel', wheel)
  }, [])
  const svg = useMemo(() => result ? renderSheet(result.sheet, result.projection, doc, doc.sheets?.findIndex((sheet) => sheet.id === id) ?? 0, doc.sheets?.length ?? 0, doc.modifiedDate ?? calendarDate()) : '', [result, doc, id])
  return <div className="view sheet-viewport" ref={viewport} tabIndex={0} aria-label="Drawing page" onPointerDown={(event) => {
    if (event.button !== 1 && !(event.button === 0 && space.current)) return
    event.preventDefault()
    event.currentTarget.focus()
    event.currentTarget.setPointerCapture(event.pointerId)
    drag.current = { pointer: event.pointerId, x: event.clientX, y: event.clientY, panX: view.x, panY: view.y }
  }} onPointerMove={(event) => {
    const start = drag.current
    if (start?.pointer === event.pointerId) setView((current) => ({ ...current, x: start.panX + event.clientX - start.x, y: start.panY + event.clientY - start.y }))
  }} onPointerUp={(event) => {
    drag.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
  }} onPointerCancel={() => { drag.current = null }} onLostPointerCapture={() => { drag.current = null }}>
    {result ? <div className="sheet-paper" style={{ width: page.width * 96, height: page.height * 96, transform: `translate(calc(-50% + ${view.x}px), calc(-50% + ${view.y}px)) scale(${view.scale})` }} dangerouslySetInnerHTML={{ __html: svg }} /> : <Hint>Select a sheet or add one to view the drawing.</Hint>}
  </div>
}
