import { useEffect, useMemo, useReducer, useRef, useState } from 'react'
import type { ResolvedLine } from '../../core/eval/resolveSketch'
import type { Rect2 } from '../../core/geom/rect2d'
import type { SketchRegion } from '../../core/geom/regions'
import type { DimLayout, RegionRef, SketchFeature, SketchLine } from '../../core/model/types'
import { regionKey, sameRegion } from '../../core/model/types'
import { type SnapContext, snap } from '../../core/snap'
import { type Sixteenths, formatLength, parseLength } from '../../core/units'
import type { ConstraintRef, LineShape } from '../store/actions'
import { useStore } from '../store/store'
import { useViewHooks } from '../useCommands'
import { type DimSpec, type DimTarget, type LabelSpec, type TagSpec, type TickSpec, dimKey, dimensionsOf, labelsOf, parseDimKey } from './Dimensions'
import { type DimHit, type FaceSide, type LineInfo, type LinkTarget, type PointerInfo, type PreviewLine, type Tool, lenLiteral, makeTool } from './tools'
import { type SketchView, axisLabels, mirrorSign, toPlaneInches, toScreen } from './view'

const SNAP_PX = 6
const HOVER_GRACE_MS = 150
/** Anchor edges light in a violet that no other mark in the sketch uses. */
const ANCHOR_COLOR = '#8a5cf6'
const FACE_SIDES: readonly FaceSide[] = ['left', 'right', 'bottom', 'top']

type Editing =
  | { kind: 'label'; target: DimTarget; text: string; error?: string }
  | { kind: 'literal'; dim: DimSpec; text: string; error?: string }

interface Props {
  sketch: SketchFeature
}

/** A line to draw: resolved, or the last good shape of a failed one. */
interface Drawn {
  readonly line: SketchLine
  readonly shape: LineShape
  readonly failed: boolean
}

export function SketchEditor({ sketch }: Props) {
  const ev = useStore((s) => s.eval)
  const toolName = useStore((s) => s.tool)
  const selection = useStore((s) => s.selection)
  const lastGood = useStore((s) => s.lastGood)
  const display = useStore((s) => s.display)
  const exprFocus = useStore((s) => s.exprFocus)
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
  const [overrides, setOverrides] = useState<Map<string, DimLayout>>(new Map())
  const [hover, setHover] = useState<{ line?: string; region?: string }>({})
  const [, bump] = useReducer((x: number) => x + 1, 0)
  const pan = useRef<{ x: number; y: number; cu: number; cv: number } | null>(null)
  // pointer capture retargets moves to the svg during a press, so hover must not clear until release
  const pressed = useRef(false)
  const space = useRef(false)
  const pxPerSx = view.scale / 16

  // drawn geometry: resolved lines, or the last good shape for a failed one
  const drawn = useMemo(() => {
    const out: Drawn[] = []
    for (const line of sketch.lines) {
      const res = sr?.lines.get(line.id)
      if (res) out.push({ line, shape: res, failed: false })
      else {
        const lg = lastGood.get(line.id)
        if (lg) out.push({ line, shape: lg, failed: true })
      }
    }
    return out
  }, [sketch.lines, sr, lastGood])
  const byId = useMemo(() => new Map(drawn.map((d) => [d.line.id, d])), [drawn])
  const regions: readonly SketchRegion[] = sr?.regions ?? []

  useEffect(() => {
    const el = svgRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }))
    ro.observe(el)
    setSize({ w: el.clientWidth, h: el.clientHeight })
    return () => ro.disconnect()
  }, [])

  // on open, frame the reference geometry and existing lines; empty sketches centre on 1 foot square
  useEffect(() => {
    const el = svgRef.current
    if (!el) return
    const rects: Rect2[] = [...(sr?.coplanarFaces.flatMap((f) => f.rects) ?? []), ...(sr?.outlines ?? []), ...drawn.map((d) => shapeRect(d.shape))]
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

  // every constraint is computed so automatic stacking is stable; whether one is drawn is decided below
  const dims = useMemo(() => (sr ? dimensionsOf(sketch, sr, { pxPerSx, overrides }) : { dims: [] as DimSpec[], tags: [] as TagSpec[], ticks: [] as TickSpec[] }), [sketch, sr, pxPerSx, overrides])
  const labels = useMemo(() => (sr ? labelsOf(sketch, sr, { pxPerSx, overrides }) : ([] as LabelSpec[])), [sketch, sr, pxPerSx, overrides])

  // the tool must survive re-renders during a drag, so its host reads the latest values through a ref
  const latest = useRef({ sr, byId, dims, labels, regions })
  latest.current = { sr, byId, dims, labels, regions }

  const lineInfo = (id: string): LineInfo | undefined => {
    const d = latest.current.byId.get(id)
    if (!d || d.failed) return undefined
    return { handle: d.line.handle, dir: d.shape.dir, at: d.shape.at, min: d.shape.min, max: d.shape.max }
  }
  const faceCoord = (side: FaceSide): number | undefined => {
    const f = latest.current.sr?.face
    if (!f) return undefined
    return side === 'left' ? f.u0 : side === 'right' ? f.u1 : side === 'bottom' ? f.v0 : f.v1
  }
  const dimBase = (t: DimTarget) => {
    const { dims, labels } = latest.current
    if (t.kind === 'region' || t.slot === 'size') {
      const l = labels.find((x) => dimKey(x.target) === dimKey(t))
      return l ? { offset: l.offset, label: l.labelAt, from: l.from, to: l.to } : undefined
    }
    const d = dims.dims.find((x) => dimKey(x.target) === dimKey(t))
    return d ? { offset: d.offset, label: d.labelAt, from: d.from, to: d.to } : undefined
  }

  const tool = useMemo<Tool>(
    () =>
      makeTool(toolName, {
        addLine: (l) => dispatch('addLine', sketch.id, { dir: l.dir, at: l.at, from: l.from, to: l.to }),
        addRectangle: (u0, u1, v0, v1) => dispatch('addRectangle', sketch.id, u0, u1, v0, v1),
        toggleLine: (id, additive) => dispatch('toggleLine', id, additive),
        toggleRegion: (ref, additive) => dispatch('toggleRegion', ref, additive),
        clearSelection: () => dispatch('select', { featureId: sketch.id }),
        lineInfo,
        faceCoord,
        setLineAt: (lineId, expr) => dispatch('setLineSlot', sketch.id, lineId, 'at', expr),
        notify: (t) => dispatch('notify', t),
        changed: bump,
        dimBase,
        previewDim: (t, layout) =>
          setOverrides((prev) => {
            const next = new Map(prev)
            if (layout) next.set(dimKey(t), layout)
            else next.delete(dimKey(t))
            return next
          }),
        commitDim: (t, layout) => {
          if (t.kind === 'region') dispatch('setRegionLabelLayout', sketch.id, t.ref, t.axis === 'u' ? 'width' : 'height', layout)
          else dispatch('setDimLayout', sketch.id, t.lineId, t.slot, layout)
        },
        selectDim: (t) => {
          if (t.kind === 'line' && t.slot !== 'size') dispatch('selectConstraint', { sketchId: sketch.id, lineId: t.lineId, slot: t.slot })
        },
        editDim: (t) => {
          const { dims, labels } = latest.current
          if (t.kind === 'region' || t.slot === 'size') {
            const l = labels.find((x) => dimKey(x.target) === dimKey(t))
            if (!l) return
            setEditing({ kind: 'label', target: t, text: formatLength(l.value as Sixteenths) })
          } else {
            const d = dims.dims.find((x) => dimKey(x.target) === dimKey(t))
            if (!d) return
            dispatch('selectConstraint', d.ref)
            setEditing({ kind: 'literal', dim: d, text: d.label })
          }
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [toolName, sketch.id, dispatch],
  )

  // snap candidates: reference faces, body outlines, and the sketch's own lines and endpoints
  const snapCtx = useMemo<SnapContext>(() => {
    const corners: Array<[number, number]> = []
    const uEdges: number[] = []
    const vEdges: number[] = []
    const rects = [...(sr?.coplanarFaces.flatMap((f) => f.rects) ?? []), ...(sr?.outlines ?? [])]
    for (const r of rects) {
      corners.push([r.u0, r.v0], [r.u1, r.v0], [r.u0, r.v1], [r.u1, r.v1])
      uEdges.push(r.u0, r.u1)
      vEdges.push(r.v0, r.v1)
    }
    for (const d of drawn) {
      const [u0, v0, u1, v1] = ends(d.shape)
      corners.push([u0, v0], [u1, v1])
      if (d.shape.dir === 'v') uEdges.push(d.shape.at)
      else vEdges.push(d.shape.at)
    }
    return { corners, uEdges, vEdges, range: (SNAP_PX / view.scale) * 16 }
  }, [sr, drawn, view.scale])

  const pointerInfo = (e: React.PointerEvent): PointerInfo => {
    const rect = svgRef.current!.getBoundingClientRect()
    const px = e.clientX - rect.left - rect.width / 2
    const py = e.clientY - rect.top - rect.height / 2
    const [ui, vi] = toPlaneInches(view, su, px, py)
    const raw: [number, number] = [ui * 16, vi * 16]
    const snapped = snap(raw[0], raw[1], snapCtx)
    const target = e.target as Element
    const faceAttr = target.closest?.('[data-face-edge]')?.getAttribute('data-face-edge')
    const hitFaceEdge = faceAttr && FACE_SIDES.includes(faceAttr as FaceSide) ? (faceAttr as FaceSide) : undefined
    const hitLine = target.closest?.('[data-line-id]')?.getAttribute('data-line-id') ?? undefined
    const regionAttr = target.closest?.('[data-region]')?.getAttribute('data-region')
    const hitRegion = regionAttr ? parseRegionKey(regionAttr) : undefined
    const dimEl = target.closest?.('[data-dim-slot]')
    const dimAttr = dimEl?.getAttribute('data-dim-slot')
    const hitDim = dimAttr ? parseDimHit(dimAttr, target.closest?.('[data-dim-label]') ? 'label' : 'line') : undefined
    return { snapped, raw, px: [px, py], shift: e.shiftKey, hitLine, hitRegion, hitFaceEdge, hitDim }
  }

  // the app's key handler asks the tool about Escape and Enter first; cancelTool serves tool switches and the cancel command
  const toolRef = useRef(tool)
  toolRef.current = tool
  useViewHooks({ cancelTool: () => toolRef.current.cancel(), toolConsumes: (key) => toolRef.current.key(key) })

  // Space is a drag modifier, not a chord
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return
      if (e.code === 'Space') {
        space.current = true
        e.preventDefault()
      }
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
  }, [])

  // keys belong to the canvas whenever the pointer is over it: a toolbar toggle keeps focus after a click,
  // and Space would press it again instead of panning. Text fields keep focus so typing is not interrupted.
  const takeFocus = () => {
    const active = document.activeElement
    if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) return
    svgRef.current?.focus({ preventScroll: true })
  }

  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const clearHoverSoon = (start: boolean) => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current)
    hoverTimer.current = start ? setTimeout(() => setHover({}), HOVER_GRACE_MS) : null
  }
  useEffect(() => () => clearHoverSoon(false), [])

  const onPointerDown = (e: React.PointerEvent) => {
    takeFocus()
    if (editing || tool.prompt()) return
    if (e.button === 1 || (e.button === 0 && space.current)) {
      pan.current = { x: e.clientX, y: e.clientY, cu: view.cu, cv: view.cv }
      ;(e.target as Element).setPointerCapture?.(e.pointerId)
      e.preventDefault()
      return
    }
    if (e.button !== 0) return
    e.preventDefault()
    svgRef.current?.setPointerCapture(e.pointerId)
    pressed.current = true
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
    // labels sit a few pixels outside the thing they measure, so hover clears after a short grace
    // rather than the instant the pointer is over nothing; over something else it switches at once
    const dim = info.hitDim?.target
    const line = info.hitLine ?? (dim?.kind === 'line' ? dim.lineId : undefined)
    const region = info.hitRegion ? regionKey(info.hitRegion) : dim?.kind === 'region' ? regionKey(dim.ref) : undefined
    if (line || region) {
      clearHoverSoon(false)
      if (line !== hover.line || region !== hover.region) setHover({ line, region })
    } else if ((hover.line || hover.region) && !pressed.current) clearHoverSoon(true)
    tool.move(info)
  }
  const onPointerUp = (e: React.PointerEvent) => {
    if (pan.current) {
      pan.current = null
      return
    }
    if (e.button !== 0) return
    pressed.current = false
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
    if (editing.kind === 'label') {
      if (r.value <= 0) return setEditing({ ...editing, error: 'Must be greater than zero' })
      const t = editing.target
      if (t.kind === 'region') dispatch('setRegionSize', sketch.id, t.ref, t.axis, r.value)
      else dispatch('setLineSlot', sketch.id, t.lineId, 'size', r.value)
    } else {
      const d = editing.dim
      const sign = d.literal >= 0 ? '+' : '-'
      const expr = r.value === 0 ? d.anchorName : `${d.anchorName} ${sign} ${lenLiteral(r.value)}`
      dispatch('setLineSlot', sketch.id, d.ref.lineId, d.ref.slot, expr)
    }
    setEditing(null)
  }

  const S = (u: number, v: number) => toScreen(view, su, u / 16, v / 16)
  const half = { w: size.w / 2, h: size.h / 2 }
  const axisText = plane ? axisLabels(plane) : null

  // visible range in inches for the grid
  const uMin = Math.min(...[-half.w, half.w].map((px) => toPlaneInches(view, su, px, 0)[0]))
  const uMax = Math.max(...[-half.w, half.w].map((px) => toPlaneInches(view, su, px, 0)[0]))
  const vMin = toPlaneInches(view, su, 0, half.h)[1]
  const vMax = toPlaneInches(view, su, 0, -half.h)[1]
  const showQuarter = view.scale * 0.25 >= 8
  const gridLines: React.ReactNode[] = []
  const step = showQuarter ? 0.25 : 1
  if (display.grid && (uMax - uMin) / step < 2000) {
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
  const highlighted = (t: LinkTarget) => highlights.some((h) => (h.kind === 'line' && t.kind === 'line' ? h.lineId === t.lineId : h.kind === 'face' && t.kind === 'face' && h.side === t.side))

  // nothing is labelled unasked: a label shows for what is hovered, selected, or being edited, or when its toggle is on.
  // A hovered bounding line counts as hovering its regions, so crossing a line does not flash the labels off.
  const hoveredRegions = new Set<string>()
  if (hover.region) hoveredRegions.add(hover.region)
  if (hover.line) for (const r of regions) if (r.boundary.some((e) => e.lineId === hover.line)) hoveredRegions.add(r.key)
  const selectedRegions = new Set(selection.regions.map(regionKey))
  const editingKey = editing?.kind === 'label' ? dimKey(editing.target) : null
  const lineActive = (id: string) => hover.line === id || selection.lineIds.includes(id)
  const showLabel = (t: DimTarget) => {
    if (display.sizes || dimKey(t) === editingKey) return true
    if (t.kind === 'region') {
      const k = regionKey(t.ref)
      return hoveredRegions.has(k) || selectedRegions.has(k)
    }
    return lineActive(t.lineId)
  }
  const showHandle = (id: string) => display.handles || exprFocus || lineActive(id)
  const isSelectedConstraint = (ref: ConstraintRef) => !!selection.constraint && ref.lineId === selection.constraint.lineId && ref.slot === selection.constraint.slot
  const showConstraint = (ref: ConstraintRef) => display.constraints || lineActive(ref.lineId) || isSelectedConstraint(ref)
  // with the toggle off an active line's constraints are the only ones drawn, so emphasis would say nothing
  const emphasis = (ref: ConstraintRef): 'selected' | 'highlight' | undefined =>
    isSelectedConstraint(ref) ? 'selected' : display.constraints && lineActive(ref.lineId) ? 'highlight' : undefined

  // region fills, drawn under the lines so a click on a line wins
  const regionNodes = regions.map((r) => {
    const selected = selection.regions.some((s) => sameRegion(s, r.ref))
    const hovered = hover.region === r.key
    const fill = selected ? 'rgba(11,107,203,0.22)' : hovered ? 'rgba(11,107,203,0.10)' : 'rgba(0,0,0,0.04)'
    const d = r.rects
      .map((x) => {
        const p = drawRect(x)
        return `M${p.x},${p.y}h${p.w}v${p.h}h${-p.w}Z`
      })
      .join(' ')
    return <path key={r.key} data-region={r.key} d={d} fill={fill} style={{ cursor: toolName === 'select' ? 'pointer' : undefined }} />
  })

  const lineNode = (id: string | null, line: SketchLine | null, shape: LineShape, preview: boolean, failed = false) => {
    const [u0, v0, u1, v1] = ends(shape)
    const a = S(u0, v0)
    const b = S(u1, v1)
    const selected = id !== null && selection.lineIds.includes(id)
    const hovered = id !== null && hover.line === id && toolName !== 'rect'
    const construction = !!line?.construction
    const stroke = failed ? '#b3261e' : preview || selected ? '#0b6bcb' : hovered ? '#3a86d6' : construction ? '#8a9bb0' : '#222'
    const width = selected || preview || hovered ? 2.5 : construction ? 1 : 1.5
    const dash = preview || failed ? '4 3' : construction ? '6 4' : undefined
    const mid = S((u0 + u1) / 2, (v0 + v1) / 2)
    return (
      <g key={id ?? 'preview'} data-line-id={id ?? undefined} style={{ cursor: id && toolName !== 'rect' && toolName !== 'line' ? 'pointer' : undefined }}>
        {id && <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke="transparent" strokeWidth={10} />}
        <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={stroke} strokeWidth={width} strokeDasharray={dash} strokeLinecap="square" />
        {preview && (
          <text x={mid[0] + (shape.dir === 'h' ? 0 : 8)} y={mid[1] + (shape.dir === 'h' ? 14 : 4)} textAnchor={shape.dir === 'h' ? 'middle' : 'start'} fontSize={12} fill="#0b6bcb">
            {formatLength((shape.max - shape.min) as Sixteenths)}
          </text>
        )}
        {line && showHandle(line.id) && (
          <text
            x={mid[0] + (shape.dir === 'h' ? 0 : 5)}
            y={mid[1] + (shape.dir === 'h' ? -4 : 3)}
            textAnchor={shape.dir === 'h' ? 'middle' : 'start'}
            fontSize={9}
            fill={failed ? '#b3261e' : '#999'}
            fontFamily="ui-monospace, monospace"
            pointerEvents="none"
            data-handle={line.handle}
          >
            {line.handle}
          </text>
        )}
      </g>
    )
  }

  const previewRectNodes = tool.previewRects().map((p, i) => {
    const r = { u0: Math.min(p.u0, p.u1), u1: Math.max(p.u0, p.u1), v0: Math.min(p.v0, p.v1), v1: Math.max(p.v0, p.v1) }
    const d = drawRect(r)
    return (
      <g key={`pr${i}`}>
        <rect x={d.x} y={d.y} width={d.w} height={d.h} fill="rgba(11,107,203,0.06)" stroke="#0b6bcb" strokeWidth={2} strokeDasharray="4 3" />
        <text x={S((r.u0 + r.u1) / 2, r.v0)[0]} y={S(0, r.v0)[1] + 14} textAnchor="middle" fontSize={12} fill="#0b6bcb">
          {formatLength((r.u1 - r.u0) as Sixteenths)}
        </text>
        <text x={S(r.u1, 0)[0] + 6 * su} y={S(0, (r.v0 + r.v1) / 2)[1] + 4} textAnchor={su > 0 ? 'start' : 'end'} fontSize={12} fill="#0b6bcb">
          {formatLength((r.v1 - r.v0) as Sixteenths)}
        </text>
      </g>
    )
  })
  const previewLineNodes = tool.previewLines().map((l: PreviewLine) => lineNode(null, null, { dir: l.dir, at: l.at, min: Math.min(l.from, l.to), max: Math.max(l.from, l.to) }, true))

  /** A label with an invisible hit rectangle behind it, so a press between glyphs still lands. */
  const labelNode = (x: number, y: number, anchor: 'start' | 'middle' | 'end', text: string, fill: string, fontSize: number, extra: Record<string, string> = {}) => {
    const w = text.length * fontSize * 0.62 + 8
    // stays clear of the dimension line beside it, which is 5 px past the baseline
    const h = fontSize + 3
    const left = anchor === 'middle' ? x - w / 2 : anchor === 'start' ? x - 4 : x - w + 4
    return (
      <g data-dim-label style={{ cursor: 'grab' }}>
        <rect x={left} y={y - fontSize} width={w} height={h} fill="transparent" />
        <text x={x} y={y} textAnchor={anchor} fontSize={fontSize} fill={fill} {...extra}>
          {text}
        </text>
      </g>
    )
  }

  // size labels are dimension-like: draggable along their edge and away from it
  const labelNodes = labels.filter((sl) => showLabel(sl.target)).map((sl) => {
    const key = dimKey(sl.target)
    const along = sl.from + (sl.to - sl.from) * sl.labelAt
    const p = sl.axis === 'u' ? S(along, sl.at) : S(sl.at, along)
    const kind = sl.target.kind === 'region' ? (sl.axis === 'u' ? 'w' : 'h') : 'len'
    return (
      <g key={key} data-dim-slot={key}>
        {labelNode(p[0], p[1] + 4, sl.axis === 'u' ? 'middle' : su > 0 ? 'start' : 'end', formatLength(sl.value as Sixteenths), '#0b6bcb', 12, { 'data-dim': kind })}
      </g>
    )
  })

  const dimNodes = dims.dims.filter((d) => showConstraint(d.ref)).map((d) => {
    const key = dimKey(d.target)
    const level = emphasis(d.ref)
    const selected = level === 'selected'
    const color = level ? '#0b6bcb' : '#8a5a00'
    const marks = { 'data-dim-highlight': level ? true : undefined, 'data-dim-selected': selected || undefined }
    const labelAlong = d.from + (d.to - d.from) * d.labelAt
    if (d.axis === 'u') {
      const y = S(0, d.at)[1]
      const ye = S(0, d.edge)[1]
      const x1 = S(d.from, 0)[0]
      const x2 = S(d.to, 0)[0]
      const past = y > ye ? 4 : -4
      const lx = S(labelAlong, 0)[0]
      return (
        <g key={key} data-dim-slot={key} {...marks} style={{ cursor: 'ns-resize' }}>
          <line x1={x1} y1={ye} x2={x1} y2={y + past} stroke={color} strokeWidth={1} />
          <line x1={x2} y1={ye} x2={x2} y2={y + past} stroke={color} strokeWidth={1} />
          <line x1={x1} y1={y} x2={x2} y2={y} stroke="transparent" strokeWidth={10} />
          <line x1={x1} y1={y} x2={x2} y2={y} stroke={color} strokeWidth={selected ? 2.5 : 1} />
          <line x1={x1} y1={y - 3} x2={x1} y2={y + 3} stroke={color} strokeWidth={2} />
          <line x1={x2} y1={y - 3} x2={x2} y2={y + 3} stroke={color} strokeWidth={2} />
          {labelNode(lx, y > ye ? y + 13 : y - 5, 'middle', d.label, color, 11)}
        </g>
      )
    }
    const x = S(d.at, 0)[0]
    const xe = S(d.edge, 0)[0]
    const y1 = S(0, d.from)[1]
    const y2 = S(0, d.to)[1]
    const past = x > xe ? 4 : -4
    const ly = S(0, labelAlong)[1]
    return (
      <g key={key} data-dim-slot={key} {...marks} style={{ cursor: 'ew-resize' }}>
        <line x1={xe} y1={y1} x2={x + past} y2={y1} stroke={color} strokeWidth={1} />
        <line x1={xe} y1={y2} x2={x + past} y2={y2} stroke={color} strokeWidth={1} />
        <line x1={x} y1={y1} x2={x} y2={y2} stroke="transparent" strokeWidth={10} />
        <line x1={x} y1={y1} x2={x} y2={y2} stroke={color} strokeWidth={selected ? 2.5 : 1} />
        <line x1={x - 3} y1={y1} x2={x + 3} y2={y1} stroke={color} strokeWidth={2} />
        <line x1={x - 3} y1={y2} x2={x + 3} y2={y2} stroke={color} strokeWidth={2} />
        {labelNode(x > xe ? x + 6 : x - 6, ly + 4, x > xe ? 'start' : 'end', d.label, color, 11)}
      </g>
    )
  })

  const tagNodes = dims.tags.filter((t) => showConstraint(t.ref)).map((t) => {
    const p = S(t.u, t.v)
    return (
      <text key={`${t.ref.lineId}:${t.ref.slot}`} x={p[0] + 4} y={p[1] - 4} fontSize={10} fill="#8a5a00" fontFamily="ui-monospace, monospace">
        {t.text}
      </text>
    )
  })

  // a constraint shown by hover, selection, or the list lights the edges it measures from, so the pair reads together
  const anchorNodes = (() => {
    const lit = new Map<string, [[number, number], [number, number]]>()
    for (const d of dims.dims) {
      if (!lineActive(d.ref.lineId) && !isSelectedConstraint(d.ref)) continue
      for (const a of d.anchors) {
        const key = a.kind === 'line' ? `line:${a.lineId}` : `face:${a.side}`
        if (lit.has(key)) continue
        let seg: [[number, number], [number, number]] | undefined
        if (a.kind === 'line') {
          const drawnLine = byId.get(a.lineId)
          if (!drawnLine) continue
          const [u0, v0, u1, v1] = ends(drawnLine.shape)
          seg = [S(u0, v0), S(u1, v1)]
        } else if (sr?.face) {
          const f = sr.face
          seg =
            a.side === 'left' ? [S(f.u0, f.v0), S(f.u0, f.v1)] : a.side === 'right' ? [S(f.u1, f.v0), S(f.u1, f.v1)] : a.side === 'bottom' ? [S(f.u0, f.v0), S(f.u1, f.v0)] : [S(f.u0, f.v1), S(f.u1, f.v1)]
        }
        if (seg) lit.set(key, seg)
      }
    }
    return [...lit.entries()].map(([key, seg]) => (
      <line key={key} data-anchor={key} x1={seg[0][0]} y1={seg[0][1]} x2={seg[1][0]} y2={seg[1][1]} stroke={ANCHOR_COLOR} strokeWidth={5} strokeOpacity={0.45} pointerEvents="none" />
    ))
  })()

  // the resting cue for a driven slot whose constraint is not drawn: a short tick across the line
  const tickNodes = dims.ticks.filter((t) => !showConstraint(t.ref)).map((t) => {
    const [x, y] = S(t.u, t.v)
    const [dx, dy] = t.dir === 'h' ? [0, 3] : [3, 0]
    return <line key={`${t.ref.lineId}:${t.ref.slot}`} data-tick={`${t.ref.lineId}:${t.ref.slot}`} x1={x - dx} y1={y - dy} x2={x + dx} y2={y + dy} stroke="#8a5a00" strokeWidth={1.5} pointerEvents="none" />
  })

  // the reference face's edges are anchors for the link tool
  const faceEdgeNodes = (r: Rect2) => {
    const sides: Array<[FaceSide, [number, number], [number, number]]> = [
      ['left', S(r.u0, r.v0), S(r.u0, r.v1)],
      ['right', S(r.u1, r.v0), S(r.u1, r.v1)],
      ['bottom', S(r.u0, r.v0), S(r.u1, r.v0)],
      ['top', S(r.u0, r.v1), S(r.u1, r.v1)],
    ]
    return sides.map(([side, p, q]) => {
      const hl = highlighted({ kind: 'face', side })
      return (
        <line
          key={`face:${side}`}
          data-face-edge={side}
          x1={p[0]}
          y1={p[1]}
          x2={q[0]}
          y2={q[1]}
          stroke={hl ? '#e08a00' : 'transparent'}
          strokeWidth={hl ? 4 : 10}
          style={{ cursor: toolName === 'link' ? 'pointer' : undefined }}
        />
      )
    })
  }

  const highlightNodes = highlights.map((h, i) => {
    let p: [number, number] | null = null
    let seg: [[number, number], [number, number]] | null = null
    if (h.kind === 'face') {
      const r = sr?.face
      if (r) p = h.side === 'left' || h.side === 'right' ? S(h.side === 'left' ? r.u0 : r.u1, (r.v0 + r.v1) / 2) : S((r.u0 + r.u1) / 2, h.side === 'bottom' ? r.v0 : r.v1)
    } else {
      const d = byId.get(h.lineId)
      if (d) {
        const [u0, v0, u1, v1] = ends(d.shape)
        seg = [S(u0, v0), S(u1, v1)]
        p = [(seg[0][0] + seg[1][0]) / 2, (seg[0][1] + seg[1][1]) / 2]
      }
    }
    if (!p) return null
    return (
      <g key={`hl${i}`}>
        {seg && <line x1={seg[0][0]} y1={seg[0][1]} x2={seg[1][0]} y2={seg[1][1]} stroke="#e08a00" strokeWidth={4} pointerEvents="none" />}
        <text x={p[0] + 8} y={p[1] - 8} fontSize={11} fill="#e08a00" fontWeight={600} data-link-label>
          {i === 0 ? 'constrain' : 'anchor'}
        </text>
      </g>
    )
  })

  // inline input placement for size labels, dimension literals, and the link prompt
  const prompt = tool.prompt()
  const inputPos = (() => {
    if (editing?.kind === 'label') {
      const sl = labels.find((x) => dimKey(x.target) === dimKey(editing.target))
      if (!sl) return null
      const along = sl.from + (sl.to - sl.from) * sl.labelAt
      const p = sl.axis === 'u' ? S(along, sl.at) : S(sl.at, along)
      return { left: p[0] + half.w - 45, top: p[1] + half.h - 10 }
    }
    if (editing?.kind === 'literal') {
      const d = editing.dim
      const along = d.from + (d.to - d.from) * d.labelAt
      const p = d.axis === 'u' ? S(along, d.at) : S(d.at, along)
      return { left: p[0] + half.w - 45, top: p[1] + half.h - 10 }
    }
    if (prompt) {
      const d = byId.get(prompt.lineId)
      if (!d) return null
      const [u0, v0, u1, v1] = ends(d.shape)
      const p = S((u0 + u1) / 2, (v0 + v1) / 2)
      return { left: p[0] + half.w - 45, top: p[1] + half.h - 10 }
    }
    return null
  })()
  const inputText = editing ? editing.text : (prompt?.initial ?? '')
  const inputError = editing ? editing.error : prompt?.error
  const [promptText, setPromptText] = useState<string | null>(null)
  useEffect(() => setPromptText(null), [prompt?.lineId])

  return (
    <div className="view sketch">
      <svg
        ref={svgRef}
        viewBox={`${-half.w} ${-half.h} ${size.w} ${size.h}`}
        tabIndex={-1}
        onPointerEnter={takeFocus}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={() => {
          // the inline input sits over the canvas, so opening it counts as leaving; keep the label under edit
          clearHoverSoon(false)
          if (!editing && !tool.prompt()) setHover({})
        }}
        onContextMenu={(e) => e.preventDefault()}
        style={{ cursor: toolName === 'rect' || toolName === 'line' ? 'crosshair' : 'default', outline: 'none' }}
      >
        <g data-grid>{gridLines}</g>
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
        {regionNodes}
        {sr?.face && faceEdgeNodes(sr.face)}
        {drawn.map((d) => lineNode(d.line.id, d.line, d.shape, false, d.failed))}
        {previewRectNodes}
        {previewLineNodes}
        {anchorNodes}
        {dimNodes}
        {tagNodes}
        {tickNodes}
        {labelNodes}
        {highlightNodes}
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
      {axisText && (
        <div className="axis-indicator">
          {sketch.name}: {plane?.plane} plane, viewed from {axisText.from}. {axisText.u} {su > 0 ? 'right' : 'left'}, {axisText.v} up.
          {pointer && ` Pointer ${formatLength(pointer.u)}, ${formatLength(pointer.v)}`}
        </div>
      )}
      {tool.hint() && <div className="hint">{tool.hint()}</div>}
    </div>
  )
}

/** Endpoints of a line shape in plane coordinates: [u0, v0, u1, v1]. */
function ends(l: LineShape): [number, number, number, number] {
  return l.dir === 'h' ? [l.min, l.at, l.max, l.at] : [l.at, l.min, l.at, l.max]
}

function shapeRect(l: LineShape): Rect2 {
  const [u0, v0, u1, v1] = ends(l)
  return { u0, u1, v0, v1 }
}

function parseRegionKey(key: string): RegionRef | undefined {
  const [vertical, horizontal] = key.split('|')
  return vertical && horizontal ? { vertical, horizontal } : undefined
}

function parseDimHit(attr: string, part: 'line' | 'label'): DimHit | undefined {
  const target = parseDimKey(attr)
  return target ? { target, part } : undefined
}

export type { ConstraintRef, ResolvedLine }

export function sketchSvgForExport(container: HTMLElement, title: string): string | null {
  const svg = container.querySelector('svg')
  if (!svg) return null
  const clone = svg.cloneNode(true) as SVGSVGElement
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  clone.setAttribute('width', String(svg.clientWidth))
  clone.setAttribute('height', String(svg.clientHeight))
  clone.removeAttribute('style')
  for (const el of clone.querySelectorAll('[data-face-edge]')) el.remove()
  const t = document.createElementNS('http://www.w3.org/2000/svg', 'title')
  t.textContent = title
  clone.insertBefore(t, clone.firstChild)
  const style = document.createElementNS('http://www.w3.org/2000/svg', 'style')
  style.textContent = 'text{font-family:system-ui,sans-serif}'
  clone.insertBefore(style, clone.firstChild)
  return new XMLSerializer().serializeToString(clone)
}
