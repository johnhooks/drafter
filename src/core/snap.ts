import type { Sixteenths } from './units'
import type { Projection } from './projection/project'

export interface SnapSource {
  /** Corner points to snap to, in sixteenths. */
  readonly corners: ReadonlyArray<readonly [number, number]>
  /** Edge coordinates to snap to, per axis, in sixteenths. */
  readonly uEdges: readonly number[]
  readonly vEdges: readonly number[]
}

export interface SnapContext extends SnapSource {
  readonly source?: SnapSource
  /** Snap range in sixteenths (converted from pixels by the caller). */
  readonly range: number
}

export function projectionSnapContext(projection: Projection, range: number): SnapContext {
  const source: SnapSource = {
    corners: projection.vertices,
    uEdges: projection.segments.filter((segment) => segment.dir === 'v').map((segment) => segment.at),
    vEdges: projection.segments.filter((segment) => segment.dir === 'h').map((segment) => segment.at),
  }
  return { ...source, source, range }
}

export type SnapKind = 'corner' | 'edge' | 'grid'

export interface Snapped {
  readonly u: Sixteenths
  readonly v: Sixteenths
  readonly kind: SnapKind
  readonly snappedU: boolean
  readonly snappedV: boolean
}

type Snapper = (u: number, v: number, ctx: SnapContext) => Snapped | null

const cornerSnap: Snapper = (u, v, ctx) => {
  let best: { d: number; p: readonly [number, number] } | null = null
  for (const p of ctx.corners) {
    const d = Math.max(Math.abs(p[0] - u), Math.abs(p[1] - v))
    if (d <= ctx.range && (!best || d < best.d)) best = { d, p }
  }
  return best ? { u: best.p[0] as Sixteenths, v: best.p[1] as Sixteenths, kind: 'corner', snappedU: true, snappedV: true } : null
}

function nearest(x: number, xs: readonly number[], range: number): number | null {
  let best: number | null = null
  for (const c of xs) if (Math.abs(c - x) <= range && (best === null || Math.abs(c - x) < Math.abs(best - x))) best = c
  return best
}

const edgeSnap: Snapper = (u, v, ctx) => {
  const su = nearest(u, ctx.uEdges, ctx.range)
  const sv = nearest(v, ctx.vEdges, ctx.range)
  if (su === null && sv === null) return null
  return {
    u: (su ?? Math.round(u)) as Sixteenths,
    v: (sv ?? Math.round(v)) as Sixteenths,
    kind: 'edge',
    snappedU: su !== null,
    snappedV: sv !== null,
  }
}

const gridSnap: Snapper = (u, v) => ({
  u: Math.round(u) as Sixteenths,
  v: Math.round(v) as Sixteenths,
  kind: 'grid',
  snappedU: false,
  snappedV: false,
})

/** Ordered like QCAD's auto snap: the first snapper within range wins. */
export const SNAPPERS: readonly Snapper[] = [cornerSnap, edgeSnap, gridSnap]

export function snap(u: number, v: number, ctx: SnapContext): Snapped {
  const context = ctx.source ? { ...ctx.source, range: ctx.range } : ctx
  for (const s of SNAPPERS) {
    const r = s(u, v, context)
    if (r) return r
  }
  return gridSnap(u, v, context)!
}
