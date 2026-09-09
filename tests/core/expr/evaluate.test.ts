import { describe, expect, it } from 'vitest'
import { EMPTY_SCOPE, type LineProps, type Scope, evaluateExpr, length, lineRunProps, position, rectProps, tryEvaluate } from '../../../src/core/expr/evaluate'

const IN = (n: number) => n * 16
/** A horizontal line on XZ at z = 30 from x 0 to 24, and a vertical one at x = 24 from z 0 to 30. */
const h1: LineProps = { dir: 'h', values: { at: position(IN(30), 'z'), ...lineRunProps('h', 0, IN(24), 'x') } }
const v1: LineProps = { dir: 'v', values: { at: position(IN(24), 'x'), ...lineRunProps('v', 0, IN(30), 'z') } }
const scope: Scope = {
  params: new Map([['ply', length(12)]]),
  lines: new Map([
    ['l1', h1],
    ['l2', v1],
  ]),
  face: rectProps({ u0: 0, u1: IN(24), v0: -IN(24), v1: 0 }, 'x', 'y'),
}

describe('evaluateExpr', () => {
  it('mixed number and arithmetic', () => {
    expect(evaluateExpr('face.left + 2 1/4', scope)).toEqual({ kind: 'position', value: 36, axis: 'x' })
  })
  it('precedence and parentheses', () => {
    expect(evaluateExpr('(l1.length - 3/4) / 2', scope)).toEqual({ kind: 'length', value: IN(11.625) })
  })
  it('rounds to a sixteenth', () => {
    const s: Scope = { ...EMPTY_SCOPE, lines: new Map([['l1', { dir: 'h', values: lineRunProps('h', 0, 16, 'x') }]]) }
    expect(evaluateExpr('l1.length / 3', s).value).toBe(5)
  })
  it('division by zero', () => {
    expect(tryEvaluate('ply / 0', scope)).toMatchObject({ ok: false, error: /Division by zero/ })
  })
  it('face reference', () => {
    expect(evaluateExpr('face.right - 2', scope)).toEqual({ kind: 'position', value: IN(22), axis: 'x' })
  })
  it('unknown name', () => {
    expect(tryEvaluate('l9.left + 1', scope)).toMatchObject({ ok: false, error: /Unknown name l9/ })
    expect(tryEvaluate('nope', scope)).toMatchObject({ ok: false, error: /Unknown name nope/ })
    expect(tryEvaluate('l1.middle', scope)).toMatchObject({ ok: false, error: /l1 is a horizontal line and has left, right, mid, length, at; it has no middle/ })
    expect(tryEvaluate('l2.left', scope)).toMatchObject({ ok: false, error: /l2 is a vertical line and has bottom, top, mid, length, at; it has no left/ })
    expect(tryEvaluate('face.middle', scope)).toMatchObject({ ok: false, error: /face has no property middle/ })
  })
  it('no face on a principal plane', () => {
    const r = tryEvaluate('face.left', { ...EMPTY_SCOPE, noFaceReason: 'Sketch 1 is on a principal plane and has no face' })
    expect(r).toMatchObject({ ok: false, error: /no face/ })
  })
  it('position minus position is a length', () => {
    expect(evaluateExpr('l1.right - l1.left', scope)).toEqual({ kind: 'length', value: IN(24) })
  })
  it('position plus length keeps the axis', () => {
    expect(evaluateExpr('l2.top + ply', scope)).toEqual({ kind: 'position', value: IN(30) + 12, axis: 'z' })
    expect(evaluateExpr('l1.at + ply', scope)).toEqual({ kind: 'position', value: IN(30) + 12, axis: 'z' })
  })
  it('wrong axis', () => {
    expect(tryEvaluate('l2.top - face.left', scope)).toMatchObject({ ok: false, error: /Z position.*X position/ })
  })
  it('positions cannot be added, scaled, or negated', () => {
    expect(tryEvaluate('l1.left + l1.right', scope).ok).toBe(false)
    expect(tryEvaluate('l1.left * 2', scope).ok).toBe(false)
    expect(tryEvaluate('-l1.left', scope).ok).toBe(false)
    expect(tryEvaluate('2 - l1.left', scope).ok).toBe(false)
  })
  it('lengths multiply and divide in inches', () => {
    expect(evaluateExpr('ply * 2', scope).value).toBe(24)
    expect(evaluateExpr('2 * 3', scope).value).toBe(IN(6))
    expect(evaluateExpr('l1.length / 2', scope).value).toBe(IN(12))
    expect(evaluateExpr('-ply', scope).value).toBe(-12)
  })
})
