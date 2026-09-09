import { tokenize } from './lexer'

/**
 * Replaces name tokens in an expression string, keeping everything else byte for byte.
 * `fn` sees each dotted path and returns the replacement text or undefined to leave it.
 * Unparsable expressions are returned unchanged.
 */
export function rewriteNames(expr: string, fn: (path: readonly string[]) => string | undefined): string {
  let toks
  try {
    toks = tokenize(expr)
  } catch {
    return expr
  }
  let out = ''
  let last = 0
  for (const t of toks) {
    if (t.kind !== 'name') continue
    const r = fn(t.path)
    if (r === undefined) continue
    out += expr.slice(last, t.pos) + r
    last = t.pos + t.text.length
  }
  return out + expr.slice(last)
}

/** True when the expression names `path` exactly (same segments). */
export function mentionsPath(expr: string, path: readonly string[]): boolean {
  try {
    return tokenize(expr).some((t) => t.kind === 'name' && t.path.length === path.length && t.path.every((p, i) => p === path[i]))
  } catch {
    return false
  }
}
