import { describe, expect, it } from 'vitest'
import { parse, references, simpleLink } from '../../../src/core/expr/parser'

describe('parse', () => {
  it('precedence: (r1.width - 3/4) / 2', () => {
    expect(parse('(r1.width - 3/4) / 2')).toEqual({
      kind: 'bin',
      op: '/',
      left: { kind: 'bin', op: '-', left: { kind: 'ref', path: ['r1', 'width'] }, right: { kind: 'num', value: 12 } },
      right: { kind: 'num', value: 32 },
    })
  })
  it('a + b * c binds * tighter', () => {
    const ast = parse('a + b * c')
    expect(ast).toMatchObject({ kind: 'bin', op: '+', right: { kind: 'bin', op: '*' } })
  })
  it('unary minus', () => {
    expect(parse('-ply')).toEqual({ kind: 'neg', arg: { kind: 'ref', path: ['ply'] } })
    expect(parse('-(ply)')).toEqual({ kind: 'neg', arg: { kind: 'ref', path: ['ply'] } })
  })
  it.each([
    ['', /Empty/],
    ['2 +', /end of expression/],
    ['(2 + 3', /closing parenthesis/],
    ['2 3', /Unexpected "3"/],
    ['* 2', /Unexpected "\*"/],
  ])('parse error for %j', (src, re) => {
    expect(() => parse(src)).toThrow(re)
  })
  it('reports positions', () => {
    try {
      parse('2 + @')
    } catch (e) {
      expect((e as { pos: number }).pos).toBe(4)
    }
  })
  it('references and simpleLink', () => {
    expect(references(parse('face.left + ply - r2.right'))).toEqual([['face', 'left'], ['ply'], ['r2', 'right']])
    expect(simpleLink(parse('face.left + 2'))).toEqual({ ref: ['face', 'left'], offset: 32 })
    expect(simpleLink(parse('r1.bottom - 3/4'))).toEqual({ ref: ['r1', 'bottom'], offset: -12 })
    expect(simpleLink(parse('r1.bottom'))).toEqual({ ref: ['r1', 'bottom'], offset: 0 })
    expect(simpleLink(parse('r1.bottom + ply'))).toBeNull()
    expect(simpleLink(parse('2 + r1.bottom'))).toBeNull()
  })
})
