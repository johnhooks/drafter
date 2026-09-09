import { describe, expect, it } from 'vitest'
import { isPlainLine, lineFromPoints, lineProperties, projectEnd, rectangleLines } from '../../src/core/model/sketch'
import { deriveAxis, derivedSlot, drivenSlots, setSlot } from '../../src/core/model/slots'
import type { AxisSlots } from '../../src/core/model/types'

describe('lineFromPoints and projectEnd', () => {
  it('horizontal and vertical lines from points in any order', () => {
    expect(lineFromPoints('a', 'l1', 10, 4, 2, 4)).toEqual({ id: 'a', handle: 'l1', dir: 'h', at: 4, run: { min: 2, max: 10 } })
    expect(lineFromPoints('a', 'l1', 6, 20, 6, 4)).toEqual({ id: 'a', handle: 'l1', dir: 'v', at: 6, run: { min: 4, max: 20 } })
  })
  it('coincident or diagonal points make no line', () => {
    expect(lineFromPoints('a', 'l1', 1, 1, 1, 1)).toBeNull()
    expect(lineFromPoints('a', 'l1', 0, 0, 3, 4)).toBeNull()
  })
  it('projects onto the axis moved farther along', () => {
    expect(projectEnd([0, 0], [20, 3])).toEqual({ dir: 'h', end: [20, 0] })
    expect(projectEnd([0, 0], [3, -20])).toEqual({ dir: 'v', end: [0, -20] })
    expect(projectEnd([0, 0], [5, 5])).toEqual({ dir: 'h', end: [5, 0] })
  })
})

describe('rectangleLines', () => {
  it('four attached lines from corners in any order', () => {
    const [l, b, r, t] = rectangleLines(['L', 'B', 'R', 'T'], ['l1', 'l2', 'l3', 'l4'], 10, 2, 20, 4)
    expect(l).toEqual({ id: 'L', handle: 'l1', dir: 'v', at: 2, run: { min: 'l2.at', max: 'l4.at' } })
    expect(b).toEqual({ id: 'B', handle: 'l2', dir: 'h', at: 4, run: { min: 'l1.at', max: 'l3.at' } })
    expect(r).toEqual({ id: 'R', handle: 'l3', dir: 'v', at: 10, run: { min: 'l2.at', max: 'l4.at' } })
    expect(t).toEqual({ id: 'T', handle: 'l4', dir: 'h', at: 20, run: { min: 'l1.at', max: 'l3.at' } })
    expect(isPlainLine(l!)).toBe(false)
    expect(isPlainLine({ id: 'x', handle: 'l9', dir: 'h', at: 0, run: { min: 0, max: 4 } })).toBe(true)
  })
  it('properties per direction', () => {
    expect(lineProperties('h')).toEqual(['left', 'right', 'mid', 'length', 'at'])
    expect(lineProperties('v')).toEqual(['bottom', 'top', 'mid', 'length', 'at'])
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
    expect(setSlot({ min: 'l1.at', max: 14 }, 'size', 12 as never, resolved)).toEqual({ ok: true, slots: { min: 'l1.at', size: 12 } })
    expect(setSlot({ min: 4, max: 'l3.at' }, 'size', 12 as never, resolved)).toEqual({ ok: true, slots: { max: 'l3.at', size: 12 } })
    expect(setSlot({ min: 4, max: 'l3.at' }, 'min', 12 as never, resolved)).toEqual({ ok: true, slots: { min: 12, max: 'l3.at' } })
  })
  it('refuses when both other slots are expressions', () => {
    const r = setSlot({ min: 'l1.at', max: 'l3.at' }, 'size', 12 as never, resolved)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toMatch(/l1\.at.*l3\.at/)
  })
})
