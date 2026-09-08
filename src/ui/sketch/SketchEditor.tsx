import { useEffect, useMemo, useReducer, useRef, useState } from 'react'
import type { Rect2 } from '../../core/geom/rect2d'
import type { SketchFeature, SketchRect, Slot } from '../../core/model/types'
import { type SnapContext, snap } from '../../core/snap'
import { type Sixteenths, formatLength, parseLength } from '../../core/units'
import type { ConstraintRef } from '../store/actions'
import { useStore } from '../store/store'
import { type DimSpec, dimensionsOf } from './Dimensions'
import { type EdgeRef, type EdgeSide, type PointerInfo, type Tool, edgeAxis, edgeSlot, lenLiteral, makeTool } from './tools'
import { type SketchView, axisLabels, mirrorSign, toPlaneInches, toScreen } from './view'

const SNAP_PX = 6
const DIM_OFFSET_PX = 22

type Editing =
  | { kind: 'size'; rectId: string; axis: 'u' | 'v'; text: string; error?: string }
  | { kind: 'literal'; dim: DimSpec; text: string; error?: string }

interface Props {
  sketch: SketchFeature
}

export function SketchEditor({ sketch }: Props) {
  const ev = useStore((s) => s.eval)
  const toolName = useStore((s) => s.tool)
  const selection = useStore((s) => s.selection)
  const lastGood = useStore((s) => s.lastGood)
  const showDims = useStore((s) => s.showDims)
  const dispatch = useStore((s) => s.dispatch)
  const result = ev.results.get(sketch.id)
  const sr = result?.kind === 'sketch' ? result : null
  const plane = sr?.plane ?? null
  const su = plane ? mirrorSign(plane) : 1

  const svgRef = useRef<SVGSVGElement>(null)
  const [view, setView] = useState<SketchView>({ cu: 12, cv: 12, scale: 12 })
  const [size, setSize] = useState({ w: 800, h: 600 })
  const [pointer, setPointer] = useState<ReturnType<typeof snap> | null>(null)
  const [editing, setEditing] = useState<Editing | null>(null)
  const [, bump] = useReducer((x: number) => x + 1, 0)
  const pan = useRef<{ x: number; y: number; cu: number; cv: number } | null>(null)
  const space = useRef(false)

  // drawn geometry: resolved rectangles, or the last good position for a failed one
  const drawn = useMemo(() => {
    const out: Array<{ rect: SketchRect; r: Rect2; failed: boolean }> = []
    for (const rect of sketch.rects) {
      const res = sr?.rects.get(rect.id)
      if (res) out.push({ rect, r: res, failed: false })
      else {
        const lg = lastGood.get(rect.id)
        if (lg) out.push({ rect, r: lg, failed: true })
      }
    }
    return out
  }, [sketch.rects, sr, lastGood])
  const byId = useMemo(() => new Map(drawn.map((d) => [d.rect.id, d])), [drawn])

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
    const rects = [...(sr?.coplanarFaces.flatMap((f) => f.rects) ?? []), ...(sr?.outlines ?? []), ...drawn.map((d) => d.r)]
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

  const edgeCoord = (e: EdgeRef): number | undefined => {
    const r = e.owner === 'face' ? sr?.face : byId.get(e.owner)?.r
    if (!r) return undefined
    return e.side === 'left' ? r.u0 : e.side === 'right' ? r.u1 : e.side === 'bottom' ? r.v0 : r.v1
  }
  const edgeName = (e: EdgeRef): string | undefined => {
    if (e.owner === 'face') return sr?.face ? `face.${e.side}` : undefined
    const rect = byId.get(e.owner)?.rect
    return rect ? `${rect.handle}.${e.side}` : undefined
  }

  const tool = useMemo<Tool>(
    () =>
      makeTool(toolName, {
        addRect: (r) => dispatch('addRect', sketch.id, r),
        toggleRect: (id, additive) => dispatch('toggleRect', id, additive),
        clearSelection: () => dispatch('select', { featureId: sketch.id }),
        deleteSelection: () => {
          const sel = useStore.getState().selection
          if (sel.constraint) dispatch('removeConstraint', sel.constraint)
          else if (sel.rectIds.length) dispatch('removeRects', sketch.id, sel.rectIds)
        },
        edgeCoord,
        edgeName,
        setSlot: (rectId, axis, slot, expr) => dispatch('setRectSlot', sketch.id, rectId, axis, slot, expr),
        notify: (t) => dispatch('notify', t),
        changed: bump,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [toolName, sketch.id, dispatch, byId, sr?.face],
  )

  // snap candidates: reference faces, body outlines, and the sketch's own rectangles
  const snapCtx = useMemo<SnapContext>(() => {
    const corners: Array<[number, number]> = []
    const uEdges: number[] = []
    const vEdges: number[] = []
    const rects = [...(sr?.coplanarFaces.flatMap((f) => f.rects) ?? []), ...(sr?.outlines ?? []), ...drawn.map((d) => d.r)]
    for (const r of rects) {
      corners.push([r.u0, r.v0], [r.u1, r.v0], [r.u0, r.v1], [r.u1, r.v1])
      uEdges.push(r.u0, r.u1)
      vEdges.push(r.v0, r.v1)
    }
    return { corners, uEdges, vEdges, range: (SNAP_PX / view.scale) * 16 }
  }, [sr, drawn, view.scale])

  const pointerInfo = (e: React.PointerEvent): PointerInfo => {
    const rect = svgRef.current!.getBoundingClientRect()
    const px = e.clientX - rect.left - rect.width / 2
    const py = e.clientY - rect.top - rect.height / 2
    const [ui, vi] = toPlaneInches(view, su, px, py)
    const snapped = snap(ui * 16, vi * 16, snapCtx)
    const target = e.target as Element
    const edgeAttr = target.closest?.('[data-edge]')?.getAttribute('data-edge')
    const hitEdge = edgeAttr ? parseEdge(edgeAttr) : undefined
    const hit = target.closest?.('[data-rect-id]')?.getAttribute('data-rect-id') ?? undefined
    return { snapped, shift: e.shiftKey, hit, hitEdge }
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
    if (editing || tool.prompt()) return
    if (e.button === 1 || (e.button === 0 && space.current)) {
      pan.current = { x: e.clientX, y: e.clientY, cu: view.cu, cv: view.cv }
      ;(e.target as Element).setPointerCapture?.(e.pointerId)
      e.preventDefault()
      return
    }
    if (e.button !== 0) return
    const target = e.target as Element
    const dimAttr = target.closest?.('[data-dim-slot]')?.getAttribute('data-dim-slot')
    if (dimAttr && toolName === 'select') {
      e.preventDefault()
      dispatch('selectConstraint', parseConstraint(sketch.id, dimAttr))
      return
    }
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
    if (!r.ok) return setEditing({ ...editing, error: r.error })
    if (editing.kind === 'size') {
      if (r.value <= 0) return setEditing({ ...editing, error: 'Must be greater than zero' })
      dispatch('setRectSlot', sketch.id, editing.rectId, editing.axis, 'size', r.value)
    } else {
      const d = editing.dim
      const sign = d.literal >= 0 ? '+' : '-'
      const expr = r.value === 0 ? d.anchorName : `${d.anchorName} ${sign} ${lenLiteral(r.value)}`
      dispatch('setRectSlot', sketch.id, d.ref.rectId, d.ref.axis, d.ref.slot, expr)
    }
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

  const drawRect = (r: Rect2) => {
    const a = S(r.u0, r.v1)
    const b = S(r.u1, r.v0)
    return { x: Math.min(a[0], b[0]), y: Math.min(a[1], b[1]), w: Math.abs(b[0] - a[0]), h: Math.abs(b[1] - a[1]) }
  }

  const highlights = tool.highlights()
  const isHighlighted = (owner: string, side: EdgeSide) => highlights.some((h) => h.owner === owner && h.side === side)

  const edgeLines = (owner: string, r: Rect2) => {
    const a = S(r.u0, r.v0)
    const b = S(r.u1, r.v1)
    const sides: Array<[EdgeSide, [number, number], [number, number]]> = [
      ['left', S(r.u0, r.v0), S(r.u0, r.v1)],
      ['right', S(r.u1, r.v0), S(r.u1, r.v1)],
      ['bottom', a, S(r.u1, r.v0)],
      ['top', S(r.u0, r.v1), b],
    ]
    return sides.map(([side, p, q]) => (
      <line
        key={`${owner}:${side}`}
        data-edge={`${owner}:${side}`}
        x1={p[0]}
        y1={p[1]}
        x2={q[0]}
        y2={q[1]}
        stroke={isHighlighted(owner, side) ? '#e08a00' : 'transparent'}
        strokeWidth={isHighlighted(owner, side) ? 4 : 10}
        style={{ cursor: toolName === 'link' ? 'pointer' : undefined }}
      />
    ))
  }

  const rectNodes = (r: Rect2, rect: SketchRect | null, preview: boolean, failed = false) => {
    const d = drawRect(r)
    const id = rect?.id ?? null
    const selected = id !== null && selection.rectIds.includes(id)
    const wPos = S((r.u0 + r.u1) / 2, r.v0)
    const hPos = S(r.u1, (r.v0 + r.v1) / 2)
    const stroke = failed ? '#b3261e' : preview || selected ? '#0b6bcb' : '#222'
    return (
      <g key={id ?? 'preview'} data-rect-id={id ?? undefined}>
        <rect
          x={d.x}
          y={d.y}
          width={d.w}
          height={d.h}
          fill={failed ? 'rgba(179,38,30,0.08)' : selected ? 'rgba(11,107,203,0.12)' : 'rgba(0,0,0,0.03)'}
          stroke={stroke}
          strokeWidth={selected || preview ? 2 : 1.25}
          strokeDasharray={preview || failed ? '4 3' : undefined}
        />
        {rect && !failed && (
          <>
            <text
              x={wPos[0]}
              y={wPos[1] + 14}
              textAnchor="middle"
              fontSize={12}
              fill="#0b6bcb"
              style={{ cursor: 'text' }}
              data-dim="w"
              onPointerDown={(e) => {
                // preventDefault stops the follow-on mousedown from blurring the input that opens here
                e.preventDefault()
                e.stopPropagation()
                setEditing({ kind: 'size', rectId: rect.id, axis: 'u', text: formatLength((r.u1 - r.u0) as Sixteenths) })
              }}
            >
              {formatLength((r.u1 - r.u0) as Sixteenths)}
            </text>
            <text
              x={hPos[0] + (su > 0 ? 6 : -6)}
              y={hPos[1] + 4}
              textAnchor={su > 0 ? 'start' : 'end'}
              fontSize={12}
              fill="#0b6bcb"
              style={{ cursor: 'text' }}
              data-dim="h"
              onPointerDown={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setEditing({ kind: 'size', rectId: rect.id, axis: 'v', text: formatLength((r.v1 - r.v0) as Sixteenths) })
              }}
            >
              {formatLength((r.v1 - r.v0) as Sixteenths)}
            </text>
          </>
        )}
        {rect && <text x={d.x + 4} y={d.y + 12} fontSize={10} fill={failed ? '#b3261e' : '#888'} fontFamily="ui-monospace, monospace">
          {rect.handle}
        </text>}
      </g>
    )
  }

  const dims = useMemo(() => (sr && showDims ? dimensionsOf(sketch, sr) : { dims: [], tags: [] }), [sketch, sr, showDims])

  const dimNodes = dims.dims.map((d) => {
    const key = `${d.ref.rectId}:${d.ref.axis}:${d.ref.slot}`
    const selected = selection.constraint && `${selection.constraint.rectId}:${selection.constraint.axis}:${selection.constraint.slot}` === key
    const color = selected ? '#0b6bcb' : '#8a5a00'
    const off = DIM_OFFSET_PX
    if (d.axis === 'u') {
      const y = S(0, d.at)[1] + off
      const x1 = S(d.from, 0)[0]
      const x2 = S(d.to, 0)[0]
      const ya = S(0, d.at)[1]
      return (
        <g key={key} data-dim-slot={key} style={{ cursor: 'pointer' }}>
          <line x1={x1} y1={ya} x2={x1} y2={y + 4} stroke={color} strokeWidth={1} />
          <line x1={x2} y1={ya} x2={x2} y2={y + 4} stroke={color} strokeWidth={1} />
          <line x1={x1} y1={y} x2={x2} y2={y} stroke={color} strokeWidth={selected ? 2 : 1} />
          <line x1={x1} y1={y - 3} x2={x1} y2={y + 3} stroke={color} strokeWidth={2} />
          <line x1={x2} y1={y - 3} x2={x2} y2={y + 3} stroke={color} strokeWidth={2} />
          <text
            x={(x1 + x2) / 2}
            y={y + 13}
            textAnchor="middle"
            fontSize={11}
            fill={color}
            data-dim-label
            onPointerDown={(e) => {
              e.preventDefault()
              e.stopPropagation()
              dispatch('selectConstraint', d.ref)
              setEditing({ kind: 'literal', dim: d, text: d.label })
            }}
          >
            {d.label}
          </text>
        </g>
      )
    }
    const x = S(d.at, 0)[0] + off * su
    const y1 = S(0, d.from)[1]
    const y2 = S(0, d.to)[1]
    const xa = S(d.at, 0)[0]
    return (
      <g key={key} data-dim-slot={key} style={{ cursor: 'pointer' }}>
        <line x1={xa} y1={y1} x2={x + 4 * su} y2={y1} stroke={color} strokeWidth={1} />
        <line x1={xa} y1={y2} x2={x + 4 * su} y2={y2} stroke={color} strokeWidth={1} />
        <line x1={x} y1={y1} x2={x} y2={y2} stroke={color} strokeWidth={selected ? 2 : 1} />
        <line x1={x - 3} y1={y1} x2={x + 3} y2={y1} stroke={color} strokeWidth={2} />
        <line x1={x - 3} y1={y2} x2={x + 3} y2={y2} stroke={color} strokeWidth={2} />
        <text
          x={x + 6 * su}
          y={(y1 + y2) / 2 + 4}
          textAnchor={su > 0 ? 'start' : 'end'}
          fontSize={11}
          fill={color}
          data-dim-label
          onPointerDown={(e) => {
            e.preventDefault()
            e.stopPropagation()
            dispatch('selectConstraint', d.ref)
            setEditing({ kind: 'literal', dim: d, text: d.label })
          }}
        >
          {d.label}
        </text>
      </g>
    )
  })

  const tagNodes = dims.tags.map((t) => {
    const p = S(t.u, t.v)
    return (
      <text key={`${t.ref.rectId}:${t.ref.axis}:${t.ref.slot}`} x={p[0] + 4} y={p[1] - 4} fontSize={10} fill="#8a5a00" fontFamily="ui-monospace, monospace">
        {t.text}
      </text>
    )
  })

  // inline input placement for size labels, dimension literals, and the link prompt
  const prompt = tool.prompt()
  const inputPos = (() => {
    if (editing?.kind === 'size') {
      const d = byId.get(editing.rectId)
      if (!d) return null
      const p = editing.axis === 'u' ? S((d.r.u0 + d.r.u1) / 2, d.r.v0) : S(d.r.u1, (d.r.v0 + d.r.v1) / 2)
      return { left: p[0] + half.w - 45, top: p[1] + half.h + (editing.axis === 'u' ? 4 : -10) }
    }
    if (editing?.kind === 'literal') {
      const d = editing.dim
      const p = d.axis === 'u' ? [S((d.from + d.to) / 2, 0)[0], S(0, d.at)[1] + DIM_OFFSET_PX] : [S(d.at, 0)[0] + DIM_OFFSET_PX * su, S(0, (d.from + d.to) / 2)[1]]
      return { left: p[0]! + half.w - 45, top: p[1]! + half.h - 10 }
    }
    if (prompt) {
      const c = edgeCoord(prompt.edge)
      const d = byId.get(prompt.edge.owner)
      if (c === undefined || !d) return null
      const p = edgeAxis(prompt.edge.side) === 'u' ? S(c, (d.r.v0 + d.r.v1) / 2) : S((d.r.u0 + d.r.u1) / 2, c)
      return { left: p[0] + half.w - 45, top: p[1] + half.h - 10 }
    }
    return null
  })()
  const inputText = editing ? editing.text : (prompt?.initial ?? '')
  const inputError = editing ? editing.error : prompt?.error
  const [promptText, setPromptText] = useState<string | null>(null)
  useEffect(() => setPromptText(null), [prompt?.edge.owner, prompt?.edge.side])

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
        {sr?.outlines.map((o, i) => {
          const d = drawRect(o)
          return <rect key={`o${i}`} x={d.x} y={d.y} width={d.w} height={d.h} fill="none" stroke="#b9c7d6" strokeWidth={1} strokeDasharray="3 3" />
        })}
        {sr?.coplanarFaces.map((f, i) => (
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
        {drawn.map((d) => rectNodes(d.r, d.rect, false, d.failed))}
        {tool.preview().map((p) => rectNodes({ u0: Math.min(p.u0, p.u1), u1: Math.max(p.u0, p.u1), v0: Math.min(p.v0, p.v1), v1: Math.max(p.v0, p.v1) }, null, true))}
        {dimNodes}
        {tagNodes}
        {sr?.face && edgeLines('face', sr.face)}
        {drawn.filter((d) => !d.failed).map((d) => edgeLines(d.rect.id, d.r))}
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
      {(editing || prompt) && inputPos && (
        <input
          className={`inline-edit ${inputError ? 'invalid' : ''}`}
          style={inputPos}
          autoFocus
          value={editing ? inputText : (promptText ?? inputText)}
          title={inputError}
          onChange={(e) => (editing ? setEditing({ ...editing, text: e.target.value, error: undefined }) : setPromptText(e.target.value))}
          onBlur={() => editing && commitEdit()}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              if (editing) commitEdit()
              else tool.commitPrompt(promptText ?? inputText)
            }
            if (e.key === 'Escape') {
              if (editing) setEditing(null)
              else tool.cancel()
            }
            e.stopPropagation()
          }}
        />
      )}
      {inputError && inputPos && (
        <div className="inline-edit" style={{ ...inputPos, top: inputPos.top + 24, width: 240, color: '#b3261e', background: '#fff', border: '1px solid #b3261e' }}>
          {inputError}
        </div>
      )}
      {labels && (
        <div className="axis-indicator">
          {sketch.name}: {plane?.plane} plane, viewed from {labels.from}. {labels.u} {su > 0 ? 'right' : 'left'}, {labels.v} up.
          {pointer && ` Pointer ${formatLength(pointer.u)}, ${formatLength(pointer.v)}`}
        </div>
      )}
      {tool.hint() && <div className="hint">{tool.hint()}</div>}
    </div>
  )
}

function parseEdge(attr: string): EdgeRef | undefined {
  const i = attr.lastIndexOf(':')
  if (i < 0) return undefined
  const side = attr.slice(i + 1) as EdgeSide
  if (!['left', 'right', 'bottom', 'top'].includes(side)) return undefined
  return { owner: attr.slice(0, i), side }
}

function parseConstraint(sketchId: string, attr: string): ConstraintRef | undefined {
  const parts = attr.split(':')
  if (parts.length !== 3) return undefined
  return { sketchId, rectId: parts[0]!, axis: parts[1] as 'u' | 'v', slot: parts[2] as Slot }
}

export { edgeSlot }

export function sketchSvgForExport(container: HTMLElement, title: string): string | null {
  const svg = container.querySelector('svg')
  if (!svg) return null
  const clone = svg.cloneNode(true) as SVGSVGElement
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  clone.setAttribute('width', String(svg.clientWidth))
  clone.setAttribute('height', String(svg.clientHeight))
  clone.removeAttribute('style')
  for (const el of clone.querySelectorAll('[data-edge]')) el.remove()
  const t = document.createElementNS('http://www.w3.org/2000/svg', 'title')
  t.textContent = title
  clone.insertBefore(t, clone.firstChild)
  const style = document.createElementNS('http://www.w3.org/2000/svg', 'style')
  style.textContent = 'text{font-family:system-ui,sans-serif}'
  clone.insertBefore(style, clone.firstChild)
  return new XMLSerializer().serializeToString(clone)
}
