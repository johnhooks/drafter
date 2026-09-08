import { describe, expect, it } from 'vitest'
import { box, boxVolume, boxesDisjoint, boxContains, intersectBoxes, subtractBox } from '../../src/core/geom/box'

const A = box(0, 24, 0, 24, 0, 24)

describe('box basics', () => {
  it('volume', () => {
    expect(boxVolume(A)).toBe(24 * 24 * 24)
  })
  it('intersection', () => {
    expect(intersectBoxes(A, box(12, 36, 0, 24, 0, 24))).toEqual(box(12, 24, 0, 24, 0, 24))
    expect(intersectBoxes(A, box(24, 36, 0, 24, 0, 24))).toBeNull()
  })
})

describe('subtractBox', () => {
  const cases: Array<[string, ReturnType<typeof box>]> = [
    ['disjoint', box(30, 40, 0, 24, 0, 24)],
    ['touching', box(24, 40, 0, 24, 0, 24)],
    ['contained', box(4, 8, 4, 8, 4, 8)],
    ['containing', box(-1, 25, -1, 25, -1, 25)],
    ['through hole y', box(10, 14, -1, 25, 10, 14)],
    ['pocket top', box(10, 14, 10, 14, 22, 30)],
    ['corner', box(20, 30, 20, 30, 20, 30)],
    ['slab', box(-1, 25, -1, 25, 10, 12)],
    ['edge', box(-1, 25, 20, 30, 20, 30)],
  ]
  it.each(cases)('%s: pieces are disjoint, inside a, and cover a minus b', (_name, b) => {
    const pieces = subtractBox(A, b)
    const inter = intersectBoxes(A, b)
    const expected = boxVolume(A) - (inter ? boxVolume(inter) : 0)
    expect(pieces.reduce((s, p) => s + boxVolume(p), 0)).toBe(expected)
    for (const p of pieces) {
      expect(boxVolume(p)).toBeGreaterThan(0)
      expect(boxContains(A, p)).toBe(true)
      expect(intersectBoxes(p, b)).toBeNull()
    }
    for (let i = 0; i < pieces.length; i++)
      for (let j = i + 1; j < pieces.length; j++) expect(boxesDisjoint(pieces[i]!, pieces[j]!)).toBe(true)
  })
  it('never more than six pieces', () => {
    expect(subtractBox(A, box(4, 8, 4, 8, 4, 8)).length).toBe(6)
  })
})
