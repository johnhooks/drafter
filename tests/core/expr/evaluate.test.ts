import { describe, expect, it } from 'vitest'
import { EMPTY_SCOPE, type Scope, evaluateExpr, length, rectProps, tryEvaluate } from '../../../src/core/expr/evaluate'

const IN = (n: number) => n * 16
const scope: Scope = {
  params: new Map([['ply', length(12)]]),
  rects: new Map([['r1', rectProps({ u0: 0, u1: IN(24), v0: 0, v1: IN(30) }, 'x', 'z')]]),
  face: rectProps({ u0: 0, u1: IN(24), v0: -IN(24), v1: 0 }, 'x', 'y'),
}

describe('evaluateExpr', () => {
  it('mixed number and arithmetic', () => {
    expect(evaluateExpr('face.left + 2 1/4', scope)).toEqual({ kind: 'position', value: 36, axis: 'x' })
  })
  it('precedence and parentheses', () => {
    expect(evaluateExpr('(r1.width - 3/4) / 2', scope)).toEqual({ kind: 'length', value: IN(11.625) })
  })
  it('rounds to a sixteenth', () => {
    const s: Scope = { ...EMPTY_SCOPE, rects: new Map([['r1', rectProps({ u0: 0, u1: 16, v0: 0, v1: 16 }, 'x', 'z')]]) }
    expect(evaluateExpr('r1.width / 3', s).value).toBe(5)
  })
  it('division by zero', () => {
    expect(tryEvaluate('ply / 0', scope)).toMatchObject({ ok: false, error: /Division by zero/ })
  })
  it('face reference', () => {
    expect(evaluateExpr('face.right - 2', scope)).toEqual({ kind: 'position', value: IN(22), axis: 'x' })
  })
  it('unknown name', () => {
    expect(tryEvaluate('r9.left + 1', scope)).toMatchObject({ ok: false, error: /Unknown name r9/ })
    expect(tryEvaluate('nope', scope)).toMatchObject({ ok: false, error: /Unknown name nope/ })
    expect(tryEvaluate('r1.middle', scope)).toMatchObject({ ok: false, error: /no property middle/ })
  })
  it('no face on a principal plane', () => {
    const r = tryEvaluate('face.left', { ...EMPTY_SCOPE, noFaceReason: 'Sketch 1 is on a principal plane and has no face' })
    expect(r).toMatchObject({ ok: false, error: /no face/ })
  })
  it('position minus position is a length', () => {
    expect(evaluateExpr('r1.right - r1.left', scope)).toEqual({ kind: 'length', value: IN(24) })
  })
  it('position plus length keeps the axis', () => {
    expect(evaluateExpr('r1.top + ply', scope)).toEqual({ kind: 'position', value: IN(30) + 12, axis: 'z' })
  })
  it('wrong axis', () => {
    expect(tryEvaluate('r1.top - face.left', scope)).toMatchObject({ ok: false, error: /Z position.*X position/ })
  })
  it('positions cannot be added, scaled, or negated', () => {
    expect(tryEvaluate('r1.left + r1.right', scope).ok).toBe(false)
    expect(tryEvaluate('r1.left * 2', scope).ok).toBe(false)
    expect(tryEvaluate('-r1.left', scope).ok).toBe(false)
    expect(tryEvaluate('2 - r1.left', scope).ok).toBe(false)
  })
  it('lengths multiply and divide in inches', () => {
    expect(evaluateExpr('ply * 2', scope).value).toBe(24)
    expect(evaluateExpr('2 * 3', scope).value).toBe(IN(6))
    expect(evaluateExpr('r1.width / 2', scope).value).toBe(IN(12))
    expect(evaluateExpr('-ply', scope).value).toBe(-12)
  })
})
