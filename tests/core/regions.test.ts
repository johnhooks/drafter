import { describe, expect, it } from 'vitest'
import { type LineSeg, computeRegions, regionAt, regionByRef, regionIsRectangle } from '../../src/core/geom/regions'

const IN = (n: number) => n * 16
const h = (id: string, at: number, min: number, max: number): LineSeg => ({ id, dir: 'h', at, min, max })
const v = (id: string, at: number, min: number, max: number): LineSeg => ({ id, dir: 'v', at, min, max })

/** A 24 by 16 rectangle: left l1, bottom l2, right l3, top l4. */
const rect = () => [v('l1', 0, 0, IN(16)), h('l2', 0, 0, IN(24)), v('l3', IN(24), 0, IN(16)), h('l4', IN(16), 0, IN(24))]

describe('computeRegions', () => {
  it('four lines make one region with its corner at the left and bottom lines', () => {
    const r = computeRegions(rect())
    expect(r).toHaveLength(1)
    expect(r[0]).toMatchObject({ ref: { vertical: 'l1', horizontal: 'l2' }, bounds: { u0: 0, u1: IN(24), v0: 0, v1: IN(16) }, area: IN(24) * IN(16) })
    expect(r[0]!.rects).toEqual([{ u0: 0, u1: IN(24), v0: 0, v1: IN(16) }])
    const edges = r[0]!.boundary.map((e) => `${e.lineId}${e.outward > 0 ? '+' : '-'}`).sort()
    expect(edges).toEqual(['l1-', 'l2-', 'l3+', 'l4+'])
  })
  it('a line across splits it into two regions that share the splitting line', () => {
    const r = computeRegions([...rect(), v('l5', IN(10), 0, IN(16))])
    expect(r.map((x) => x.bounds)).toEqual([
      { u0: 0, u1: IN(10), v0: 0, v1: IN(16) },
      { u0: IN(10), u1: IN(24), v0: 0, v1: IN(16) },
    ])
    expect(r[0]!.ref).toEqual({ vertical: 'l1', horizontal: 'l2' })
    expect(r[1]!.ref).toEqual({ vertical: 'l5', horizontal: 'l2' })
    expect(r[0]!.boundary.find((e) => e.lineId === 'l5')).toMatchObject({ outward: 1, at: IN(10), from: 0, to: IN(16) })
    expect(r[1]!.boundary.find((e) => e.lineId === 'l5')).toMatchObject({ outward: -1 })
  })
  it('a dangling line splits nothing and changes nothing about the decomposition', () => {
    const r = computeRegions([...rect(), v('l5', IN(10), 0, IN(8))])
    expect(r).toHaveLength(1)
    expect(r[0]!.rects).toEqual([{ u0: 0, u1: IN(24), v0: 0, v1: IN(16) }])
    expect(r[0]!.area).toBe(IN(24) * IN(16))
  })
  it('unclosed lines make no region', () => {
    expect(computeRegions(rect().slice(0, 3))).toEqual([])
    expect(computeRegions([])).toEqual([])
    expect(computeRegions([h('a', 0, 0, 10)])).toEqual([])
  })
  it('overlapping collinear lines count once', () => {
    const lines = [v('l1', 0, 0, IN(16)), h('l2', 0, 0, IN(12)), h('l5', 0, IN(8), IN(24)), v('l3', IN(24), 0, IN(16)), h('l4', IN(16), 0, IN(24))]
    const r = computeRegions(lines)
    expect(r).toHaveLength(1)
    expect(r[0]!.bounds).toEqual({ u0: 0, u1: IN(24), v0: 0, v1: IN(16) })
    // both bottom lines bound it, each along its own run
    expect(r[0]!.boundary.filter((e) => e.outward < 0 && e.dir === 'h').map((e) => [e.lineId, e.from, e.to])).toEqual([
      ['l2', 0, IN(12)],
      ['l5', IN(12), IN(24)],
    ])
  })
  it('L shape: area, bounds, canonical strips', () => {
    // 24 by 24 with the upper right 12 by 12 removed
    const lines = [v('a', 0, 0, IN(24)), h('b', 0, 0, IN(24)), v('c', IN(24), 0, IN(12)), h('d', IN(12), IN(12), IN(24)), v('e', IN(12), IN(12), IN(24)), h('f', IN(24), 0, IN(12))]
    const r = computeRegions(lines)
    expect(r).toHaveLength(1)
    expect(r[0]!.area).toBe(IN(24) * IN(24) - IN(12) * IN(12))
    expect(r[0]!.bounds).toEqual({ u0: 0, u1: IN(24), v0: 0, v1: IN(24) })
    expect(r[0]!.rects).toEqual([
      { u0: 0, u1: IN(24), v0: 0, v1: IN(12) },
      { u0: 0, u1: IN(12), v0: IN(12), v1: IN(24) },
    ])
    // an unrelated line elsewhere does not change the decomposition
    const more = computeRegions([...lines, v('g', IN(6), IN(30), IN(40))])
    expect(more[0]!.rects).toEqual(r[0]!.rects)
    expect(r[0]!.boundary).toHaveLength(6)
  })
  it('region lookups by corner and by point', () => {
    const r = computeRegions([...rect(), v('l5', IN(10), 0, IN(16))])
    expect(regionByRef(r, { vertical: 'l5', horizontal: 'l2' })?.bounds.u0).toBe(IN(10))
    expect(regionByRef(r, { vertical: 'l3', horizontal: 'l2' })).toBeUndefined()
    expect(regionAt(r, IN(20), IN(5))?.ref.vertical).toBe('l5')
    expect(regionAt(r, IN(30), IN(5))).toBeUndefined()
  })
})

describe('regionIsRectangle', () => {
  it('names each of two adjacent rectangles although they share a corner line', () => {
    // r1 at u 0..24, r2 beside it at u 24..36, both v 0..16; r2's left line coincides with r1's right line
    const r1 = [v('a_l', 0, 0, IN(16)), h('a_b', 0, 0, IN(24)), v('a_r', IN(24), 0, IN(16)), h('a_t', IN(16), 0, IN(24))]
    const r2 = [v('b_l', IN(24), 0, IN(16)), h('b_b', 0, IN(24), IN(36)), v('b_r', IN(36), 0, IN(16)), h('b_t', IN(16), IN(24), IN(36))]
    const at = new Map([...r1, ...r2].map((l) => [l.id, l.at]))
    const regions = computeRegions([...r1, ...r2])
    expect(regions).toHaveLength(2)
    expect(regions[1]!.ref).toEqual({ vertical: 'a_r', horizontal: 'b_b' })
    expect(regionIsRectangle(regions[0]!, ['a_l', 'a_b', 'a_r', 'a_t'], (id) => at.get(id))).toBe(true)
    expect(regionIsRectangle(regions[1]!, ['b_l', 'b_b', 'b_r', 'b_t'], (id) => at.get(id))).toBe(true)
    expect(regionIsRectangle(regions[1]!, ['a_l', 'a_b', 'a_r', 'a_t'], (id) => at.get(id))).toBe(false)
    // a rectangle split by a line is no longer exactly one region
    const split = computeRegions([...r1, v('m', IN(10), 0, IN(16))])
    expect(regionIsRectangle(split[0]!, ['a_l', 'a_b', 'a_r', 'a_t'], (id) => at.get(id) ?? (id === 'm' ? IN(10) : undefined))).toBe(false)
  })
})
