import type { RegionRef } from '../model/types'
import { regionKey } from '../model/types'
import { type Rect2, rectArea } from './rect2d'

/** A resolved axis-aligned segment: the shape the region computation reads. */
export interface LineSeg {
  readonly id: string
  readonly dir: 'h' | 'v'
  readonly at: number
  readonly min: number
  readonly max: number
}

/** One straight run of a region's boundary and the line that bounds it there. */
export interface BoundaryEdge {
  readonly lineId: string
  /** Direction of the line the edge lies on: a vertical edge has constant u. */
  readonly dir: 'h' | 'v'
  /** Constant coordinate of the edge (u for a vertical edge, v for a horizontal one). */
  readonly at: number
  readonly from: number
  readonly to: number
  /** Which way is outside the region, along the constant axis. */
  readonly outward: 1 | -1
}

export interface SketchRegion {
  /** Canonical corner: the first line in sketch order covering each corner edge. */
  readonly ref: RegionRef
  readonly key: string
  /** Every line covering the corner's left edge and its bottom edge, so a reference naming a coincident line still resolves. */
  readonly corner: { readonly verticals: readonly string[]; readonly horizontals: readonly string[] }
  /** Disjoint rectangles whose union is the region; canonical for the shape. */
  readonly rects: Rect2[]
  readonly bounds: Rect2
  readonly area: number
  readonly boundary: BoundaryEdge[]
}

/**
 * Bounded faces of the arrangement of axis-aligned segments. Coordinates are compressed to a grid,
 * segments become walls between cells, and everything not reachable from outside is a region.
 */
export function computeRegions(lines: readonly LineSeg[]): SketchRegion[] {
  const us = uniqueSorted(lines.flatMap((l) => (l.dir === 'v' ? [l.at] : [l.min, l.max])))
  const vs = uniqueSorted(lines.flatMap((l) => (l.dir === 'h' ? [l.at] : [l.min, l.max])))
  const nu = us.length - 1
  const nv = vs.length - 1
  if (nu < 1 || nv < 1) return []
  const ui = new Map(us.map((u, i) => [u, i]))
  const vi = new Map(vs.map((v, j) => [v, j]))

  // vWall[i][j]: the first line covering the vertical edge at u = us[i] beside row j; hWall[i][j] likewise at v = vs[j] in column i
  const vWall: (string | null)[][] = Array.from({ length: nu + 1 }, () => Array<string | null>(nv).fill(null))
  const hWall: (string | null)[][] = Array.from({ length: nu }, () => Array<string | null>(nv + 1).fill(null))
  const vCover = new Map<string, string[]>()
  const hCover = new Map<string, string[]>()
  const cover = (m: Map<string, string[]>, i: number, j: number, id: string) => {
    const k = `${i},${j}`
    const list = m.get(k)
    if (list) list.push(id)
    else m.set(k, [id])
  }
  for (const l of lines) {
    if (l.dir === 'v') {
      const i = ui.get(l.at)!
      for (let j = vi.get(l.min)!; j < vi.get(l.max)!; j++) {
        vWall[i]![j] ??= l.id
        cover(vCover, i, j, l.id)
      }
    } else {
      const j = vi.get(l.at)!
      for (let i = ui.get(l.min)!; i < ui.get(l.max)!; i++) {
        hWall[i]![j] ??= l.id
        cover(hCover, i, j, l.id)
      }
    }
  }

  // component 0 is the outside; seeded from border cells whose outer edge has no wall
  const comp: number[][] = Array.from({ length: nu }, () => Array<number>(nv).fill(-1))
  const flood = (si: number, sj: number, id: number): Array<[number, number]> => {
    const cells: Array<[number, number]> = []
    const stack: Array<[number, number]> = [[si, sj]]
    comp[si]![sj] = id
    while (stack.length) {
      const [i, j] = stack.pop()!
      cells.push([i, j])
      const step = (ni: number, nj: number, wall: string | null) => {
        if (wall !== null || ni < 0 || nj < 0 || ni >= nu || nj >= nv || comp[ni]![nj] !== -1) return
        comp[ni]![nj] = id
        stack.push([ni, nj])
      }
      step(i - 1, j, vWall[i]![j]!)
      step(i + 1, j, vWall[i + 1]![j]!)
      step(i, j - 1, hWall[i]![j]!)
      step(i, j + 1, hWall[i]![j + 1]!)
    }
    return cells
  }
  for (let j = 0; j < nv; j++) {
    if (comp[0]![j] === -1 && vWall[0]![j] === null) flood(0, j, 0)
    if (comp[nu - 1]![j] === -1 && vWall[nu]![j] === null) flood(nu - 1, j, 0)
  }
  for (let i = 0; i < nu; i++) {
    if (comp[i]![0] === -1 && hWall[i]![0] === null) flood(i, 0, 0)
    if (comp[i]![nv - 1] === -1 && hWall[i]![nv] === null) flood(i, nv - 1, 0)
  }

  const regions: SketchRegion[] = []
  // scan rows bottom-up so each region is discovered at its lowest, leftmost cell
  for (let j = 0; j < nv; j++) {
    for (let i = 0; i < nu; i++) {
      if (comp[i]![j] !== -1) continue
      const id = regions.length + 1
      const cells = flood(i, j, id)
      const inside = (a: number, b: number) => a >= 0 && b >= 0 && a < nu && b < nv && comp[a]![b] === id
      const vertical = vWall[i]![j]!
      const horizontal = hWall[i]![j]!
      const ref: RegionRef = { vertical, horizontal }
      const rects = decompose(cells, us, vs)
      const boundary: BoundaryEdge[] = []
      for (const [ci, cj] of cells) {
        if (!inside(ci - 1, cj)) boundary.push({ lineId: vWall[ci]![cj]!, dir: 'v', at: us[ci]!, from: vs[cj]!, to: vs[cj + 1]!, outward: -1 })
        if (!inside(ci + 1, cj)) boundary.push({ lineId: vWall[ci + 1]![cj]!, dir: 'v', at: us[ci + 1]!, from: vs[cj]!, to: vs[cj + 1]!, outward: 1 })
        if (!inside(ci, cj - 1)) boundary.push({ lineId: hWall[ci]![cj]!, dir: 'h', at: vs[cj]!, from: us[ci]!, to: us[ci + 1]!, outward: -1 })
        if (!inside(ci, cj + 1)) boundary.push({ lineId: hWall[ci]![cj + 1]!, dir: 'h', at: vs[cj + 1]!, from: us[ci]!, to: us[ci + 1]!, outward: 1 })
      }
      const bounds: Rect2 = {
        u0: Math.min(...rects.map((r) => r.u0)),
        u1: Math.max(...rects.map((r) => r.u1)),
        v0: Math.min(...rects.map((r) => r.v0)),
        v1: Math.max(...rects.map((r) => r.v1)),
      }
      const corner = { verticals: vCover.get(`${i},${j}`)!, horizontals: hCover.get(`${i},${j}`)! }
      regions.push({ ref, key: regionKey(ref), corner, rects, bounds, area: rects.reduce((s, r) => s + rectArea(r), 0), boundary: mergeEdges(boundary) })
    }
  }
  return regions
}

/** Maximal horizontal strips per row, merged upward when the u extent repeats: canonical for the cell set. */
function decompose(cells: Array<[number, number]>, us: number[], vs: number[]): Rect2[] {
  const rows = new Map<number, number[]>()
  for (const [i, j] of cells) {
    const r = rows.get(j)
    if (r) r.push(i)
    else rows.set(j, [i])
  }
  const strips: Array<{ i0: number; i1: number; j0: number; j1: number }> = []
  for (const j of [...rows.keys()].sort((a, b) => a - b)) {
    const is = rows.get(j)!.sort((a, b) => a - b)
    let start = is[0]!
    let prev = is[0]!
    const emit = (i0: number, i1: number) => {
      const below = strips.find((s) => s.j1 === j && s.i0 === i0 && s.i1 === i1)
      if (below) below.j1 = j + 1
      else strips.push({ i0, i1, j0: j, j1: j + 1 })
    }
    for (let k = 1; k < is.length; k++) {
      if (is[k] === prev + 1) {
        prev = is[k]!
        continue
      }
      emit(start, prev + 1)
      start = is[k]!
      prev = is[k]!
    }
    emit(start, prev + 1)
  }
  return strips.map((s) => ({ u0: us[s.i0]!, u1: us[s.i1]!, v0: vs[s.j0]!, v1: vs[s.j1]! }))
}

/** Joins cell-sized edges on the same line, side, and coordinate into maximal runs. */
function mergeEdges(edges: BoundaryEdge[]): BoundaryEdge[] {
  const groups = new Map<string, BoundaryEdge[]>()
  for (const e of edges) {
    const k = `${e.lineId}|${e.outward}|${e.at}`
    const g = groups.get(k)
    if (g) g.push(e)
    else groups.set(k, [e])
  }
  const out: BoundaryEdge[] = []
  for (const g of groups.values()) {
    g.sort((a, b) => a.from - b.from)
    let cur = { ...g[0]! }
    for (const e of g.slice(1)) {
      if (e.from === cur.to) cur = { ...cur, to: e.to }
      else {
        out.push(cur)
        cur = { ...e }
      }
    }
    out.push(cur)
  }
  return out
}

function uniqueSorted(xs: number[]): number[] {
  return [...new Set(xs)].sort((a, b) => a - b)
}

/** Finds the region whose corner is bounded by both named lines; coincident lines at the corner all count. */
export function regionByRef(regions: readonly SketchRegion[], ref: RegionRef): SketchRegion | undefined {
  return regions.find((r) => r.corner.verticals.includes(ref.vertical) && r.corner.horizontals.includes(ref.horizontal))
}

/** The region whose interior contains a point, if any. Points on a shared edge go to the first region. */
export function regionAt(regions: readonly SketchRegion[], u: number, v: number): SketchRegion | undefined {
  return regions.find((r) => r.rects.some((x) => u >= x.u0 && u <= x.u1 && v >= x.v0 && v <= x.v1))
}
