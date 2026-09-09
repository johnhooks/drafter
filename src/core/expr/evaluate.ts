import type { Axis } from '../geom/box'
import { formatLength } from '../units'
import type { Sixteenths } from '../units'
import { ExprError } from './lexer'
import { type Ast, parse } from './parser'

/** A length is a plain distance; a position lies on one model axis and only combines with lengths or same-axis positions. */
export type Value = { kind: 'length'; value: number } | { kind: 'position'; value: number; axis: Axis }

export const length = (value: number): Value => ({ kind: 'length', value })
export const position = (value: number, axis: Axis): Value => ({ kind: 'position', value, axis })

export interface RectProps {
  readonly left: Value
  readonly right: Value
  readonly bottom: Value
  readonly top: Value
  readonly width: Value
  readonly height: Value
  readonly umid: Value
  readonly vmid: Value
}

/**
 * A line's properties, filled in as its slots resolve: `at` first, then the run. A horizontal line has
 * left, right, mid, length; a vertical one bottom, top, mid, length. Both have at.
 */
export interface LineProps {
  readonly dir: 'h' | 'v'
  readonly values: Record<string, Value>
}

/** Explicit resolution scope; later changes add entries (earlier sketches) without touching the grammar. */
export interface Scope {
  readonly params: ReadonlyMap<string, Value>
  readonly lines: ReadonlyMap<string, LineProps>
  readonly face?: RectProps
  /** Set when the sketch is on a principal plane so `face` can be explained rather than "unknown". */
  readonly noFaceReason?: string
}

export const EMPTY_SCOPE: Scope = { params: new Map(), lines: new Map() }

export function rectProps(r: { u0: number; u1: number; v0: number; v1: number }, uAxis: Axis, vAxis: Axis): RectProps {
  return {
    left: position(r.u0, uAxis),
    right: position(r.u1, uAxis),
    umid: position((r.u0 + r.u1) / 2, uAxis),
    bottom: position(r.v0, vAxis),
    top: position(r.v1, vAxis),
    vmid: position((r.v0 + r.v1) / 2, vAxis),
    width: length(r.u1 - r.u0),
    height: length(r.v1 - r.v0),
  }
}

export const LINE_PROPS: Record<'h' | 'v', readonly string[]> = {
  h: ['left', 'right', 'mid', 'length', 'at'],
  v: ['bottom', 'top', 'mid', 'length', 'at'],
}

/** Run properties of a line once its endpoints are known; `at` is set separately when the position resolves. */
export function lineRunProps(dir: 'h' | 'v', min: number, max: number, runAxis: Axis): Record<string, Value> {
  const [lo, hi] = dir === 'h' ? ['left', 'right'] : ['bottom', 'top']
  return { [lo]: position(min, runAxis), [hi]: position(max, runAxis), mid: position((min + max) / 2, runAxis), length: length(max - min) }
}

export function describe(v: Value): string {
  return v.kind === 'length' ? `a length (${formatLength(Math.round(v.value) as Sixteenths)})` : `a ${v.axis.toUpperCase()} position`
}

function resolveRef(path: string[], scope: Scope): Value {
  const name = path.join('.')
  const noFace = () => new ExprError(scope.noFaceReason ?? 'This sketch has no face; face.* is only available on a sketch attached to a face', 0)
  if (path.length === 1) {
    const p = scope.params.get(path[0]!)
    if (p) return p
    if (path[0] === 'face') throw noFace()
    throw new ExprError(`Unknown name ${name}`, 0)
  }
  if (path.length !== 2) throw new ExprError(`Unknown name ${name}`, 0)
  const [obj, prop] = path as [string, string]
  if (obj === 'face') {
    if (!scope.face) throw noFace()
    const v = scope.face[prop as keyof RectProps]
    if (!v) throw new ExprError(`face has no property ${prop}; use left, right, bottom, top, width, height, umid, or vmid`, 0)
    return v
  }
  const line = scope.lines.get(obj)
  if (!line) throw new ExprError(`Unknown name ${obj}`, 0)
  const valid = LINE_PROPS[line.dir]
  if (!valid.includes(prop)) {
    const kind = line.dir === 'h' ? 'horizontal' : 'vertical'
    throw new ExprError(`${obj} is a ${kind} line and has ${valid.join(', ')}; it has no ${prop}`, 0)
  }
  const v = line.values[prop]
  if (!v) throw new ExprError(`${name} is not resolved`, 0)
  return v
}

export function combine(op: '+' | '-' | '*' | '/', a: Value, b: Value): Value {
  if (a.kind === 'position' && b.kind === 'position') {
    if (a.axis !== b.axis) throw new ExprError(`Cannot combine ${describe(a)} with ${describe(b)}; use width or height for lengths`, 0)
    if (op === '-') return length(a.value - b.value)
    throw new ExprError(`Two positions can only be subtracted`, 0)
  }
  if (a.kind === 'position' || b.kind === 'position') {
    if (op === '*' || op === '/') throw new ExprError(`A position cannot be multiplied or divided`, 0)
    if (op === '-' && a.kind === 'length') throw new ExprError(`Cannot subtract a position from a length`, 0)
    const pos = a.kind === 'position' ? a : (b as Value & { kind: 'position' })
    const len = a.kind === 'length' ? a : b
    return position(op === '+' ? pos.value + len.value : pos.value - len.value, pos.axis)
  }
  switch (op) {
    case '+':
      return length(a.value + b.value)
    case '-':
      return length(a.value - b.value)
    case '*':
      // both operands are in sixteenths; a product of two lengths is treated as a length scaled by inches
      return length((a.value * b.value) / 16)
    case '/':
      if (b.value === 0) throw new ExprError('Division by zero', 0)
      return length((a.value / b.value) * 16)
  }
}

function evalAst(ast: Ast, scope: Scope): Value {
  switch (ast.kind) {
    case 'num':
      return length(ast.value)
    case 'ref':
      return resolveRef(ast.path, scope)
    case 'neg': {
      const v = evalAst(ast.arg, scope)
      if (v.kind === 'position') throw new ExprError('A position cannot be negated', 0)
      return length(-v.value)
    }
    case 'bin':
      return combine(ast.op, evalAst(ast.left, scope), evalAst(ast.right, scope))
  }
}

/** Evaluates an expression string; the result is rounded to whole sixteenths. */
export function evaluateExpr(src: string, scope: Scope): Value {
  const v = evalAst(parse(src), scope)
  return { ...v, value: Math.round(v.value) }
}

export type EvalOutcome = { ok: true; value: Value } | { ok: false; error: string }

export function tryEvaluate(src: string, scope: Scope): EvalOutcome {
  try {
    return { ok: true, value: evaluateExpr(src, scope) }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}
