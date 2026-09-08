import { describe, expect, it } from 'vitest'
import { rect, rectArea, rectsToRegions, subtractRect } from '../../src/core/geom/rect2d'

describe('subtractRect', () => {
  it('disjoint', () => {
    expect(subtractRect(rect(0, 10, 0, 10), rect(20, 30, 0, 10))).toEqual([rect(0, 10, 0, 10)])
  })
  it('L shape', () => {
    const r = subtractRect(rect(0, 10, 0, 10), rect(5, 15, 5, 15))
    expect(r.reduce((s, x) => s + rectArea(x), 0)).toBe(75)
  })
  it('ring', () => {
    const r = subtractRect(rect(0, 10, 0, 10), rect(3, 7, 3, 7))
    expect(r.reduce((s, x) => s + rectArea(x), 0)).toBe(84)
    expect(r.length).toBe(4)
  })
  it('complete', () => {
    expect(subtractRect(rect(0, 10, 0, 10), rect(-1, 11, -1, 11))).toEqual([])
  })
})

describe('rectsToRegions', () => {
  it('one rect is one region with one loop', () => {
    const regions = rectsToRegions([rect(0, 10, 0, 10)])
    expect(regions).toHaveLength(1)
    expect(regions[0]!.loops).toHaveLength(1)
    expect(regions[0]!.loops[0]).toEqual([
      [0, 0],
      [10, 0],
      [10, 10],
      [0, 10],
    ])
  })
  it('two adjacent rects merge into one loop without the shared edge', () => {
    const regions = rectsToRegions([rect(0, 10, 0, 10), rect(10, 20, 0, 10)])
    expect(regions).toHaveLength(1)
    expect(regions[0]!.loops[0]).toEqual([
      [0, 0],
      [20, 0],
      [20, 10],
      [0, 10],
    ])
  })
  it('L shape has six vertices', () => {
    const regions = rectsToRegions(subtractRect(rect(0, 10, 0, 10), rect(5, 15, 5, 15)))
    expect(regions).toHaveLength(1)
    expect(regions[0]!.loops[0]).toHaveLength(6)
  })
  it('ring has an outer loop and a hole', () => {
    const regions = rectsToRegions(subtractRect(rect(0, 10, 0, 10), rect(3, 7, 3, 7)))
    expect(regions).toHaveLength(1)
    expect(regions[0]!.loops).toHaveLength(2)
    expect(regions[0]!.area).toBe(84)
  })
  it('disjoint rects are separate regions', () => {
    expect(rectsToRegions([rect(0, 10, 0, 10), rect(20, 30, 0, 10)])).toHaveLength(2)
  })
  it('corner-touching rects are separate regions', () => {
    expect(rectsToRegions([rect(0, 10, 0, 10), rect(10, 20, 10, 20)])).toHaveLength(2)
  })
})
