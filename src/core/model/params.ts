import { type Value, evaluateExpr, length } from '../expr/evaluate'
import { tokenize } from '../expr/lexer'
import type { Document, Feature, Len, Param } from './types'
import { isExpr } from './types'

export const IDENT_RE = /^[A-Za-z_][A-Za-z0-9_]*$/
export const RESERVED = new Set(['face'])

export interface ParamResult {
  readonly values: Map<string, Value>
  readonly errors: Map<string, string>
}

/** Parameters resolve in list order; each may reference only earlier ones. */
export function evaluateParams(params: readonly Param[]): ParamResult {
  const values = new Map<string, Value>()
  const errors = new Map<string, string>()
  for (const p of params) {
    if (!isExpr(p.value)) {
      values.set(p.name, length(p.value))
      continue
    }
    try {
      const v = evaluateExpr(p.value, { params: values, rects: new Map() })
      if (v.kind !== 'length') throw new Error('A parameter must be a length')
      values.set(p.name, v)
    } catch (e) {
      errors.set(p.name, e instanceof Error ? e.message : String(e))
    }
  }
  return { values, errors }
}

export function validateParamName(name: string, taken: Iterable<string>): string | null {
  if (!IDENT_RE.test(name)) return 'A parameter name must start with a letter or underscore and contain only letters, digits, and underscores'
  if (RESERVED.has(name)) return `${name} is reserved`
  for (const t of taken) if (t === name) return `${name} already exists`
  return null
}

/** Where a parameter is used: a human-readable location per expression that names it. */
export interface ParamUse {
  readonly where: string
  readonly expression: string
}

function mentions(expr: string, name: string): boolean {
  try {
    return tokenize(expr).some((t) => t.kind === 'name' && t.path.length === 1 && t.path[0] === name)
  } catch {
    return false
  }
}

function rewrite(expr: string, from: string, to: string): string {
  let toks
  try {
    toks = tokenize(expr)
  } catch {
    return expr
  }
  let out = ''
  let last = 0
  for (const t of toks) {
    if (t.kind === 'name' && t.path.length === 1 && t.path[0] === from) {
      out += expr.slice(last, t.pos) + to
      last = t.pos + t.text.length
    }
  }
  return out + expr.slice(last)
}

/** Every expression in the document with a callback that can replace it. */
function forEachExpr(doc: Document, fn: (expr: string, where: string) => string | undefined): Document {
  let changed = false
  const visit = (v: Len, where: string): Len => {
    if (!isExpr(v)) return v
    const r = fn(v, where)
    if (r === undefined || r === v) return v
    changed = true
    return r
  }
  const params = doc.params.map((p) => ({ ...p, value: visit(p.value, `parameter ${p.name}`) }))
  const features: Feature[] = doc.features.map((f) => {
    if (f.kind === 'extrude') return { ...f, distance: visit(f.distance, `${f.name} distance`) }
    const plane = f.plane.kind === 'principal' ? { ...f.plane, offset: visit(f.plane.offset, `${f.name} plane offset`) } : f.plane
    const rects = f.rects.map((r) => {
      const axis = (a: typeof r.u, label: string) => ({
        ...(a.min !== undefined ? { min: visit(a.min, `${r.handle} ${label} min in ${f.name}`) } : {}),
        ...(a.max !== undefined ? { max: visit(a.max, `${r.handle} ${label} max in ${f.name}`) } : {}),
        ...(a.size !== undefined ? { size: visit(a.size, `${r.handle} ${label} size in ${f.name}`) } : {}),
      })
      return { ...r, u: axis(r.u, 'u'), v: axis(r.v, 'v') }
    })
    return { ...f, plane, rects }
  })
  return changed ? { ...doc, params, features } : doc
}

export function usesOf(doc: Document, name: string): ParamUse[] {
  const out: ParamUse[] = []
  forEachExpr(doc, (expr, where) => {
    if (mentions(expr, name)) out.push({ where, expression: expr })
    return undefined
  })
  return out
}

export function renameParam(doc: Document, from: string, to: string): Document {
  const renamed = forEachExpr(doc, (expr) => (mentions(expr, from) ? rewrite(expr, from, to) : undefined))
  if (renamed === doc && !doc.params.some((p) => p.name === from)) return doc
  return { ...renamed, params: renamed.params.map((p) => (p.name === from ? { ...p, name: to } : p)) }
}
