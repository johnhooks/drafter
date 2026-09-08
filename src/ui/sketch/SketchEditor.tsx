import { useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { normRect, setRectHeight, setRectWidth } from '../../core/model/sketch'
import type { SketchFeature } from '../../core/model/types'
import { type SnapContext, snap } from '../../core/snap'
import { type Sixteenths, formatLength, parseLength, sx } from '../../core/units'
import { useStore } from '../store/store'
import { type PointerInfo, type Tool, makeTool } from './tools'
import { type SketchView, axisLabels, mirrorSign, toPlaneInches, toScreen } from './view'

const SNAP_PX = 6

interface Props {
  sketch: SketchFeature
}

export function SketchEditor({ sketch }: Props) {
  const ev = useStore((s) => s.eval)
  const toolName = useStore((s) => s.tool)
  const selection = useStore((s) => s.selection)
  const dispatch = useStore((s) => s.dispatch)
  const result = ev.results.get(sketch.id)
  const plane = result?.kind === 'sketch' ? result.plane : null
  const su = plane ? mirrorSign(plane) : 1

  const svgRef = useRef<SVGSVGElement>(null)
  const [view, setView] = useState<SketchView>({ cu: 12, cv: 12, scale: 12 })
  const [size, setSize] = useState({ w: 800, h: 600 })
  const [pointer, setPointer] = useState<ReturnType<typeof snap> | null>(null)
  const [editing, setEditing] = useState<{ rectId: string; dim: 'w' | 'h'; text: string; error?: string } | null>(null)
  const [, bump] = useReducer((x: number) => x + 1, 0)
  const pan = useRef<{ x: number; y: number; cu: number; cv: number } | null>(null)
  const space = useRef(false)

  useEffect(() => {
    const el = svgRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }))
    ro.observe(el)
    setSize({ w: el.clientWidth, h: el.clientHeight })
    return () => ro.disconnect()
  }, [])

  // on open, frame the reference geometry and existing rectangles; empty sketches centre on 1 foot square
  useEffect(() => {
    const el = svgRef.current
    if (!el) return
    const rects = [
      ...(result?.kind === 'sketch' ? result.coplanarFaces.flatMap((f) => f.rects) : []),
      ...(result?.kind === 'sketch' ? result.outlines : []),
      ...sketch.rects.map(normRect),
    ]
    if (rects.length === 0) return
    const u0 = Math.min(...rects.map((r) => r.u0)) / 16
    const u1 = Math.max(...rects.map((r) => r.u1)) / 16
    const v0 = Math.min(...rects.map((r) => r.v0)) / 16
    const v1 = Math.max(...rects.map((r) => r.v1)) / 16
    const w = Math.max(u1 - u0, 1)
    const h = Math.max(v1 - v0, 1)
    const scale = Math.min(400, Math.max(1, Math.min((el.clientWidth * 0.7) / w, (el.clientHeight * 0.7) / h)))
    setView({ cu: (u0 + u1) / 2, cv: (v0 + v1) / 2, scale })
    // only on first open of this sketch
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sketch.id])

  const tool = useMemo<Tool>(
    () =>
      makeTool(toolName, {
        addRect: (r) => dispatch('addRect', sketch.id, r),
        toggleRect: (id, additive) => dispatch('toggleRect', id, additive),
        clearSelection: () => dispatch('select', { featureId: sketch.id }),
        deleteSelection: () => {
          const ids = useStore.getState().selection.rectIds
          if (ids.length) dispatch('removeRects', sketch.id, ids)
        },
        changed: bump,
      }),
    [toolName, sketch.id, dispatch],
  )

  // snap candidates: reference faces, body outlines, and the sketch's own rectangles
  const snapCtx = useMemo<SnapContext>(() => {
    const corners: Array<[number, number]> = []
    const uEdges: number[] = []
    const vEdges: number[] = []
    const rects = [
      ...(result?.kind === 'sketch' ? result.coplanarFaces.flatMap((f) => f.rects) : []),
      ...(result?.kind === 'sketch' ? result.outlines : []),
      ...sketch.rects.map(normRect),
    ]
    for (const r of rects) {
      corners.push([r.u0, r.v0], [r.u1, r.v0], [r.u0, r.v1], [r.u1, r.v1])
      uEdges.push(r.u0, r.u1)
      vEdges.push(r.v0, r.v1)
    }
    return { corners, uEdges, vEdges, range: (SNAP_PX / view.scale) * 16 }
  }, [result, sketch.rects, view.scale])

  const pointerInfo = (e: React.PointerEvent): PointerInfo => {
    const rect = svgRef.current!.getBoundingClientRect()
    const px = e.clientX - rect.left - rect.width / 2
    const py = e.clientY - rect.top - rect.height / 2
    const [ui, vi] = toPlaneInches(view, su, px, py)
    const snapped = snap(ui * 16, vi * 16, snapCtx)
    const hit = (e.target as Element).closest?.('[data-rect-id]')?.getAttribute('data-rect-id') ?? undefined
    return { snapped, shift: e.shiftKey, hit }
  }

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return
      if (e.code === 'Space') {
        space.current = true
        e.preventDefault()
        return
      }
      if (tool.key(e.key)) e.preventDefault()
    }
    const up = (e: KeyboardEvent) => {
      if (e.code === 'Space') space.current = false
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [tool])

  const onPointerDown = (e: React.PointerEvent) => {
    if (editing) return
    if (e.button === 1 || (e.button === 0 && space.current)) {
      pan.current = { x: e.clientX, y: e.clientY, cu: view.cu, cv: view.cv }
      ;(e.target as Element).setPointerCapture?.(e.pointerId)
      e.preventDefault()
      return
    }
    if (e.button !== 0) return
    svgRef.current?.setPointerCapture(e.pointerId)
    tool.down(pointerInfo(e))
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (pan.current) {
      const p = pan.current
      setView({ ...view, cu: p.cu - ((e.clientX - p.x) / view.scale) * su, cv: p.cv + (e.clientY - p.y) / view.scale })
      return
    }
    const info = pointerInfo(e)
    setPointer(info.snapped)
    tool.move(info)
  }
  const onPointerUp = (e: React.PointerEvent) => {
    if (pan.current) {
      pan.current = null
      return
    }
    if (e.button !== 0) return
    tool.up(pointerInfo(e))
  }
  // React's onWheel is passive, so it cannot stop the page from scrolling; attach natively
  useEffect(() => {
    const el = svgRef.current
    if (!el) return
    const handler = (e: WheelEvent) => {
      e.preventDefault()
      onWheel(e)
    }
    el.addEventListener('wheel', handler, { passive: false })
    return () => el.removeEventListener('wheel', handler)
  })

  const onWheel = (e: WheelEvent) => {
    const rect = svgRef.current!.getBoundingClientRect()
    const px = e.clientX - rect.left - rect.width / 2
    const py = e.clientY - rect.top - rect.height / 2
    const [ui, vi] = toPlaneInches(view, su, px, py)
    const factor = Math.exp(-e.deltaY * 0.0015)
    const scale = Math.min(400, Math.max(1, view.scale * factor))
    // keep the inch under the pointer fixed
    const cu = ui - (px / scale) * su
    const cv = vi + py / scale
    setView({ cu, cv, scale })
  }

  const commitEdit = () => {
    if (!editing) return
    const r = parseLength(editing.text)
    if (!r.ok || r.value <= 0) return setEditing({ ...editing, error: r.ok ? 'Must be greater than zero' : r.error })
    const rect = sketch.rects.find((x) => x.id === editing.rectId)
    if (rect) dispatch('updateRect', sketch.id, editing.dim === 'w' ? setRectWidth(rect, r.value) : setRectHeight(rect, r.value))
    setEditing(null)
  }

  const S = (u: number, v: number) => toScreen(view, su, u / 16, v / 16)
  const half = { w: size.w / 2, h: size.h / 2 }
  const labels = plane ? axisLabels(plane) : null

  // visible range in inches for the grid
  const uMin = Math.min(...[-half.w, half.w].map((px) => toPlaneInches(view, su, px, 0)[0]))
  const uMax = Math.max(...[-half.w, half.w].map((px) => toPlaneInches(view, su, px, 0)[0]))
  const vMin = toPlaneInches(view, su, 0, half.h)[1]
  const vMax = toPlaneInches(view, su, 0, -half.h)[1]
  const showQuarter = view.scale * 0.25 >= 8
  const gridLines: React.ReactNode[] = []
  const step = showQuarter ? 0.25 : 1
  if ((uMax - uMin) / step < 2000) {
    for (let u = Math.floor(uMin / step) * step; u <= uMax; u += step) {
      const major = Math.abs(u - Math.round(u)) < 1e-9
      const x = S(u * 16, 0)[0]
      gridLines.push(<line key={`u${u}`} x1={x} x2={x} y1={-half.h} y2={half.h} stroke={u === 0 ? '#999' : major ? '#ddd' : '#eee'} strokeWidth={1} />)
    }
    for (let v = Math.floor(vMin / step) * step; v <= vMax; v += step) {
      const major = Math.abs(v - Math.round(v)) < 1e-9
      const y = S(0, v * 16)[1]
      gridLines.push(<line key={`v${v}`} x1={-half.w} x2={half.w} y1={y} y2={y} stroke={v === 0 ? '#999' : major ? '#ddd' : '#eee'} strokeWidth={1} />)
    }
  }

  const drawRect = (r: { u0: number; u1: number; v0: number; v1: number }) => {
    const a = S(Math.min(r.u0, r.u1), Math.max(r.v0, r.v1))
    const b = S(Math.max(r.u0, r.u1), Math.min(r.v0, r.v1))
    return { x: Math.min(a[0], b[0]), y: Math.min(a[1], b[1]), w: Math.abs(b[0] - a[0]), h: Math.abs(b[1] - a[1]) }
  }

  const rectNodes = (r: { u0: number; u1: number; v0: number; v1: number }, id: string | null, preview: boolean) => {
    const n = { u0: Math.min(r.u0, r.u1), u1: Math.max(r.u0, r.u1), v0: Math.min(r.v0, r.v1), v1: Math.max(r.v0, r.v1) }
    const d = drawRect(n)
    const selected = id !== null && selection.rectIds.includes(id)
    const wPos = S((n.u0 + n.u1) / 2, n.v0)
    const hPos = S(n.u1, (n.v0 + n.v1) / 2)
    const stroke = preview ? '#0b6bcb' : selected ? '#0b6bcb' : '#222'
    return (
      <g key={id ?? 'preview'} data-rect-id={id ?? undefined}>
        <rect x={d.x} y={d.y} width={d.w} height={d.h} fill={selected ? 'rgba(11,107,203,0.12)' : 'rgba(0,0,0,0.03)'} stroke={stroke} strokeWidth={selected || preview ? 2 : 1.25} strokeDasharray={preview ? '4 3' : undefined} />
        <text
          x={wPos[0]}
          y={wPos[1] + 14}
          textAnchor="middle"
          fontSize={12}
          fill="#0b6bcb"
          style={{ cursor: id ? 'text' : undefined }}
          data-dim="w"
          onPointerDown={(e) => {
            if (!id) return
            // preventDefault stops the follow-on mousedown from blurring the input that opens here
            e.preventDefault()
            e.stopPropagation()
            setEditing({ rectId: id, dim: 'w', text: formatLength(sx(n.u1 - n.u0)) })
          }}
        >
          {formatLength(sx(n.u1 - n.u0))}
        </text>
        <text
          x={hPos[0] + (su > 0 ? 6 : -6)}
          y={hPos[1] + 4}
          textAnchor={su > 0 ? 'start' : 'end'}
          fontSize={12}
          fill="#0b6bcb"
          style={{ cursor: id ? 'text' : undefined }}
          data-dim="h"
          onPointerDown={(e) => {
            if (!id) return
            e.preventDefault()
            e.stopPropagation()
            setEditing({ rectId: id, dim: 'h', text: formatLength(sx(n.v1 - n.v0)) })
          }}
        >
          {formatLength(sx(n.v1 - n.v0))}
        </text>
      </g>
    )
  }

  const editPos = (() => {
    if (!editing) return null
    const rect = sketch.rects.find((x) => x.id === editing.rectId)
    if (!rect) return null
    const n = normRect(rect)
    const p = editing.dim === 'w' ? S((n.u0 + n.u1) / 2, n.v0) : S(n.u1, (n.v0 + n.v1) / 2)
    return { left: p[0] + half.w - 45, top: p[1] + half.h + (editing.dim === 'w' ? 4 : -10) }
  })()

  return (
    <div className="view sketch">
      <svg
        ref={svgRef}
        viewBox={`${-half.w} ${-half.h} ${size.w} ${size.h}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onContextMenu={(e) => e.preventDefault()}
        style={{ cursor: toolName === 'rect' ? 'crosshair' : 'default' }}
      >
        <g>{gridLines}</g>
        {result?.kind === 'sketch' &&
          result.outlines.map((o, i) => {
            const d = drawRect(o)
            return <rect key={`o${i}`} x={d.x} y={d.y} width={d.w} height={d.h} fill="none" stroke="#b9c7d6" strokeWidth={1} strokeDasharray="3 3" />
          })}
        {result?.kind === 'sketch' &&
          result.coplanarFaces.map((f, i) => (
            <path
              key={`f${i}`}
              d={f.loops.map((loop) => `M${loop.map((p) => S(p[0], p[1]).join(',')).join('L')}Z`).join(' ')}
              fill="rgba(120,150,190,0.18)"
              fillRule="evenodd"
              stroke="#8aa0bb"
              strokeWidth={1}
            />
          ))}
        <circle cx={S(0, 0)[0]} cy={S(0, 0)[1]} r={3} fill="#999" />
        {sketch.rects.map((r) => rectNodes(normRect(r), r.id, false))}
        {tool.preview().map((p) => rectNodes(p, null, true))}
        {pointer && pointer.kind !== 'grid' && (
          <g>
            {(() => {
              const p = S(pointer.u, pointer.v)
              return pointer.kind === 'corner' ? (
                <rect x={p[0] - 5} y={p[1] - 5} width={10} height={10} fill="none" stroke="#e08a00" strokeWidth={2} />
              ) : (
                <circle cx={p[0]} cy={p[1]} r={5} fill="none" stroke="#e08a00" strokeWidth={2} />
              )
            })()}
          </g>
        )}
      </svg>
      {editing && editPos && (
        <input
          className={`inline-edit ${editing.error ? 'invalid' : ''}`}
          style={editPos}
          autoFocus
          value={editing.text}
          title={editing.error}
          onChange={(e) => setEditing({ ...editing, text: e.target.value, error: undefined })}
          onBlur={commitEdit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitEdit()
            if (e.key === 'Escape') setEditing(null)
            e.stopPropagation()
          }}
        />
      )}
      {editing?.error && editPos && (
        <div className="inline-edit" style={{ ...editPos, top: editPos.top + 24, width: 200, color: '#b3261e', background: '#fff', border: '1px solid #b3261e' }}>
          {editing.error}
        </div>
      )}
      {labels && (
        <div className="axis-indicator">
          {sketch.name}: {plane?.plane} plane, viewed from {labels.from}. {labels.u} {su > 0 ? 'right' : 'left'}, {labels.v} up.
          {pointer && ` Pointer ${formatLength(pointer.u)}, ${formatLength(pointer.v)}`}
        </div>
      )}
    </div>
  )
}

export function sketchSvgForExport(container: HTMLElement, title: string): string | null {
  const svg = container.querySelector('svg')
  if (!svg) return null
  const clone = svg.cloneNode(true) as SVGSVGElement
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  clone.setAttribute('width', String(svg.clientWidth))
  clone.setAttribute('height', String(svg.clientHeight))
  clone.removeAttribute('style')
  const t = document.createElementNS('http://www.w3.org/2000/svg', 'title')
  t.textContent = title
  clone.insertBefore(t, clone.firstChild)
  const style = document.createElementNS('http://www.w3.org/2000/svg', 'style')
  style.textContent = 'text{font-family:system-ui,sans-serif}'
  clone.insertBefore(style, clone.firstChild)
  return new XMLSerializer().serializeToString(clone)
}

export type { Sixteenths }
