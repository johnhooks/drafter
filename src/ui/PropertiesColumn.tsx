import { IconButton, Panel } from '@bitmachina/drafter-kit'
import { useEffect, useRef, useState } from 'react'
import type { SketchFeature } from '../core/model/types'
import { loadPaneHeight, savePaneHeight } from './persist'
import { Properties, SelectionPanel, SketchFields, type SketchList, SketchLists } from './Properties'
import { useStore } from './store/store'

/** Floors for the pane and the lists, matching the stylesheet, so a drag stops where the layout would anyway. */
export const PANE_MIN = 120
const LISTS_MIN = 120
const KEY_STEP = 16

/** The left column: one panel for the document or an extrude, or the three stacked windows of a sketch. */
export function PropertiesColumn() {
  const feature = useStore((s) => s.doc.features.find((f) => f.id === s.selection.featureId))
  if (feature?.kind !== 'sketch') {
    return (
      <Panel edge="left" className="side">
        <Properties />
      </Panel>
    )
  }
  return <SketchColumn sketch={feature} />
}

/**
 * A sketch's column: its own fields in a window that minimizes to its title bar, the lists as an accordion that
 * takes the remaining height, and the selection pane below a divider that sets its height.
 */
function SketchColumn({ sketch }: { sketch: SketchFeature }) {
  const column = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState<number | null>(loadPaneHeight)
  const [minimized, setMinimized] = useState(false)
  const [open, setOpen] = useState<SketchList | null>('regions')
  const [dragging, setDragging] = useState(false)

  useEffect(() => savePaneHeight(height), [height])

  const clamp = (h: number) => {
    const total = column.current?.clientHeight ?? 0
    const fields = column.current?.querySelector<HTMLElement>('.props-sketch')?.offsetHeight ?? 0
    return Math.round(Math.max(PANE_MIN, Math.min(h, Math.max(PANE_MIN, total - fields - LISTS_MIN))))
  }
  const current = () => column.current?.querySelector<HTMLElement>('.props-selection')?.offsetHeight ?? 0

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // cancelling the pointer event also cancels the focus a click would give, so take it explicitly for the keys
    e.preventDefault()
    e.currentTarget.focus()
    const start = e.clientY
    const base = current()
    const target = e.currentTarget
    target.setPointerCapture(e.pointerId)
    setDragging(true)
    const move = (ev: PointerEvent) => setHeight(clamp(base + (start - ev.clientY)))
    const up = () => {
      setDragging(false)
      target.removeEventListener('pointermove', move)
      target.removeEventListener('pointerup', up)
      target.removeEventListener('pointercancel', up)
    }
    target.addEventListener('pointermove', move)
    target.addEventListener('pointerup', up)
    target.addEventListener('pointercancel', up)
  }
  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return
    e.preventDefault()
    setHeight(clamp(current() + (e.key === 'ArrowUp' ? KEY_STEP : -KEY_STEP)))
  }

  return (
    <div className="side props" ref={column}>
      <Panel
        edge="left"
        className="props-sketch"
        data-minimized={minimized || undefined}
        title={
          <>
            Sketch <span className="handle">{sketch.handle}</span>
          </>
        }
        actions={
          <IconButton
            icon={minimized ? 'plus' : 'minus'}
            size="sm"
            aria-label={minimized ? 'Restore sketch properties' : 'Minimize sketch properties'}
            onPress={() => setMinimized((m) => !m)}
          />
        }
      >
        <SketchFields sketch={sketch} />
      </Panel>
      <Panel edge="left" className="props-lists">
        <SketchLists sketch={sketch} open={open} onOpen={setOpen} />
      </Panel>
      <div
        className="props-divider"
        role="separator"
        aria-orientation="horizontal"
        aria-label="Resize the selection pane"
        data-dragging={dragging || undefined}
        tabIndex={0}
        onPointerDown={onPointerDown}
        onKeyDown={onKeyDown}
        onDoubleClick={() => setHeight(null)}
      />
      <SelectionPanel style={height === null ? undefined : { flexBasis: height }} />
    </div>
  )
}
