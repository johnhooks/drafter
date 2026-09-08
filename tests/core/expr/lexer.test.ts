import { describe, expect, it } from 'vitest'
import { tokenize } from '../../../src/core/expr/lexer'

describe('tokenize', () => {
  it.each([
    ['24', [{ kind: 'num', value: 384 }]],
    ['2 1/4', [{ kind: 'num', value: 36 }]],
    ['2-1/4', [{ kind: 'num', value: 36 }]],
    ['3/4', [{ kind: 'num', value: 12 }]],
    ['2.5"', [{ kind: 'num', value: 40 }]],
    ['r1.right', [{ kind: 'name', path: ['r1', 'right'] }]],
    ['face.width', [{ kind: 'name', path: ['face', 'width'] }]],
    ['ply', [{ kind: 'name', path: ['ply'] }]],
    ['2 - 1/4', [{ kind: 'num', value: 32 }, { kind: 'op', op: '-' }, { kind: 'num', value: 4 }]],
    ['r1.width/3', [{ kind: 'name', path: ['r1', 'width'] }, { kind: 'op', op: '/' }, { kind: 'num', value: 48 }]],
    ['(a+b)*2', [{ kind: 'op', op: '(' }, { kind: 'name', path: ['a'] }, { kind: 'op', op: '+' }, { kind: 'name', path: ['b'] }, { kind: 'op', op: ')' }, { kind: 'op', op: '*' }, { kind: 'num', value: 32 }]],
  ])('tokenizes %s', (src, expected) => {
    const toks = tokenize(src as string)
    expect(toks.length).toBe((expected as unknown[]).length)
    ;(expected as Array<Record<string, unknown>>).forEach((e, i) => expect(toks[i]).toMatchObject(e))
  })

  it.each([['2 1/4/3'], ['@'], ['1/0'], ['2 1/0']])('rejects %s', (src) => {
    expect(() => tokenize(src)).toThrow()
  })
})
