import { flushSync } from 'react-dom'
import { Hint } from '@bitmachina/drafter-kit'
import { type PointerEvent, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { pageLayout, sheetLayout } from '../../core/sheets/layout'
import { renderSheet } from '../../core/sheets/render'
import { projectionSnapContext, snap } from '../../core/snap'
import { useStore } from '../store/store'
import { useViewHooks } from '../useCommands'
import { calendarDate } from '../date'
import { makeSheetTool, pickedSegments, type SheetPointer } from './tools'
import { cachedIsometric, renderIsometric } from './isoRender'

export function SheetView() {
  const mode = useStore((state) => state.mode)
  const doc = useStore((state) => state.doc)
  const model = useStore((state) => state.eval)
  const id = mode.kind === 'sheet' ? mode.sheetId : undefined
  const result = useStore((state) => id ? state.sheets.get(id) : undefined)
  const toolName = useStore((state) => state.sheetTool)
  const selectedId = useStore((state) => state.sheetSelection)
  const dispatch = useStore((state) => state.dispatch)
  const viewport = useRef<HTMLDivElement>(null)
  const paper = useRef<HTMLDivElement>(null)
  const noteInput = useRef<HTMLTextAreaElement>(null)
  const activePointer = useRef<number | null>(null)
  const space = useRef(false)
  const drag = useRef<{ pointer: number; x: number; y: number; panX: number; panY: number } | null>(null)
  const [view, setView] = useState({ scale: 1, x: 0, y: 0 })
  const [, redraw] = useState(0)
  const [rendered, setRendered] = useState<{ sheet: typeof result; model: typeof model; image: string } | null>(null)
  useEffect(() => {
    if (!result || result.sheet.view !== 'isometric') return
    let cancelled = false
    renderIsometric(result.sheet, model).then((image) => {
      if (!cancelled) setRendered({ sheet: result, model, image })
    }).catch((error: unknown) => {
      if (!cancelled) dispatch('notify', `Could not render isometric sheet: ${error instanceof Error ? error.message : String(error)}`, 'danger')
    })
    return () => { cancelled = true }
  }, [result, model, dispatch])
  const image = result?.sheet.view === 'isometric' ? cachedIsometric(result.sheet, model) ?? (rendered?.sheet === result && rendered.model === model ? rendered.image : undefined) : undefined
  const page = pageLayout(result?.sheet.orientation ?? 'landscape')
  const tool = useMemo(() => makeSheetTool(toolName, {
    newId: () => crypto.randomUUID(),
    changed: () => redraw((value) => value + 1),
    annotation: (annotationId) => {
      const sheet = useStore.getState().doc.sheets?.find((sheet) => sheet.id === id)
      const dimension = sheet?.dimensions?.find((dimension) => dimension.id === annotationId)
      if (dimension) return { kind: 'dimension', value: dimension }
      const note = sheet?.notes?.find((note) => note.id === annotationId)
      return note ? { kind: 'note', value: note } : undefined
    },
    select: (annotationId) => dispatch('selectSheetAnnotation', annotationId),
    addDimension: (dimension) => { if (id) dispatch('addSheetDimension', id, dimension) },
    addNote: (note) => { if (id) dispatch('addSheetNote', id, note) },
    update: (annotation) => {
      if (!id) return
      if (annotation.kind === 'dimension') dispatch('updateSheetDimension', id, annotation.value.id, annotation.value)
      else dispatch('updateSheetNote', id, annotation.value.id, annotation.value)
    },
  }), [id, toolName, result?.projection, result?.sheet.scale, result?.sheet.orientation, result?.sheet.dimensions, result?.sheet.notes, dispatch])
  const toolRef = useRef(tool)
  toolRef.current = tool
  useLayoutEffect(() => { activePointer.current = null }, [tool])
  useEffect(() => () => tool.cancel(), [tool])
  const fit = () => {
    const element = viewport.current
    if (element) setView({ scale: Math.max(0.01, Math.min((element.clientWidth - 40) / (page.width * 96), (element.clientHeight - 40) / (page.height * 96))), x: 0, y: 0 })
  }
  useViewHooks({ fit, cancelTool: () => {
    activePointer.current = null
    drag.current = null
    tool.cancel()
  }, toolConsumes: (key) => {
    const consumed = tool.key(key)
    if (consumed) activePointer.current = null
    return consumed
  } })
  useLayoutEffect(() => {
    const element = viewport.current
    if (!element) return
    fit()
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
    const blur = () => { space.current = false; drag.current = null; activePointer.current = null; toolRef.current.cancel() }
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
  const preview = tool.preview()
  const picked = tool.pickedPoints()
  const layout = result ? sheetLayout(result.sheet, result.projection.bounds) : null
  const prompt = tool.prompt()
  const svg = useMemo(() => {
    if (!result) return ''
    const sheet = !preview ? result.sheet : preview.kind === 'dimension'
      ? { ...result.sheet, dimensions: [...(result.sheet.dimensions ?? []).filter((dimension) => dimension.id !== preview.value.id), preview.value] }
      : { ...result.sheet, notes: [...(result.sheet.notes ?? []).filter((note) => note.id !== preview.value.id), preview.value] }
    return renderSheet(sheet, result.projection, doc, doc.sheets?.findIndex((sheet) => sheet.id === id) ?? 0, doc.sheets?.length ?? 0, doc.modifiedDate ?? calendarDate(), image)
  }, [result, doc, id, preview, image])
  const markup = useMemo(() => ({ __html: svg }), [svg])
  useLayoutEffect(() => {
    for (const element of paper.current?.querySelectorAll<SVGElement>('[data-annotation-id]') ?? []) {
      if (element.dataset.annotationId === selectedId) element.dataset.selected = 'true'
      else delete element.dataset.selected
    }
  }, [svg, selectedId])
  useLayoutEffect(() => {
    if (prompt) noteInput.current?.focus()
  }, [prompt?.id])
  const pointerInfo = (event: PointerEvent<HTMLDivElement>): SheetPointer | null => {
    if (!result || !paper.current) return null
    const bounds = paper.current.getBoundingClientRect()
    const paperPoint = [(event.clientX - bounds.left) / (96 * view.scale), (event.clientY - bounds.top) / (96 * view.scale)] as const
    const { factor, originU, originV } = sheetLayout(result.sheet, result.projection.bounds)
    const raw = [(paperPoint[0] - originU) / factor, (originV - paperPoint[1]) / factor] as const
    const snapped = snap(...raw, projectionSnapContext(result.projection, 8 / (96 * view.scale * factor)))
    const target = event.target instanceof Element ? event.target.closest<SVGElement>('[data-annotation-id]') : null
    return { paper: paperPoint, raw, point: result.sheet.view === 'isometric' ? paperPoint : [snapped.u, snapped.v], px: [event.clientX, event.clientY], shift: event.shiftKey, hit: target?.dataset.annotationId }
  }
  const cancelPointer = () => {
    drag.current = null
    if (activePointer.current !== null) tool.cancel()
    activePointer.current = null
  }
  const paperStyle = { width: page.width * 96, height: page.height * 96, transform: `translate(calc(-50% + ${view.x}px), calc(-50% + ${view.y}px)) scale(${view.scale})` }
  return <div className="view sheet-viewport" ref={viewport} tabIndex={0} aria-label="Drawing page" onPointerDown={(event) => {
    const panning = event.button === 1 || (event.button === 0 && space.current)
    if (event.target instanceof HTMLTextAreaElement && !panning && !(event.shiftKey && toolName === 'note')) return
    if (!panning && event.button !== 0) return
    const pointer = pointerInfo(event)
    if (!panning && (!pointer || pointer.paper[0] < 0 || pointer.paper[1] < 0 || pointer.paper[0] > page.width || pointer.paper[1] > page.height)) return
    event.preventDefault()
    event.currentTarget.focus()
    event.currentTarget.setPointerCapture(event.pointerId)
    if (panning) drag.current = { pointer: event.pointerId, x: event.clientX, y: event.clientY, panX: view.x, panY: view.y }
    else if (pointer) {
      activePointer.current = event.pointerId
      tool.down(pointer)
    }
  }} onPointerMove={(event) => {
    const start = drag.current
    if (start?.pointer === event.pointerId) setView((current) => ({ ...current, x: start.panX + event.clientX - start.x, y: start.panY + event.clientY - start.y }))
    else if (!start) {
      const pointer = pointerInfo(event)
      // Flush preview markup before the next press can target its replaced SVG.
      if (pointer) flushSync(() => tool.move(pointer))
    }
  }} onPointerUp={(event) => {
    if (activePointer.current === event.pointerId) {
      activePointer.current = null
      const pointer = pointerInfo(event)
      if (pointer) tool.up(pointer)
      if (tool.prompt()) noteInput.current?.focus()
    }
    drag.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
  }} onPointerCancel={cancelPointer} onLostPointerCapture={cancelPointer} onDoubleClick={(event) => {
    if (toolName !== 'select') return
    const target = document.elementFromPoint(event.clientX, event.clientY)
    const annotationId = target?.closest<SVGElement>('[data-annotation-kind="note"]')?.dataset.annotationId
    const note = result?.sheet.notes?.find((note) => note.id === annotationId)
    if (note) { event.preventDefault(); tool.edit(note) }
  }}>
    {result ? <>
      <div className="sheet-paper" ref={paper} style={paperStyle} dangerouslySetInnerHTML={markup} />
      {layout && picked.length > 0 && <svg className="sheet-pick-overlay" style={paperStyle} viewBox={`0 0 ${page.width} ${page.height}`} pointerEvents="none" aria-hidden="true">
        <svg x={layout.drawing.x} y={layout.drawing.y} width={layout.drawing.width} height={layout.drawing.height} viewBox={`${layout.drawing.x} ${layout.drawing.y} ${layout.drawing.width} ${layout.drawing.height}`} overflow="hidden">
        {pickedSegments(result.projection.segments, picked).map((segment) => {
          const horizontal = segment.dir === 'h'
          return <line key={`${segment.dir}:${segment.at}:${segment.min}:${segment.max}`} data-dimension-picked-edge="" x1={layout.originU + (horizontal ? segment.min : segment.at) * layout.factor} y1={layout.originV - (horizontal ? segment.at : segment.min) * layout.factor} x2={layout.originU + (horizontal ? segment.max : segment.at) * layout.factor} y2={layout.originV - (horizontal ? segment.at : segment.max) * layout.factor} strokeWidth={2 / (96 * view.scale)} strokeDasharray={segment.visible ? undefined : '0.08 0.04'} />
        })}
        </svg>
        {picked.map((point, index) => <circle key={index} data-dimension-picked-point={index} cx={layout.originU + point[0] * layout.factor} cy={layout.originV - point[1] * layout.factor} r={3.5 / (96 * view.scale)} />)}
      </svg>}
      {prompt && <div className="sheet-edit-overlay" style={paperStyle}>
        <textarea key={prompt.id} ref={noteInput} aria-label="Note text" className="sheet-note-input" value={prompt.text} rows={Math.max(2, prompt.text.split('\n').length)} style={{ left: prompt.position[0] * 96, top: prompt.position[1] * 96 - 12 }} onChange={(event) => tool.setText(event.target.value)} onKeyDown={(event) => {
          event.stopPropagation()
          if (event.nativeEvent.isComposing) return
          if (event.key === 'Escape') {
            event.preventDefault()
            tool.cancel()
            viewport.current?.focus()
          } else if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault()
            tool.commitPrompt(event.currentTarget.value)
            viewport.current?.focus()
          }
        }} />
      </div>}
      <div className="hint" role="status">{tool.hint()}</div>
    </> : <Hint>Select a sheet or add one to view the drawing.</Hint>}
  </div>
}
