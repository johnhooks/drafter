import { describe, expect, it } from 'vitest'
import { isPlainRect, plainRect, rectFromCorners } from '../../src/core/model/sketch'
import { deriveAxis, derivedSlot, drivenSlots, setSlot } from '../../src/core/model/slots'
import type { AxisSlots } from '../../src/core/model/types'

describe('rectFromCorners', () => {
  it('corners in any order', () => {
    const r = rectFromCorners('r', 'r1', 10, 20, 2, 4)
    expect(r.u).toEqual({ min: 2, max: 10 })
    expect(r.v).toEqual({ min: 4, max: 20 })
    expect(plainRect(r)).toEqual({ u0: 2, u1: 10, v0: 4, v1: 20 })
    expect(isPlainRect(r)).toBe(true)
  })
  it('expressions are not plain', () => {
    expect(isPlainRect({ id: 'r', handle: 'r1', u: { min: 'face.left + 2', max: 10 }, v: { min: 0, max: 4 } })).toBe(false)
  })
})

describe('deriveAxis', () => {
  it('derives the missing slot', () => {
    expect(deriveAxis(2, 10, undefined)).toEqual({ min: 2, max: 10, size: 8 })
    expect(deriveAxis(2, undefined, 8)).toEqual({ min: 2, max: 10, size: 8 })
    expect(deriveAxis(undefined, 10, 8)).toEqual({ min: 2, max: 10, size: 8 })
    expect(drivenSlots({ min: 2, max: 10 })).toEqual(['min', 'max'])
    expect(derivedSlot({ min: 2, max: 10 })).toBe('size')
  })
})

describe('setSlot: keep edited, then min, size, max; never drop an expression', () => {
  const resolved = { min: 4, max: 14, size: 10 }
  const cases: Array<[AxisSlots, 'min' | 'max' | 'size', number, AxisSlots]> = [
    // driven (min, max)
    [{ min: 4, max: 14 }, 'size', 12, { min: 4, size: 12 }],
    [{ min: 4, max: 14 }, 'min', 12, { min: 12, size: 10 }],
    [{ min: 4, max: 14 }, 'max', 20, { min: 4, max: 20 }],
    // driven (min, size)
    [{ min: 4, size: 10 }, 'max', 20, { min: 4, max: 20 }],
    [{ min: 4, size: 10 }, 'min', 12, { min: 12, size: 10 }],
    [{ min: 4, size: 10 }, 'size', 12, { min: 4, size: 12 }],
    // driven (max, size): a kept derived slot takes its current resolved value
    [{ max: 14, size: 10 }, 'min', 12, { min: 12, size: 10 }],
    [{ max: 14, size: 10 }, 'size', 12, { min: 4, size: 12 }],
    [{ max: 14, size: 10 }, 'max', 20, { min: 4, max: 20 }],
  ]
  it.each(cases)('%o set %s = %d -> %o', (slots, slot, value, expected) => {
    const r = setSlot(slots, slot, value as never, resolved)
    expect(r).toEqual({ ok: true, slots: expected })
  })
  it('keeps an expression over a number', () => {
    expect(setSlot({ min: 'face.left + 2', max: 14 }, 'size', 12 as never, resolved)).toEqual({ ok: true, slots: { min: 'face.left + 2', size: 12 } })
    expect(setSlot({ min: 4, max: 'face.right - 2' }, 'size', 12 as never, resolved)).toEqual({ ok: true, slots: { max: 'face.right - 2', size: 12 } })
    expect(setSlot({ min: 4, max: 'face.right - 2' }, 'min', 12 as never, resolved)).toEqual({ ok: true, slots: { min: 12, max: 'face.right - 2' } })
  })
  it('refuses when both other slots are expressions', () => {
    const r = setSlot({ min: 'face.left + 2', max: 'face.right - 2' }, 'size', 12 as never, resolved)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toMatch(/face\.left \+ 2.*face\.right - 2/)
  })
})
