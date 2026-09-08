import { describe, expect, it } from 'vitest'
import { box } from '../../src/core/geom/box'
import { bodyBounds, bodyVolume, compact, cut, join, newBody } from '../../src/core/geom/body'

const cube = () => newBody('b1', 'Body', box(0, 24, 0, 24, 0, 24))

describe('body', () => {
  it('from one box', () => {
    const b = cube()
    expect(b.boxes).toHaveLength(1)
    expect(bodyBounds(b)).toEqual(box(0, 24, 0, 24, 0, 24))
  })

  it('join overlapping box', () => {
    const b = join(cube(), box(12, 36, 0, 24, 0, 24))
    expect(bodyVolume(b)).toBe(24 * 24 * 36)
    for (let i = 0; i < b.boxes.length; i++)
      for (let j = i + 1; j < b.boxes.length; j++) {
        const a = b.boxes[i]!
        const c = b.boxes[j]!
        const overlap =
          Math.min(a.x1, c.x1) > Math.max(a.x0, c.x0) &&
          Math.min(a.y1, c.y1) > Math.max(a.y0, c.y0) &&
          Math.min(a.z1, c.z1) > Math.max(a.z0, c.z0)
        expect(overlap).toBe(false)
      }
  })

  it('join contained box leaves volume unchanged', () => {
    expect(bodyVolume(join(cube(), box(4, 8, 4, 8, 4, 8)))).toBe(24 ** 3)
  })

  it('cut a through hole', () => {
    const b = cut(cube(), box(10, 14, -1, 25, 10, 14))
    expect(bodyVolume(b)).toBe(24 ** 3 - 4 * 24 * 4)
    expect(bodyBounds(b)).toEqual(box(0, 24, 0, 24, 0, 24))
  })

  it('cut a pocket', () => {
    const b = cut(cube(), box(10, 14, 10, 14, 22, 30))
    expect(bodyVolume(b)).toBe(24 ** 3 - 32)
    expect(bodyBounds(b)).toEqual(box(0, 24, 0, 24, 0, 24))
  })

  it('cut everything empties the body', () => {
    expect(cut(cube(), box(-1, 25, -1, 25, -1, 25)).boxes).toHaveLength(0)
  })

  it('cut that misses leaves the body unchanged', () => {
    expect(cut(cube(), box(30, 40, 0, 24, 0, 24)).boxes).toEqual(cube().boxes)
  })

  it('compact merges boxes sharing a full face', () => {
    const b = compact({ id: 'x', name: 'x', boxes: [box(0, 12, 0, 24, 0, 24), box(12, 24, 0, 24, 0, 24)] })
    expect(b.boxes).toEqual([box(0, 24, 0, 24, 0, 24)])
  })

  it('volume equals sum of boxes after several operations', () => {
    let b = cube()
    b = join(b, box(24, 36, 0, 12, 0, 12))
    b = cut(b, box(2, 6, 2, 6, 20, 30))
    b = cut(b, box(-1, 40, 10, 11, -1, 30))
    expect(bodyVolume(b)).toBe(b.boxes.reduce((s, x) => s + (x.x1 - x.x0) * (x.y1 - x.y0) * (x.z1 - x.z0), 0))
  })
})
