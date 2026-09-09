import type { SketchResult } from '../../core/eval/evaluate'
import type { ResolvedLine } from '../../core/eval/resolveSketch'
import { parse, simpleLink } from '../../core/expr/parser'
import type { Rect2 } from '../../core/geom/rect2d'
import type { SketchRegion } from '../../core/geom/regions'
import { type DimLayout, LABEL_MAX, LABEL_MIN, type LineSlot, type RegionRef, type SketchFeature, type SketchLine } from '../../core/model/types'
import { isExpr } from '../../core/model/types'
import { type Sixteenths, formatLength } from '../../core/units'
import type { ConstraintRef } from '../store/actions'

/** Default distances in pixels; automatic placement looks the same at every zoom. */
export const DRIVING_OFFSET_PX = 22
export const SIZE_LABEL_OFFSET_PX = 14

/** What a drawn dimension or label belongs to: a line slot, or a region's width or height. */
export type DimTarget = { readonly kind: 'line'; readonly lineId: string; readonly slot: LineSlot } | { readonly kind: 'region'; readonly ref: RegionRef; readonly axis: 'u' | 'v' }

export const dimKey = (t: DimTarget): string => (t.kind === 'line' ? `L:${t.lineId}:${t.slot}` : `R:${t.ref.vertical}:${t.ref.horizontal}:${t.axis}`)

export function parseDimKey(key: string): DimTarget | undefined {
  const parts = key.split(':')
  if (parts[0] === 'L' && parts.length === 3) return { kind: 'line', lineId: parts[1]!, slot: parts[2] as LineSlot }
  if (parts[0] === 'R' && parts.length === 4) return { kind: 'region', ref: { vertical: parts[1]!, horizontal: parts[2]! }, axis: parts[3] as 'u' | 'v' }
  return undefined
}

export interface DimSpec {
  readonly ref: ConstraintRef
  readonly target: DimTarget
  /** Axis the dimension measures along. */
  readonly axis: 'u' | 'v'
  /** Anchor and driven coordinates along the axis, sixteenths. */
  readonly from: number
  readonly to: number
  /** Where the extension lines start, on the other axis. */
  readonly edge: number
  /** Where the dimension line sits on the other axis, sixteenths. */
  readonly at: number
  /** Label position as a fraction of from..to. */
  readonly labelAt: number
  readonly label: string
  readonly literal: number
  readonly anchorName: string
  /** The offset this dimension is drawn with, sixteenths, whether stored or automatic. */
  readonly offset: number
  readonly stored: boolean
}

export interface TagSpec {
  readonly ref: ConstraintRef
  readonly text: string
  readonly u: number
  readonly v: number
}

/** A size label: a region's width or height, or a free line's length. Editable and draggable like a dimension. */
export interface LabelSpec {
  readonly target: DimTarget
  readonly axis: 'u' | 'v'
  readonly from: number
  readonly to: number
  readonly at: number
  readonly labelAt: number
  readonly offset: number
  readonly stored: boolean
  readonly value: number
}

export interface PlacementOptions {
  /** Pixels per sixteenth at the current zoom, for automatic placement. */
  readonly pxPerSx: number
  /** Live overrides while dragging, keyed by dimKey. */
  readonly overrides?: ReadonlyMap<string, DimLayout>
}

export const clampLabel = (f: number) => Math.min(LABEL_MAX, Math.max(LABEL_MIN, f))

/**
 * Line position for a dimension drawn across a line, measuring its position against a parallel anchor.
 * It sits beyond the line's default end: above the top of a vertical line, left of the left end of a
 * horizontal one. The offset runs continuously: positive is that side, negative passes along the line
 * toward and past the other end. Extension lines come from the nearer end.
 */
export function acrossLine(l: Pick<ResolvedLine, 'dir' | 'min' | 'max'>, offset: number): { at: number; edge: number } {
  const mid = (l.min + l.max) / 2
  if (l.dir === 'v') {
    const at = l.max + offset
    return { at, edge: at >= mid ? l.max : l.min }
  }
  const at = l.min - offset
  return { at, edge: at <= mid ? l.min : l.max }
}

/** Line position for a dimension along a line's run: above a horizontal line, left of a vertical one, by the offset. */
export function alongLine(l: Pick<ResolvedLine, 'dir' | 'at'>, offset: number): { at: number; edge: number } {
  return { at: l.dir === 'h' ? l.at + offset : l.at - offset, edge: l.at }
}

/** Label position for a region's width (below) or height (right); continuous through the region. */
export function regionLabelLine(r: Rect2, axis: 'u' | 'v', offset: number): number {
  return axis === 'u' ? r.v0 - offset : r.u1 + offset
}

/** Label position for a free line's length: below a horizontal line, right of a vertical one. */
export function freeLabelLine(l: Pick<ResolvedLine, 'dir' | 'at'>, offset: number): number {
  return l.dir === 'h' ? l.at - offset : l.at + offset
}

function layoutFor(stored: DimLayout | undefined, target: DimTarget, overrides?: ReadonlyMap<string, DimLayout>): DimLayout | undefined {
  return overrides?.get(dimKey(target)) ?? stored
}

/** True for a run end that is a bare reference to a perpendicular line's position: a corner, not a dimension. */
export function isAttachment(sketch: SketchFeature, line: SketchLine, slot: LineSlot): boolean {
  if (slot !== 'min' && slot !== 'max') return false
  const v = line.run[slot]
  if (v === undefined || !isExpr(v)) return false
  try {
    const link = simpleLink(parse(v))
    if (!link || link.offset !== 0 || link.ref.length !== 2 || link.ref[1] !== 'at') return false
    const other = sketch.lines.find((l) => l.handle === link.ref[0])
    return !!other && other.dir !== line.dir
  } catch {
    return false
  }
}

/** Coordinate and axis of a referenced property: face edges, or a line's position or ends. */
function anchorCoord(sketch: SketchFeature, result: SketchResult, ref: string[]): { axis: 'u' | 'v'; value: number } | undefined {
  if (ref.length !== 2) return undefined
  const [owner, prop] = ref as [string, string]
  if (owner === 'face') {
    const f = result.face
    if (!f) return undefined
    switch (prop) {
      case 'left':
        return { axis: 'u', value: f.u0 }
      case 'right':
        return { axis: 'u', value: f.u1 }
      case 'umid':
        return { axis: 'u', value: (f.u0 + f.u1) / 2 }
      case 'bottom':
        return { axis: 'v', value: f.v0 }
      case 'top':
        return { axis: 'v', value: f.v1 }
      case 'vmid':
        return { axis: 'v', value: (f.v0 + f.v1) / 2 }
      default:
        return undefined
    }
  }
  const line = sketch.lines.find((l) => l.handle === owner)
  const r = line ? result.lines.get(line.id) : undefined
  if (!r) return undefined
  const runAxis: 'u' | 'v' = r.dir === 'h' ? 'u' : 'v'
  const atAxis: 'u' | 'v' = r.dir === 'h' ? 'v' : 'u'
  switch (prop) {
    case 'at':
      return { axis: atAxis, value: r.at }
    case 'left':
    case 'bottom':
      return { axis: runAxis, value: r.min }
    case 'right':
    case 'top':
      return { axis: runAxis, value: r.max }
    case 'mid':
      return { axis: runAxis, value: (r.min + r.max) / 2 }
    default:
      return undefined
  }
}

/** Turns every simple link (ref, ref ± literal) into a drawable dimension; attachments draw nothing; everything else becomes a tag. */
export function dimensionsOf(sketch: SketchFeature, result: SketchResult, opts: PlacementOptions): { dims: DimSpec[]; tags: TagSpec[] } {
  const dims: DimSpec[] = []
  const tags: TagSpec[] = []
  const step = Math.round(DRIVING_OFFSET_PX / opts.pxPerSx)
  // automatic dimensions that share an axis and a reference edge stack outward when their spans overlap
  const placed: Array<{ axis: 'u' | 'v'; base: number; from: number; to: number; stack: number }> = []
  const stackFor = (axis: 'u' | 'v', base: number, from: number, to: number) => {
    const lo = Math.min(from, to)
    const hi = Math.max(from, to)
    let stack = 0
    for (const p of placed) {
      if (p.axis !== axis || p.base !== base) continue
      if (Math.min(p.from, p.to) <= hi && Math.max(p.from, p.to) >= lo) stack = Math.max(stack, p.stack)
    }
    placed.push({ axis, base, from, to, stack: stack + 1 })
    return stack + 1
  }
  for (const line of sketch.lines) {
    const resolved = result.lines.get(line.id)
    if (!resolved) continue
    for (const slot of ['at', 'min', 'max', 'size'] as const) {
      const v = slot === 'at' ? line.at : line.run[slot]
      if (v === undefined || !isExpr(v)) continue
      if (isAttachment(sketch, line, slot)) continue
      const ref: ConstraintRef = { sketchId: sketch.id, lineId: line.id, slot }
      const target: DimTarget = { kind: 'line', lineId: line.id, slot }
      const endU = slot === 'max' ? resolved.max : resolved.min
      const tag = () =>
        tags.push({
          ref,
          text: `${slot} = ${v}`,
          u: resolved.dir === 'h' ? (slot === 'at' || slot === 'size' ? (resolved.min + resolved.max) / 2 : endU) : resolved.at,
          v: resolved.dir === 'v' ? (slot === 'at' || slot === 'size' ? (resolved.min + resolved.max) / 2 : endU) : resolved.at,
        })
      let link: ReturnType<typeof simpleLink> = null
      try {
        link = simpleLink(parse(v))
      } catch {
        continue
      }
      if (!link || slot === 'size') {
        tag()
        continue
      }
      const anchor = anchorCoord(sketch, result, link.ref)
      const dimAxis: 'u' | 'v' = slot === 'at' ? (resolved.dir === 'h' ? 'v' : 'u') : resolved.dir === 'h' ? 'u' : 'v'
      if (!anchor || anchor.axis !== dimAxis) {
        tag()
        continue
      }
      const to = slot === 'at' ? resolved.at : endU
      const stored = layoutFor(line.layout?.[slot], target, opts.overrides)
      const base = slot === 'at' ? (resolved.dir === 'v' ? resolved.max : resolved.min) : resolved.at
      const offset = stored ? stored.offset : step * stackFor(dimAxis, base, anchor.value, to)
      const { at, edge } = slot === 'at' ? acrossLine(resolved, offset) : alongLine(resolved, offset)
      dims.push({
        ref,
        target,
        axis: dimAxis,
        from: anchor.value,
        to,
        edge,
        at,
        labelAt: clampLabel(stored?.label ?? 0.5),
        label: formatLength(Math.abs(link.offset) as Sixteenths),
        literal: link.offset,
        anchorName: link.ref.join('.'),
        offset,
        stored: !!stored,
      })
    }
  }
  return { dims, tags }
}

/** Size labels: each region's width and height, and the length of every line that bounds no region. */
export function labelsOf(sketch: SketchFeature, result: SketchResult, opts: PlacementOptions): LabelSpec[] {
  const out: LabelSpec[] = []
  const defaultOffset = Math.round(SIZE_LABEL_OFFSET_PX / opts.pxPerSx)
  const bounding = new Set(result.regions.flatMap((r) => r.boundary.map((e) => e.lineId)))
  for (const region of result.regions) {
    for (const axis of ['u', 'v'] as const) {
      const target: DimTarget = { kind: 'region', ref: region.ref, axis }
      const stored = layoutFor(sketch.regionLabels?.[region.key]?.[axis === 'u' ? 'width' : 'height'], target, opts.overrides)
      const offset = stored ? stored.offset : defaultOffset
      const b = region.bounds
      out.push({
        target,
        axis,
        from: axis === 'u' ? b.u0 : b.v0,
        to: axis === 'u' ? b.u1 : b.v1,
        at: regionLabelLine(b, axis, offset),
        labelAt: clampLabel(stored?.label ?? 0.5),
        offset,
        stored: !!stored,
        value: axis === 'u' ? b.u1 - b.u0 : b.v1 - b.v0,
      })
    }
  }
  for (const line of sketch.lines) {
    if (bounding.has(line.id)) continue
    const r = result.lines.get(line.id)
    if (!r) continue
    const target: DimTarget = { kind: 'line', lineId: line.id, slot: 'size' }
    const stored = layoutFor(line.layout?.size, target, opts.overrides)
    const offset = stored ? stored.offset : defaultOffset
    out.push({
      target,
      axis: r.dir === 'h' ? 'u' : 'v',
      from: r.min,
      to: r.max,
      at: freeLabelLine(r, offset),
      labelAt: clampLabel(stored?.label ?? 0.5),
      offset,
      stored: !!stored,
      value: r.max - r.min,
    })
  }
  return out
}

export type { SketchRegion }
