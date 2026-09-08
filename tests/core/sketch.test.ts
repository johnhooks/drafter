import { describe, expect, it } from 'vitest'
import { normRect, rectHeight, rectIsValid, rectWidth, setRectLowerLeft, setRectWidth } from '../../src/core/model/sketch'
import type { SketchRect } from '../../src/core/model/types'
import { sx } from '../../src/core/units'

const r = (u1: number, v1: number, u2: number, v2: number): SketchRect => ({ id: 'r', u1: sx(u1), v1: sx(v1), u2: sx(u2), v2: sx(v2) })

describe('sketch rect', () => {
  it('corners in any order', () => {
    const x = r(10, 20, 2, 4)
    expect(rectWidth(x)).toBe(8)
    expect(rectHeight(x)).toBe(16)
    expect(normRect(x)).toEqual({ u0: 2, u1: 10, v0: 4, v1: 20 })
  })
  it('zero size is invalid', () => {
    expect(rectIsValid(r(5, 0, 5, 10))).toBe(false)
    expect(rectIsValid(r(0, 0, 5, 10))).toBe(true)
  })
  it('set width keeps the origin corner', () => {
    const x = setRectWidth(r(4, 4, 14, 20), sx(12))
    expect(normRect(x)).toEqual({ u0: 4, u1: 16, v0: 4, v1: 20 })
  })
  it('set lower-left moves the rect', () => {
    const x = setRectLowerLeft(r(4, 4, 14, 20), sx(12), sx(0))
    expect(normRect(x)).toEqual({ u0: 12, u1: 22, v0: 0, v1: 16 })
  })
})
