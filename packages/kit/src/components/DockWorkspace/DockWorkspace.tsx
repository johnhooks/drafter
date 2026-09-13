import { Fragment, useEffect, useLayoutEffect, useRef, useState, type ReactNode, type PointerEvent } from 'react'
import { useDrag, useDrop } from 'react-aria-components'
import { Icon } from '../Icon/Icon'
import { IconButton } from '../IconButton/IconButton'
import { allocateHeights, dockReducer, dockWidths, transferHeights, type DockAction, type DockLayout, type DockSide } from './layout'
import './DockWorkspace.css'

export interface DockPanel {
  id: string
  title: string
  icon: string
  content: ReactNode
  available?: boolean
  className?: string
}
export interface DockWorkspaceProps {
  panels: DockPanel[]
  layout: DockLayout
  defaults: DockLayout
  onLayoutChange: (layout: DockLayout) => void
  children: ReactNode
}
const FORMAT = 'application/x-drafter-panel'

function DropTarget({ label, onDrop }: { label: string; onDrop: (id: string) => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const { dropProps, isDropTarget } = useDrop({ ref, getDropOperation: types => types.has(FORMAT) ? 'move' : 'cancel', onDrop: async event => {
    const item = event.items[0]
    if (item?.kind === 'text' && item.types.has(FORMAT)) onDrop(await item.getText(FORMAT))
  } })
  return <div {...dropProps} ref={ref} role="button" tabIndex={0} aria-label={label} data-layout-control className="kit-dock-drop" data-target={isDropTarget || undefined} />
}

function DragTitle({ panel }: { panel: DockPanel }) {
  const ref = useRef<HTMLButtonElement>(null)
  const { dragProps, isDragging } = useDrag({ getItems: () => [{ [FORMAT]: panel.id, 'text/plain': panel.title }], getAllowedDropOperations: () => ['move'], onDragEnd: event => {
    if (event.dropOperation === 'cancel') requestAnimationFrame(() => ref.current?.focus())
  } })
  return <button {...dragProps} ref={ref} data-layout-control data-panel-handle={panel.id} className="kit-dock-title" data-dragging={isDragging || undefined} aria-label={`Move ${panel.title}`}><Icon name={panel.icon} />{panel.title}</button>
}

function Separator({ label, vertical = false, value, min = 0, max = 100, begin, reset }: {
  label: string; vertical?: boolean; value: number; min?: number; max?: number
  begin: () => (delta: number) => void; reset?: () => void
}) {
  const drag = useRef<{ start: number; apply: (delta: number) => void } | null>(null)
  useEffect(() => () => { drag.current = null }, [])
  const coordinate = (event: PointerEvent) => vertical ? event.clientX : event.clientY
  return <div role="separator" tabIndex={0} data-layout-control aria-label={label} aria-orientation={vertical ? 'vertical' : 'horizontal'} aria-valuemin={min} aria-valuemax={max} aria-valuenow={Math.round(value)} className={vertical ? 'kit-dock-width' : 'kit-dock-divider'}
    onPointerDown={e => { e.preventDefault(); e.currentTarget.focus(); e.currentTarget.setPointerCapture(e.pointerId); drag.current = { start: coordinate(e), apply: begin() } }}
    onPointerMove={e => { if (e.currentTarget.hasPointerCapture(e.pointerId)) drag.current?.apply(coordinate(e) - drag.current.start) }}
    onPointerUp={e => { drag.current = null; if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId) }}
    onPointerCancel={() => { drag.current = null }} onLostPointerCapture={() => { drag.current = null }}
    onDoubleClick={reset}
    onKeyDown={e => { const negative = vertical ? 'ArrowLeft' : 'ArrowUp', positive = vertical ? 'ArrowRight' : 'ArrowDown'; if (e.key === negative || e.key === positive) { e.preventDefault(); e.stopPropagation(); begin()(e.key === negative ? -16 : 16) } }} />
}

export function DockWorkspace({ panels, layout, defaults, onLayoutChange, children }: DockWorkspaceProps) {
  const root = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ width: 1000, height: 600 })
  const [solo, setSolo] = useState<Partial<Record<DockSide, string>>>({})
  const [message, announce] = useState('')
  const focusTarget = useRef<{ kind: 'panel' | 'rail' | 'control'; id: string } | null>(null)
  const available = panels.filter(p => p.available !== false)
  const signature = available.map(p => p.id).join('|')
  const dispatch = (action: DockAction) => {
    const next = dockReducer({ layout, solo }, action)
    setSolo(next.solo)
    if (next.layout !== layout) onLayoutChange(next.layout)
  }
  const focus = (kind: 'panel' | 'rail' | 'control', id: string) => { focusTarget.current = { kind, id } }
  useLayoutEffect(() => {
    if (!root.current) return
    const observer = new ResizeObserver(([entry]) => { if (entry) setSize({ width: entry.contentRect.width, height: entry.contentRect.height }) })
    observer.observe(root.current)
    return () => observer.disconnect()
  }, [])
  useEffect(() => {
    setSolo(previous => Object.fromEntries(Object.entries(previous).filter(([, id]) => available.some(p => p.id === id))))
    // Availability changes must not erase the saved placement of a contextual panel.
  }, [signature])
  useEffect(() => {
    const target = focusTarget.current
    if (!target) return
    const timer = requestAnimationFrame(() => {
      const attribute = target.kind === 'panel' ? 'data-panel-handle' : target.kind === 'rail' ? 'data-dock-open' : 'data-dock-collapse'
      const element = [...(root.current?.querySelectorAll<HTMLElement>(`[${attribute}]`) ?? [])].find(el => el.getAttribute(attribute) === target.id)
      element?.focus()
      focusTarget.current = null
    })
    return () => cancelAnimationFrame(timer)
  }, [layout, solo])
  const widths = dockWidths(layout, size.width)
  const dock = (side: DockSide) => {
    const members = layout.columns[side].flatMap(id => { const panel = available.find(p => p.id === id); return panel ? [panel] : [] })
    const filled = members.some(p => p.id === solo[side]) ? solo[side] : undefined
    const visible = members.filter(p => !filled || p.id === filled)
    const expanded = visible.filter(p => filled || !layout.folded[p.id]).map(p => p.id)
    const heights = allocateHeights(expanded, layout.weights, size.height - 26 - 3 - visible.length * 29 - Math.max(0, expanded.length - 1) * 5)
    const move = (id: string, before?: string) => {
      const panel = available.find(p => p.id === id)
      if (!panel) return
      dispatch({ type: 'move', id, side, before })
      focus('panel', id)
      announce(`${panel.title} moved to ${side} dock${before ? ` before ${panels.find(p => p.id === before)?.title}` : ''}.`)
    }
    return <aside className="kit-dock" data-side={side} data-collapsed={layout.hidden[side] || undefined} aria-label={`${side} dock`} style={{ width: widths[side] }}>
      <div className="kit-dock-rail" hidden={!layout.hidden[side]} role="toolbar" aria-label={`${side} dock panels`}>
        <IconButton data-layout-control data-dock-open={side} icon="chevron-right" className={side === 'right' ? 'kit-dock-point-left' : ''} aria-label={`Expand ${side} dock`} onPress={() => { dispatch({ type: 'dock', side, hidden: false }); if (visible[0]) focus('panel', visible[0].id); else focus('control', side) }} />
        {members.map(panel => <IconButton key={panel.id} data-layout-control icon={panel.icon} aria-label={`Open ${panel.title}`} onPress={() => { dispatch({ type: 'fill', side, id: panel.id }); focus('panel', panel.id) }} />)}
      </div>
      <div className="kit-dock-controls" hidden={layout.hidden[side]} role="toolbar" aria-label={`${side} dock controls`}>
        <IconButton data-layout-control data-dock-collapse={side} icon="chevron-right" className={side === 'left' ? 'kit-dock-point-left' : ''} aria-label={`Collapse ${side} dock`} onPress={() => { dispatch({ type: 'dock', side, hidden: true }); focus('rail', side) }} />
      </div>
      <div className="kit-dock-stack" hidden={layout.hidden[side]}>
        {members.map(panel => {
          const shown = !filled || filled === panel.id
          const folded = !filled && !!layout.folded[panel.id]
          const next = expanded[expanded.indexOf(panel.id) + 1]
          return <Fragment key={panel.id}>
            {shown && <DropTarget label={`Move panel before ${panel.title} in ${side} dock`} onDrop={id => move(id, panel.id)} />}
            <section hidden={!shown} className="kit-dock-panel" data-panel-id={panel.id} aria-label={panel.title}>
              <div className="kit-dock-header">
                <IconButton data-layout-control icon={folded ? 'chevron-right' : 'chevron-down'} aria-expanded={!folded} aria-label={`${folded ? 'Expand' : 'Collapse'} ${panel.title}`} onPress={() => { dispatch({ type: 'fold', id: panel.id }); focus('panel', panel.id) }} />
                <DragTitle panel={panel} />
                <IconButton data-layout-control icon={filled === panel.id ? 'restore' : 'maximize'} aria-label={filled === panel.id ? `Restore ${panel.title} layout` : `Fill dock with ${panel.title}`} onPress={() => { dispatch({ type: 'fill', side, id: filled ? undefined : panel.id }); focus('panel', panel.id) }} />
              </div>
              <div hidden={folded} className={['kit-dock-content', panel.className ?? ''].join(' ')} style={{ height: heights[panel.id] ?? 0 }}>{panel.content}</div>
            </section>
            {shown && !folded && next && <Separator label={`Resize ${panel.title} and ${panels.find(p => p.id === next)?.title}`} value={(heights[panel.id] ?? 0) / ((heights[panel.id] ?? 0) + (heights[next] ?? 0) || 1) * 100}
              begin={() => delta => dispatch({ type: 'weights', weights: transferHeights(heights, layout.weights, panel.id, next, delta) })}
              reset={() => dispatch({ type: 'weights', weights: Object.fromEntries(layout.columns[side].map(id => [id, defaults.weights[id] ?? 1])) })} />}
          </Fragment>
        })}
        <DropTarget label={`Move panel to end of ${side} dock`} onDrop={id => move(id)} />
      </div>
      {!layout.hidden[side] && <Separator vertical label={`Resize ${side} dock`} value={widths[side]} min={Math.min(220, widths[side])} max={400} begin={() => {
        const start = widths[side], other = side === 'left' ? 'right' : 'left'
        const ceiling = Math.max(220, Math.min(400, size.width - widths[other] - 240))
        return delta => dispatch({ type: 'width', side, width: Math.min(ceiling, start + delta * (side === 'left' ? 1 : -1)) })
      }} />}
    </aside>
  }
  return <div ref={root} className="kit-dock-workspace">{dock('left')}<div className="kit-dock-canvas">{children}</div>{dock('right')}<span className="kit-dock-status" role="status">{message}</span></div>
}
