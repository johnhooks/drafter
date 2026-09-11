import { projectEnd } from '../../core/model/sketch'
import type { DimLayout, LineDir, RegionRef } from '../../core/model/types'
import type { Snapped } from '../../core/snap'
import { type Sixteenths, formatLength, parseLength } from '../../core/units'
import type { DimTarget } from './Dimensions'

export interface PreviewRect {
  readonly u0: number
  readonly u1: number
  readonly v0: number
  readonly v1: number
}

export interface PreviewLine {
  readonly dir: LineDir
  readonly at: number
  readonly from: number
  readonly to: number
}

export type FaceSide = 'left' | 'right' | 'bottom' | 'top'

/** Something the link tool can pick: a sketch line, or an edge of the reference face. */
export type LinkTarget = { readonly kind: 'line'; readonly lineId: string } | { readonly kind: 'face'; readonly side: FaceSide }

/** Direction of the line a face edge lies along: left and right edges are vertical. */
export const faceEdgeDir = (side: FaceSide): LineDir => (side === 'left' || side === 'right' ? 'v' : 'h')

/** A dimension the pointer is over: its line or its label. */
export interface DimHit {
  readonly target: DimTarget
  readonly part: 'line' | 'label'
}

export interface PointerInfo {
  readonly snapped: Snapped
  /** Unsnapped plane position in sixteenths, for drags. */
  readonly raw: readonly [number, number]
  /** Screen position in pixels, for the drag threshold. */
  readonly px: readonly [number, number]
  readonly shift: boolean
  /** Line under the pointer, if any. Lines are drawn over regions, so they win. */
  readonly hitLine?: string
  readonly hitRegion?: RegionRef
  /** Reference face edge under the pointer, if any. */
  readonly hitFaceEdge?: FaceSide
  readonly hitDim?: DimHit
}

export interface LineInfo {
  readonly handle: string
  readonly dir: LineDir
  readonly at: number
  readonly min: number
  readonly max: number
}

export interface ToolHost {
  addLine(line: PreviewLine): void
  addRectangle(u0: number, u1: number, v0: number, v1: number): void
  toggleLine(id: string, additive: boolean): void
  toggleRegion(ref: RegionRef, additive: boolean): void
  clearSelection(): void
  /** Resolved geometry of a line, or undefined if it failed. */
  lineInfo(id: string): LineInfo | undefined
  /** Coordinate of a reference face edge in sixteenths, undefined without a face. */
  faceCoord(side: FaceSide): number | undefined
  setLineAt(lineId: string, expr: string): void
  notify(text: string): void
  changed(): void
  /** Current placement of a dimension, stored or automatic, plus the span its label runs along. */
  dimBase(target: DimTarget): { offset: number; label: number; from: number; to: number } | undefined
  /** Live placement while dragging; null clears it. */
  previewDim(target: DimTarget, layout: DimLayout | null): void
  commitDim(target: DimTarget, layout: DimLayout): void
  selectDim(target: DimTarget): void
  editDim(target: DimTarget): void
}

export const DRAG_THRESHOLD_PX = 3

/** A request from a tool for the editor to show an inline text input beside a line. */
export interface Prompt {
  readonly lineId: string
  readonly initial: string
  readonly error?: string
}

/**
 * A tool is a small state machine. `preview()` is rendered through the same code as
 * committed geometry so what you see while drawing is exactly what gets committed.
 */
export interface Tool {
  readonly name: 'select' | 'line' | 'rect' | 'link'
  down(p: PointerInfo): void
  move(p: PointerInfo): void
  up(p: PointerInfo): void
  /** Escape or Enter while something is in progress; returns true when consumed. Everything else is a command. */
  key(key: string): boolean
  cancel(): void
  previewRects(): PreviewRect[]
  previewLines(): PreviewLine[]
  /** Targets the tool wants highlighted, in order of selection. */
  highlights(): LinkTarget[]
  prompt(): Prompt | null
  commitPrompt(text: string): void
  hint(): string
}

abstract class BaseTool implements Tool {
  abstract readonly name: Tool['name']
  constructor(protected host: ToolHost) {}
  down(_p: PointerInfo) {}
  move(_p: PointerInfo) {}
  up(_p: PointerInfo) {}
  key(_key: string) {
    return false
  }
  cancel() {}
  previewRects(): PreviewRect[] {
    return []
  }
  previewLines(): PreviewLine[] {
    return []
  }
  highlights(): LinkTarget[] {
    return []
  }
  prompt(): Prompt | null {
    return null
  }
  commitPrompt(_text: string) {}
  hint() {
    return ''
  }
}

export class RectTool extends BaseTool {
  readonly name = 'rect'
  private start: Snapped | null = null
  private current: Snapped | null = null
  override down(p: PointerInfo) {
    if (p.hitDim?.part === 'label') return this.host.editDim(p.hitDim.target)
    this.start = p.snapped
    this.current = p.snapped
    this.host.changed()
  }
  override move(p: PointerInfo) {
    if (!this.start) return
    this.current = p.snapped
    this.host.changed()
  }
  override up(p: PointerInfo) {
    if (!this.start) return
    const s = this.start
    const e = p.snapped
    this.start = null
    this.current = null
    if (s.u !== e.u && s.v !== e.v) this.host.addRectangle(s.u, e.u, s.v, e.v)
    this.host.changed()
  }
  override key(key: string) {
    if (key === 'Escape' && this.start) {
      this.cancel()
      return true
    }
    return false
  }
  override cancel() {
    this.start = null
    this.current = null
    this.host.changed()
  }
  override previewRects(): PreviewRect[] {
    if (!this.start || !this.current) return []
    return [{ u0: this.start.u, u1: this.current.u, v0: this.start.v, v1: this.current.v }]
  }
  override hint() {
    return 'Drag to draw a rectangle'
  }
}

/** Click to start, click to end and start the next line from there; Escape or Enter ends the chain. */
export class LineTool extends BaseTool {
  readonly name = 'line'
  private start: Snapped | null = null
  private current: Snapped | null = null
  private skipUp = false
  override down(p: PointerInfo) {
    if (p.hitDim?.part === 'label' && !this.start) {
      this.skipUp = true
      return this.host.editDim(p.hitDim.target)
    }
  }
  override move(p: PointerInfo) {
    if (!this.start) return
    this.current = p.snapped
    this.host.changed()
  }
  override up(p: PointerInfo) {
    if (this.skipUp) {
      this.skipUp = false
      return
    }
    if (!this.start) {
      this.start = p.snapped
      this.current = p.snapped
      this.host.changed()
      return
    }
    const line = this.lineTo(p.snapped)
    if (!line) return
    this.host.addLine(line.line)
    this.start = { ...p.snapped, u: line.end[0] as Sixteenths, v: line.end[1] as Sixteenths }
    this.current = this.start
    this.host.changed()
  }
  private lineTo(end: Snapped): { line: PreviewLine; end: [number, number] } | null {
    const s = this.start!
    if (s.u === end.u && s.v === end.v) return null
    const { dir, end: e } = projectEnd([s.u, s.v], [end.u, end.v])
    const along = dir === 'h' ? [s.u, e[0]] : [s.v, e[1]]
    if (along[0] === along[1]) return null
    return { line: { dir, at: dir === 'h' ? s.v : s.u, from: along[0]!, to: along[1]! }, end: e }
  }
  override key(key: string) {
    if ((key === 'Escape' || key === 'Enter') && this.start) {
      this.cancel()
      return true
    }
    return false
  }
  override cancel() {
    this.start = null
    this.current = null
    this.host.changed()
  }
  override previewLines(): PreviewLine[] {
    if (!this.start || !this.current) return []
    const l = this.lineTo(this.current)
    return l ? [l.line] : []
  }
  override hint() {
    return this.start ? 'Click to end the line and start the next; Escape or Enter to stop' : 'Click to start a line'
  }
}

export class SelectTool extends BaseTool {
  readonly name = 'select'
  private candidate: { target: DimTarget; start: PointerInfo; base: { offset: number; label: number; from: number; to: number } } | null = null
  private dragging = false
  private mode: 'line' | 'label' = 'line'
  private latest: DimLayout | null = null
  override down(p: PointerInfo) {
    if (p.hitDim) {
      const base = this.host.dimBase(p.hitDim.target)
      if (base) {
        this.candidate = { target: p.hitDim.target, start: p, base, ...{} }
        this.dragging = false
        this.mode = p.hitDim.part
        return
      }
    }
    if (p.hitLine) this.host.toggleLine(p.hitLine, p.shift)
    else if (p.hitRegion) this.host.toggleRegion(p.hitRegion, p.shift)
    else if (!p.shift) this.host.clearSelection()
  }
  override move(p: PointerInfo) {
    const c = this.candidate
    if (!c) return
    if (!this.dragging) {
      const dx = p.px[0] - c.start.px[0]
      const dy = p.px[1] - c.start.px[1]
      if (Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return
      this.dragging = true
      // a size label is its own line: the first movement decides whether it slides along or moves away
      if (isSizeLabel(c.target) && this.mode === 'label') {
        const axis = labelAxis(c.target)
        const alongPx = axis === 'u' ? Math.abs(dx) : Math.abs(dy)
        const perpPx = axis === 'u' ? Math.abs(dy) : Math.abs(dx)
        this.mode = perpPx > alongPx ? 'line' : 'label'
      }
    }
    const axis = this.host.dimBase(c.target) ? dimAxis(c.target, this.host) : 'u'
    this.latest = this.mode === 'line' ? lineDrag(c.target, axis, c.base, c.start.raw, p.raw, this.host) : labelDrag(axis, c.base, p.raw)
    this.host.previewDim(c.target, this.latest)
  }
  override up() {
    const c = this.candidate
    this.candidate = null
    if (!c) return
    if (this.dragging && this.latest) {
      this.host.previewDim(c.target, null)
      this.host.commitDim(c.target, this.latest)
    } else if (this.mode === 'label') this.host.editDim(c.target)
    else this.host.selectDim(c.target)
    this.dragging = false
    this.latest = null
  }
  override key(key: string) {
    if (key === 'Escape' && this.candidate) {
      this.cancel()
      return true
    }
    return false
  }
  override cancel() {
    if (this.candidate) this.host.previewDim(this.candidate.target, null)
    this.candidate = null
    this.dragging = false
    this.latest = null
  }
  override hint() {
    return 'Click a line or a region to select, shift-click to add, Delete to remove, X for construction. Drag a dimension line or label to move it'
  }
}

const isSizeLabel = (t: DimTarget) => t.kind === 'region' || t.slot === 'size'

/** Axis a size label runs along. */
function labelAxis(t: DimTarget): 'u' | 'v' {
  return t.kind === 'region' ? t.axis : 'u'
}

/**
 * Axis a dimension measures along: a region width along u; a position dimension of a vertical line
 * along u; a run dimension of a horizontal line along u; the mirror for the other direction.
 */
function dimAxis(t: DimTarget, host: ToolHost): 'u' | 'v' {
  if (t.kind === 'region') return t.axis
  const info = host.lineInfo(t.lineId)
  if (!info) return 'u'
  if (t.slot === 'at') return info.dir === 'v' ? 'u' : 'v'
  return info.dir === 'h' ? 'u' : 'v'
}

/**
 * Perpendicular movement changes the offset. Positive is the dimension's default side: above for a
 * dimension across vertical lines, left for one across horizontal lines, above or left for run
 * dimensions, below for a width label, right for a height label, below or right for a free line's length.
 */
function lineDrag(t: DimTarget, axis: 'u' | 'v', base: { offset: number; label: number }, start: readonly [number, number], now: readonly [number, number], host: ToolHost): DimLayout {
  const du = now[0] - start[0]
  const dv = now[1] - start[1]
  let delta: number
  if (t.kind === 'region') delta = axis === 'u' ? -dv : du
  else if (t.slot === 'size') delta = axis === 'u' ? -dv : du
  else if (t.slot === 'at') {
    const info = host.lineInfo(t.lineId)
    delta = info?.dir === 'v' ? dv : -du
  } else {
    const info = host.lineInfo(t.lineId)
    delta = info?.dir === 'h' ? dv : -du
  }
  return base.label === 0.5 ? { offset: Math.round(base.offset + delta) } : { offset: Math.round(base.offset + delta), label: base.label }
}

function labelDrag(axis: 'u' | 'v', base: { offset: number; from: number; to: number }, now: readonly [number, number]): DimLayout {
  const along = axis === 'u' ? now[0] : now[1]
  const span = base.to - base.from
  const f = span === 0 ? 0.5 : (along - base.from) / span
  return { offset: base.offset, label: Math.min(1.5, Math.max(-0.5, Math.round(f * 100) / 100)) }
}

/** Click the line to constrain, click a parallel line or face edge to measure from, type the distance. */
export class LinkTool extends BaseTool {
  readonly name = 'link'
  private driven: string | null = null
  private anchor: LinkTarget | null = null
  private error: string | undefined
  override down(p: PointerInfo) {
    if (p.hitDim?.part === 'label') return this.host.editDim(p.hitDim.target)
    if (this.anchor) return
    if (!this.driven) {
      if (p.hitLine) {
        this.driven = p.hitLine
        this.host.changed()
      } else if (p.hitFaceEdge) this.host.notify('Pick a sketch line first; the face can only be an anchor')
      return
    }
    const d = this.host.lineInfo(this.driven)
    if (!d) return
    if (p.hitLine) {
      if (p.hitLine === this.driven) return this.host.notify('Pick a different line or a face edge to measure from')
      const a = this.host.lineInfo(p.hitLine)
      if (!a) return
      if (a.dir !== d.dir) return this.host.notify('Those lines are not parallel; pick a parallel line to measure from')
      this.anchor = { kind: 'line', lineId: p.hitLine }
    } else if (p.hitFaceEdge) {
      if (faceEdgeDir(p.hitFaceEdge) !== d.dir) return this.host.notify('That face edge is not parallel; pick a parallel edge to measure from')
      this.anchor = { kind: 'face', side: p.hitFaceEdge }
    } else return
    this.host.changed()
  }
  override key(key: string) {
    if (key === 'Escape' && (this.driven || this.anchor)) {
      this.cancel()
      return true
    }
    return false
  }
  override cancel() {
    this.driven = null
    this.anchor = null
    this.error = undefined
    this.host.changed()
  }
  override highlights(): LinkTarget[] {
    const out: LinkTarget[] = []
    if (this.driven) out.push({ kind: 'line', lineId: this.driven })
    if (this.anchor) out.push(this.anchor)
    return out
  }
  private anchorCoord(): number | undefined {
    if (!this.anchor) return undefined
    return this.anchor.kind === 'line' ? this.host.lineInfo(this.anchor.lineId)?.at : this.host.faceCoord(this.anchor.side)
  }
  private anchorName(): string | undefined {
    if (!this.anchor) return undefined
    if (this.anchor.kind === 'face') return `face.${this.anchor.side}`
    const info = this.host.lineInfo(this.anchor.lineId)
    return info ? `${info.handle}.at` : undefined
  }
  override prompt(): Prompt | null {
    if (!this.driven || !this.anchor) return null
    const d = this.host.lineInfo(this.driven)?.at
    const a = this.anchorCoord()
    const initial = d !== undefined && a !== undefined ? formatLength(Math.abs(d - a) as Sixteenths) : ''
    return { lineId: this.driven, initial, error: this.error }
  }
  override commitPrompt(text: string) {
    if (!this.driven || !this.anchor) return
    const r = parseLength(text)
    if (!r.ok) {
      this.error = r.error
      this.host.changed()
      return
    }
    const d = this.host.lineInfo(this.driven)?.at
    const a = this.anchorCoord()
    const name = this.anchorName()
    if (d === undefined || a === undefined || !name) {
      this.error = 'Those lines could not be resolved'
      this.host.changed()
      return
    }
    const sign = d >= a ? '+' : '-'
    const expr = r.value === 0 ? name : `${name} ${sign} ${lenLiteral(r.value)}`
    this.host.setLineAt(this.driven, expr)
    this.cancel()
  }
  override hint() {
    if (!this.driven) return 'Click the line to constrain'
    if (!this.anchor) return 'Click a parallel line or face edge to measure from (Esc to cancel)'
    return 'Type the distance and press Enter'
  }
}

/** Formats a length for use inside an expression: 2, 2 1/4, 3/4 (no quote mark). */
export function lenLiteral(v: Sixteenths): string {
  return formatLength(v).replace(/"$/, '')
}

export function makeTool(name: Tool['name'], host: ToolHost): Tool {
  switch (name) {
    case 'rect':
      return new RectTool(host)
    case 'line':
      return new LineTool(host)
    case 'link':
      return new LinkTool(host)
    default:
      return new SelectTool(host)
  }
}

export const DEFAULT_EXTRUDE: Sixteenths = 16 as Sixteenths
