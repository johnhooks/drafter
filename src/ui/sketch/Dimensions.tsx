import type { SketchResult } from '../../core/eval/evaluate'
import { parse, simpleLink } from '../../core/expr/parser'
import type { Rect2 } from '../../core/geom/rect2d'
import { type DimLayout, LABEL_MAX, LABEL_MIN, type SketchFeature, type SketchRect, type Slot } from '../../core/model/types'
import { isExpr } from '../../core/model/types'
import { type Sixteenths, formatLength } from '../../core/units'
import type { ConstraintRef } from '../store/actions'

/** Default distances in pixels; automatic placement looks the same at every zoom. */
export const DRIVING_OFFSET_PX = 22
export const SIZE_LABEL_OFFSET_PX = 14

export interface DimTarget {
  readonly rectId: string
  readonly axis: 'u' | 'v'
  readonly slot: Slot
}

export const dimKey = (t: DimTarget) => `${t.rectId}:${t.axis}:${t.slot}`

export interface DimSpec {
  readonly ref: ConstraintRef
  readonly axis: 'u' | 'v'
  /** Anchor and driven coordinates along the axis, sixteenths. */
  readonly from: number
  readonly to: number
  /** Rectangle edge the extension lines start from, on the other axis. */
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

export interface PlacementOptions {
  /** Pixels per sixteenth at the current zoom, for automatic placement. */
  readonly pxPerSx: number
  /** Live overrides while dragging, keyed by dimKey. */
  readonly overrides?: ReadonlyMap<string, DimLayout>
}

const PROP_COORD: Record<string, (r: Rect2) => { axis: 'u' | 'v'; value: number }> = {
  left: (r) => ({ axis: 'u', value: r.u0 }),
  right: (r) => ({ axis: 'u', value: r.u1 }),
  umid: (r) => ({ axis: 'u', value: (r.u0 + r.u1) / 2 }),
  bottom: (r) => ({ axis: 'v', value: r.v0 }),
  top: (r) => ({ axis: 'v', value: r.v1 }),
  vmid: (r) => ({ axis: 'v', value: (r.v0 + r.v1) / 2 }),
}

export const clampLabel = (f: number) => Math.min(LABEL_MAX, Math.max(LABEL_MIN, f))

function layoutFor(rect: SketchRect, t: DimTarget, overrides?: ReadonlyMap<string, DimLayout>): DimLayout | undefined {
  return overrides?.get(dimKey(t)) ?? rect.layout?.[t.axis]?.[t.slot]
}

/**
 * Line position for a driving dimension. The offset runs from the reference edge continuously:
 * positive is the default side (above for u, left for v), zero is on the edge, negative passes
 * through the rectangle and out the other side. Extension lines come from the nearer edge.
 */
export function drivingLine(r: Rect2, axis: 'u' | 'v', offset: number): { at: number; edge: number } {
  if (axis === 'u') {
    const at = r.v1 + offset
    return { at, edge: at >= (r.v0 + r.v1) / 2 ? r.v1 : r.v0 }
  }
  const at = r.u0 - offset
  return { at, edge: at <= (r.u0 + r.u1) / 2 ? r.u0 : r.u1 }
}

/** Line position for a size label. Positive is below for width, right for height; continuous through the rectangle. */
export function sizeLine(r: Rect2, axis: 'u' | 'v', offset: number): { at: number; edge: number } {
  if (axis === 'u') {
    const at = r.v0 - offset
    return { at, edge: at <= (r.v0 + r.v1) / 2 ? r.v0 : r.v1 }
  }
  const at = r.u1 + offset
  return { at, edge: at >= (r.u0 + r.u1) / 2 ? r.u1 : r.u0 }
}

export interface SizeLabelSpec {
  readonly target: DimTarget
  readonly axis: 'u' | 'v'
  readonly from: number
  readonly to: number
  readonly at: number
  readonly labelAt: number
  readonly offset: number
  readonly stored: boolean
}

export function sizeLabel(rect: SketchRect, r: Rect2, axis: 'u' | 'v', opts: PlacementOptions): SizeLabelSpec {
  const target = { rectId: rect.id, axis, slot: 'size' as const }
  const stored = layoutFor(rect, target, opts.overrides)
  const offset = stored ? stored.offset : Math.round(SIZE_LABEL_OFFSET_PX / opts.pxPerSx)
  const { at } = sizeLine(r, axis, offset)
  return {
    target,
    axis,
    from: axis === 'u' ? r.u0 : r.v0,
    to: axis === 'u' ? r.u1 : r.v1,
    at,
    labelAt: clampLabel(stored?.label ?? 0.5),
    offset,
    stored: !!stored,
  }
}

/** Turns every simple link (ref, ref ± literal) into a drawable dimension; everything else becomes a tag. */
export function dimensionsOf(sketch: SketchFeature, result: SketchResult, opts: PlacementOptions): { dims: DimSpec[]; tags: TagSpec[] } {
  const dims: DimSpec[] = []
  const tags: TagSpec[] = []
  const byHandle = new Map(sketch.rects.map((r) => [r.handle, r.id]))
  const step = Math.round(DRIVING_OFFSET_PX / opts.pxPerSx)
  for (const rect of sketch.rects) {
    const resolved = result.rects.get(rect.id)
    if (!resolved) continue
    for (const axis of ['u', 'v'] as const) {
      // automatic dimensions on one axis stack outward in slot order
      let stack = 0
      for (const slot of ['min', 'max', 'size'] as const) {
        const v = rect[axis][slot]
        if (v === undefined || !isExpr(v)) continue
        const ref: ConstraintRef = { sketchId: sketch.id, rectId: rect.id, axis, slot }
        const tag = () =>
          tags.push({
            ref,
            text: `${SLOT_SHORT[axis][slot]} = ${v}`,
            u: slot === 'max' && axis === 'u' ? resolved.u1 : resolved.u0,
            v: slot === 'max' && axis === 'v' ? resolved.v1 : resolved.v0,
          })
        let link: ReturnType<typeof simpleLink> = null
        try {
          link = simpleLink(parse(v))
        } catch {
          continue
        }
        if (!link || slot === 'size' || link.ref.length !== 2) {
          tag()
          continue
        }
        const [owner, prop] = link.ref as [string, string]
        const source = owner === 'face' ? result.face : result.rects.get(byHandle.get(owner) ?? '')
        const coord = source && PROP_COORD[prop] ? PROP_COORD[prop](source) : undefined
        if (!coord || coord.axis !== axis) {
          tag()
          continue
        }
        const to = axis === 'u' ? (slot === 'min' ? resolved.u0 : resolved.u1) : slot === 'min' ? resolved.v0 : resolved.v1
        const stored = layoutFor(rect, ref, opts.overrides)
        stack += 1
        const offset = stored ? stored.offset : step * stack
        const { at, edge } = drivingLine(resolved, axis, offset)
        dims.push({
          ref,
          axis,
          from: coord.value,
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
  }
  return { dims, tags }
}

const SLOT_SHORT: Record<'u' | 'v', Record<Slot, string>> = {
  u: { min: 'left', max: 'right', size: 'width' },
  v: { min: 'bottom', max: 'top', size: 'height' },
}
