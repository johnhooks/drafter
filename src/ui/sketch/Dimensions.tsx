import type { SketchResult } from '../../core/eval/evaluate'
import { parse, simpleLink } from '../../core/expr/parser'
import type { Rect2 } from '../../core/geom/rect2d'
import type { SketchFeature, Slot } from '../../core/model/types'
import { isExpr } from '../../core/model/types'
import { type Sixteenths, formatLength } from '../../core/units'
import type { ConstraintRef } from '../store/actions'

export interface DimSpec {
  readonly ref: ConstraintRef
  readonly axis: 'u' | 'v'
  /** Anchor and driven coordinates along the axis, sixteenths. */
  readonly from: number
  readonly to: number
  /** Where the dimension line sits on the other axis, sixteenths. */
  readonly at: number
  readonly label: string
  readonly literal: number
  readonly anchorName: string
}

export interface TagSpec {
  readonly ref: ConstraintRef
  readonly text: string
  readonly u: number
  readonly v: number
}

const PROP_COORD: Record<string, (r: Rect2) => { axis: 'u' | 'v'; value: number }> = {
  left: (r) => ({ axis: 'u', value: r.u0 }),
  right: (r) => ({ axis: 'u', value: r.u1 }),
  umid: (r) => ({ axis: 'u', value: (r.u0 + r.u1) / 2 }),
  bottom: (r) => ({ axis: 'v', value: r.v0 }),
  top: (r) => ({ axis: 'v', value: r.v1 }),
  vmid: (r) => ({ axis: 'v', value: (r.v0 + r.v1) / 2 }),
}

/** Turns every simple link (ref, ref ± literal) into a drawable dimension; everything else becomes a tag. */
export function dimensionsOf(sketch: SketchFeature, result: SketchResult): { dims: DimSpec[]; tags: TagSpec[] } {
  const dims: DimSpec[] = []
  const tags: TagSpec[] = []
  const byHandle = new Map(sketch.rects.map((r) => [r.handle, r.id]))
  for (const rect of sketch.rects) {
    const resolved = result.rects.get(rect.id)
    if (!resolved) continue
    for (const axis of ['u', 'v'] as const) {
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
        dims.push({
          ref,
          axis,
          from: coord.value,
          to,
          at: axis === 'u' ? resolved.v0 : resolved.u1,
          label: formatLength(Math.abs(link.offset) as Sixteenths),
          literal: link.offset,
          anchorName: link.ref.join('.'),
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
