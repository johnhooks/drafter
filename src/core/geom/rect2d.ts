/** Axis-aligned rectangle in a 2D plane frame, bounds in sixteenths. */
export interface Rect2 {
  readonly u0: number
  readonly u1: number
  readonly v0: number
  readonly v1: number
}

export type Pt2 = readonly [number, number]

export function rect(u0: number, u1: number, v0: number, v1: number): Rect2 {
  return { u0: Math.min(u0, u1), u1: Math.max(u0, u1), v0: Math.min(v0, v1), v1: Math.max(v0, v1) }
}

export function rectArea(r: Rect2): number {
  return (r.u1 - r.u0) * (r.v1 - r.v0)
}

export function rectsOverlap(a: Rect2, b: Rect2): boolean {
  return Math.min(a.u1, b.u1) > Math.max(a.u0, b.u0) && Math.min(a.v1, b.v1) > Math.max(a.v0, b.v0)
}

export function rectContainsPoint(r: Rect2, u: number, v: number): boolean {
  return u >= r.u0 && u <= r.u1 && v >= r.v0 && v <= r.v1
}

/** a minus b as up to four disjoint rectangles. */
export function subtractRect(a: Rect2, b: Rect2): Rect2[] {
  if (!rectsOverlap(a, b)) return [a]
  const iu0 = Math.max(a.u0, b.u0)
  const iu1 = Math.min(a.u1, b.u1)
  const iv0 = Math.max(a.v0, b.v0)
  const iv1 = Math.min(a.v1, b.v1)
  const out: Rect2[] = []
  const push = (u0: number, u1: number, v0: number, v1: number) => {
    if (u1 > u0 && v1 > v0) out.push({ u0, u1, v0, v1 })
  }
  push(a.u0, iu0, a.v0, a.v1)
  push(iu1, a.u1, a.v0, a.v1)
  push(iu0, iu1, a.v0, iv0)
  push(iu0, iu1, iv1, a.v1)
  return out
}

export function subtractRects(a: Rect2, bs: readonly Rect2[]): Rect2[] {
  let out = [a]
  for (const b of bs) out = out.flatMap((r) => subtractRect(r, b))
  return out
}

/** A connected region of the plane: its rectangles, area, and boundary loops (outer CCW, holes CW). */
export interface Region {
  readonly rects: Rect2[]
  readonly area: number
  readonly loops: Pt2[][]
}

/**
 * Groups disjoint rectangles into edge-connected regions and traces each region's outline.
 * Works on the grid of all rectangle edge coordinates so shared and partially shared edges
 * cancel exactly.
 */
export function rectsToRegions(rects: readonly Rect2[]): Region[] {
  if (rects.length === 0) return []
  const us = uniqueSorted(rects.flatMap((r) => [r.u0, r.u1]))
  const vs = uniqueSorted(rects.flatMap((r) => [r.v0, r.v1]))
  const nu = us.length - 1
  const nv = vs.length - 1
  // owner[i][j] = index of the rect covering cell (i, j), or -1
  const owner: number[][] = Array.from({ length: nu }, () => Array<number>(nv).fill(-1))
  rects.forEach((r, k) => {
    const i0 = us.indexOf(r.u0)
    const i1 = us.indexOf(r.u1)
    const j0 = vs.indexOf(r.v0)
    const j1 = vs.indexOf(r.v1)
    for (let i = i0; i < i1; i++) for (let j = j0; j < j1; j++) owner[i]![j] = k
  })
  const comp: number[][] = Array.from({ length: nu }, () => Array<number>(nv).fill(-1))
  const regions: Region[] = []
  for (let si = 0; si < nu; si++) {
    for (let sj = 0; sj < nv; sj++) {
      if (owner[si]![sj]! < 0 || comp[si]![sj]! >= 0) continue
      const id = regions.length
      const stack: Array<[number, number]> = [[si, sj]]
      comp[si]![sj] = id
      const cells: Array<[number, number]> = []
      const rectIds = new Set<number>()
      while (stack.length) {
        const [i, j] = stack.pop()!
        cells.push([i, j])
        rectIds.add(owner[i]![j]!)
        for (const [di, dj] of [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ] as const) {
          const ni = i + di
          const nj = j + dj
          if (ni < 0 || nj < 0 || ni >= nu || nj >= nv) continue
          if (owner[ni]![nj]! < 0 || comp[ni]![nj]! >= 0) continue
          comp[ni]![nj] = id
          stack.push([ni, nj])
        }
      }
      const inside = (i: number, j: number) => i >= 0 && j >= 0 && i < nu && j < nv && comp[i]![j] === id
      // directed boundary edges, CCW around the region
      const edges: Array<[Pt2, Pt2]> = []
      for (const [i, j] of cells) {
        const u0 = us[i]!
        const u1 = us[i + 1]!
        const v0 = vs[j]!
        const v1 = vs[j + 1]!
        if (!inside(i, j - 1)) edges.push([[u0, v0], [u1, v0]])
        if (!inside(i + 1, j)) edges.push([[u1, v0], [u1, v1]])
        if (!inside(i, j + 1)) edges.push([[u1, v1], [u0, v1]])
        if (!inside(i - 1, j)) edges.push([[u0, v1], [u0, v0]])
      }
      const regionRects = [...rectIds].sort((a, b) => a - b).map((k) => rects[k]!)
      regions.push({
        rects: regionRects,
        area: regionRects.reduce((s, r) => s + rectArea(r), 0),
        loops: chainLoops(edges),
      })
    }
  }
  return regions
}

function uniqueSorted(xs: number[]): number[] {
  return [...new Set(xs)].sort((a, b) => a - b)
}

const key = (p: Pt2) => `${p[0]},${p[1]}`

function chainLoops(edges: Array<[Pt2, Pt2]>): Pt2[][] {
  const byStart = new Map<string, Array<[Pt2, Pt2]>>()
  for (const e of edges) {
    const k = key(e[0])
    const list = byStart.get(k)
    if (list) list.push(e)
    else byStart.set(k, [e])
  }
  const loops: Pt2[][] = []
  for (const first of edges) {
    const list = byStart.get(key(first[0]))
    if (!list || !list.includes(first)) continue
    const loop: Pt2[] = []
    let e = first
    let prevDir: Pt2 = [0, 0]
    for (;;) {
      const startList = byStart.get(key(e[0]))!
      startList.splice(startList.indexOf(e), 1)
      const dir: Pt2 = [Math.sign(e[1][0] - e[0][0]), Math.sign(e[1][1] - e[0][1])]
      // merge collinear steps into one segment
      if (dir[0] !== prevDir[0] || dir[1] !== prevDir[1]) loop.push(e[0])
      prevDir = dir
      const next = byStart.get(key(e[1]))
      if (!next || next.length === 0) break
      // at a pinch vertex prefer the left turn so loops stay simple
      e = next.length === 1 ? next[0]! : pickTurn(next, dir)
    }
    // the last step may be collinear with the first
    if (loop.length > 1) {
      const a = loop[0]!
      const b = loop[loop.length - 1]!
      const c = loop[1]!
      if ((a[0] === b[0] && a[0] === c[0]) || (a[1] === b[1] && a[1] === c[1])) loop.shift()
    }
    loops.push(loop)
  }
  return loops
}

function pickTurn(candidates: Array<[Pt2, Pt2]>, dir: Pt2): [Pt2, Pt2] {
  const left: Pt2 = [-dir[1], dir[0]]
  for (const c of candidates) {
    const d: Pt2 = [Math.sign(c[1][0] - c[0][0]), Math.sign(c[1][1] - c[0][1])]
    if (d[0] === left[0] && d[1] === left[1]) return c
  }
  return candidates[0]!
}
