import { newId } from '../../core/model/names'
import { rectFromCorners } from '../../core/model/sketch'
import type { DimLayout, SketchRect, Slot } from '../../core/model/types'
import type { Snapped } from '../../core/snap'
import { type Sixteenths, formatLength, parseLength } from '../../core/units'

export interface PreviewRect {
  readonly u0: number
  readonly u1: number
  readonly v0: number
  readonly v1: number
}

export type EdgeSide = 'left' | 'right' | 'bottom' | 'top'

/** An edge of a rectangle (by id) or of the reference face. */
export interface EdgeRef {
  readonly owner: string
  readonly side: EdgeSide
}

export const edgeAxis = (side: EdgeSide): 'u' | 'v' => (side === 'left' || side === 'right' ? 'u' : 'v')
export const edgeSlot = (side: EdgeSide): Slot => (side === 'left' || side === 'bottom' ? 'min' : 'max')

/** A dimension the pointer is over: a driving dimension or a size label, its line or its label. */
export interface DimHit {
  readonly rectId: string
  readonly axis: 'u' | 'v'
  readonly slot: Slot
  readonly part: 'line' | 'label'
}

export interface PointerInfo {
  readonly snapped: Snapped
  /** Unsnapped plane position in sixteenths, for drags. */
  readonly raw: readonly [number, number]
  /** Screen position in pixels, for the drag threshold. */
  readonly px: readonly [number, number]
  readonly shift: boolean
  /** Rect id under the pointer, if any. */
  readonly hit?: string
  /** Edge under the pointer, if any. */
  readonly hitEdge?: EdgeRef
  readonly hitDim?: DimHit
}

export interface ToolHost {
  addRect(rect: SketchRect): void
  toggleRect(id: string, additive: boolean): void
  clearSelection(): void
  deleteSelection(): void
  /** Coordinate of an edge in sixteenths, from resolved geometry; undefined if unknown. */
  edgeCoord(edge: EdgeRef): number | undefined
  /** Expression name for an edge: face.left or r2.right. */
  edgeName(edge: EdgeRef): string | undefined
  setSlot(rectId: string, axis: 'u' | 'v', slot: Slot, expr: string): void
  notify(text: string): void
  changed(): void
  /** Current placement of a dimension, stored or automatic, plus the span its label runs along. */
  dimBase(target: DimHit): { offset: number; label: number; from: number; to: number } | undefined
  /** Live placement while dragging; null clears it. */
  previewDim(target: DimHit, layout: DimLayout | null): void
  commitDim(target: DimHit, layout: DimLayout): void
  selectDim(target: DimHit): void
  editDim(target: DimHit): void
}

export const DRAG_THRESHOLD_PX = 3

/** A request from a tool for the editor to show an inline text input at an edge. */
export interface Prompt {
  readonly edge: EdgeRef
  readonly initial: string
  readonly error?: string
}

/**
 * A tool is a small state machine. `preview()` is rendered through the same code as
 * committed rectangles so what you see while dragging is exactly what gets committed.
 */
export interface Tool {
  readonly name: 'select' | 'rect' | 'link'
  down(p: PointerInfo): void
  move(p: PointerInfo): void
  up(p: PointerInfo): void
  /** Returns true if the key was handled. */
  key(key: string): boolean
  cancel(): void
  preview(): PreviewRect[]
  /** Edges the tool wants highlighted, in order of selection. */
  highlights(): EdgeRef[]
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
  preview(): PreviewRect[] {
    return []
  }
  highlights(): EdgeRef[] {
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
    if (p.hitDim?.part === 'label') return this.host.editDim(p.hitDim)
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
    if (s.u !== e.u && s.v !== e.v) this.host.addRect(rectFromCorners(newId('r'), '', s.u, s.v, e.u, e.v))
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
  override preview(): PreviewRect[] {
    if (!this.start || !this.current) return []
    return [{ u0: this.start.u, u1: this.current.u, v0: this.start.v, v1: this.current.v }]
  }
  override hint() {
    return 'Drag to draw a rectangle'
  }
}

export class SelectTool extends BaseTool {
  readonly name = 'select'
  private candidate: { target: DimHit; start: PointerInfo; base: { offset: number; label: number; from: number; to: number } } | null = null
  private dragging = false
  private mode: 'line' | 'label' = 'line'
  private latest: DimLayout | null = null
  override down(p: PointerInfo) {
    if (p.hitDim) {
      const base = this.host.dimBase(p.hitDim)
      if (base) {
        this.candidate = { target: p.hitDim, start: p, base }
        this.dragging = false
        return
      }
    }
    if (p.hit) this.host.toggleRect(p.hit, p.shift)
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
      if (c.target.slot === 'size' && c.target.part === 'label') {
        const alongPx = c.target.axis === 'u' ? Math.abs(dx) : Math.abs(dy)
        const perpPx = c.target.axis === 'u' ? Math.abs(dy) : Math.abs(dx)
        this.mode = perpPx > alongPx ? 'line' : 'label'
      } else this.mode = c.target.part
    }
    this.latest = this.mode === 'line' ? lineDrag(c.target, c.base, c.start.raw, p.raw) : labelDrag(c.target, c.base, p.raw)
    this.host.previewDim(c.target, this.latest)
  }
  override up() {
    const c = this.candidate
    this.candidate = null
    if (!c) return
    if (this.dragging && this.latest) {
      this.host.previewDim(c.target, null)
      this.host.commitDim(c.target, this.latest)
    } else if (c.target.part === 'label') this.host.editDim(c.target)
    else this.host.selectDim(c.target)
    this.dragging = false
    this.latest = null
  }
  override key(key: string) {
    if (key === 'Escape' && this.candidate) {
      this.cancel()
      return true
    }
    if (key === 'Delete' || key === 'Backspace') {
      this.host.deleteSelection()
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
    return 'Click to select, shift-click to add, Delete to remove. Drag a dimension line or label to move it'
  }
}

/**
 * Perpendicular movement changes the offset. Positive is the dimension's default side: above for
 * horizontal driving dimensions, below for the width label, left for vertical driving dimensions,
 * right for the height label.
 */
function lineDrag(t: DimHit, base: { offset: number; label: number }, start: readonly [number, number], now: readonly [number, number]): DimLayout {
  const du = now[0] - start[0]
  const dv = now[1] - start[1]
  const driving = t.slot !== 'size'
  const delta = t.axis === 'u' ? (driving ? dv : -dv) : driving ? -du : du
  return base.label === 0.5 ? { offset: Math.round(base.offset + delta) } : { offset: Math.round(base.offset + delta), label: base.label }
}

function labelDrag(t: DimHit, base: { offset: number; from: number; to: number }, now: readonly [number, number]): DimLayout {
  const along = t.axis === 'u' ? now[0] : now[1]
  const span = base.to - base.from
  const f = span === 0 ? 0.5 : (along - base.from) / span
  return { offset: base.offset, label: Math.min(1.5, Math.max(-0.5, Math.round(f * 100) / 100)) }
}

/** Click the edge to constrain, click the anchor edge, type the distance. */
export class LinkTool extends BaseTool {
  readonly name = 'link'
  private driven: EdgeRef | null = null
  private anchor: EdgeRef | null = null
  private error: string | undefined
  override down(p: PointerInfo) {
    if (p.hitDim?.part === 'label') return this.host.editDim(p.hitDim)
    const e = p.hitEdge
    if (!e) return
    if (this.anchor) return
    if (!this.driven) {
      if (e.owner === 'face') return this.host.notify('Pick a rectangle edge first; the face can only be an anchor')
      this.driven = e
      this.host.changed()
      return
    }
    if (edgeAxis(e.side) !== edgeAxis(this.driven.side)) return this.host.notify('Those edges are not parallel; pick a parallel edge to measure from')
    if (e.owner === this.driven.owner) return this.host.notify('Pick an edge of a different rectangle or the face')
    this.anchor = e
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
  override highlights() {
    return [this.driven, this.anchor].filter((x): x is EdgeRef => !!x)
  }
  override prompt(): Prompt | null {
    if (!this.driven || !this.anchor) return null
    const d = this.host.edgeCoord(this.driven)
    const a = this.host.edgeCoord(this.anchor)
    const initial = d !== undefined && a !== undefined ? formatLength(Math.abs(d - a) as Sixteenths) : ''
    return { edge: this.driven, initial, error: this.error }
  }
  override commitPrompt(text: string) {
    if (!this.driven || !this.anchor) return
    const r = parseLength(text)
    if (!r.ok) {
      this.error = r.error
      this.host.changed()
      return
    }
    const d = this.host.edgeCoord(this.driven)
    const a = this.host.edgeCoord(this.anchor)
    const name = this.host.edgeName(this.anchor)
    if (d === undefined || a === undefined || !name) {
      this.error = 'Those edges could not be resolved'
      this.host.changed()
      return
    }
    const sign = d >= a ? '+' : '-'
    const expr = r.value === 0 ? name : `${name} ${sign} ${lenLiteral(r.value)}`
    this.host.setSlot(this.driven.owner, edgeAxis(this.driven.side), edgeSlot(this.driven.side), expr)
    this.cancel()
  }
  override hint() {
    if (!this.driven) return 'Click the edge to constrain'
    if (!this.anchor) return 'Click a parallel edge to measure from (Esc to cancel)'
    return 'Type the distance and press Enter'
  }
}

/** Formats a length for use inside an expression: 2, 2 1/4, 3/4 (no quote mark). */
export function lenLiteral(v: Sixteenths): string {
  return formatLength(v).replace(/"$/, '')
}

export function makeTool(name: Tool['name'], host: ToolHost): Tool {
  return name === 'rect' ? new RectTool(host) : name === 'link' ? new LinkTool(host) : new SelectTool(host)
}

export const DEFAULT_EXTRUDE: Sixteenths = 16 as Sixteenths
