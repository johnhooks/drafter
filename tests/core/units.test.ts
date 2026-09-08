import { describe, expect, it } from 'vitest'
import { formatLength, parseLength, sx } from '../../src/core/units'

describe('parseLength', () => {
  it.each([
    ['36', 576],
    ['35 1/4', 564],
    ['35-1/4', 564],
    ['3/4', 12],
    ['35.25', 564],
    ['35.3', 565],
    ['24"', 384],
    ['24 in', 384],
    ['  12  ', 192],
    ['0', 0],
    ['1/16', 1],
  ])('parses %s', (input, expected) => {
    expect(parseLength(input)).toEqual({ ok: true, value: expected })
  })

  it.each([['abc'], ['-12'], ['1/0'], [''], ['   '], ['1 2 3'], ['1/2/3']])('rejects %s', (input) => {
    const r = parseLength(input)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error.length).toBeGreaterThan(0)
  })
})

describe('formatLength', () => {
  it.each([
    [568, '35 1/2"'],
    [384, '24"'],
    [12, '3/4"'],
    [0, '0"'],
    [565, '35 5/16"'],
    [1, '1/16"'],
    [8, '1/2"'],
    [17, '1 1/16"'],
  ])('formats %d as %s', (input, expected) => {
    expect(formatLength(sx(input))).toBe(expected)
  })
})
