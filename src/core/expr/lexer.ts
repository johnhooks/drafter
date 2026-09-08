export type Token =
  | { kind: 'num'; value: number; pos: number; text: string }
  | { kind: 'name'; path: string[]; pos: number; text: string }
  | { kind: 'op'; op: '+' | '-' | '*' | '/' | '(' | ')'; pos: number; text: string }

export class ExprError extends Error {
  constructor(
    message: string,
    readonly pos: number,
  ) {
    super(message)
  }
}

const IDENT = /^[A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)*/
const MIXED = /^(\d+)[ -](\d+)\/(\d+)/
const FRACTION = /^(\d+)\/(\d+)/
const DECIMAL = /^\d+(?:\.\d+)?/

/** Tokenizes an expression; number tokens are already in sixteenths (possibly fractional until rounding). */
export function tokenize(src: string): Token[] {
  const out: Token[] = []
  let i = 0
  while (i < src.length) {
    const ch = src[i]!
    if (ch === ' ' || ch === '\t') {
      i++
      continue
    }
    const rest = src.slice(i)
    if (/^\d/.test(rest)) {
      let m = MIXED.exec(rest)
      let value: number
      let text: string
      if (m) {
        const den = Number(m[3])
        if (den === 0) throw new ExprError('Fraction with a zero denominator', i)
        value = Number(m[1]) * 16 + (Number(m[2]) * 16) / den
        text = m[0]
        if (rest[text.length] === '/') throw new ExprError('Ambiguous fraction; use parentheses', i + text.length)
      } else if ((m = FRACTION.exec(rest))) {
        const den = Number(m[2])
        if (den === 0) throw new ExprError('Fraction with a zero denominator', i)
        value = (Number(m[1]) * 16) / den
        text = m[0]
      } else {
        m = DECIMAL.exec(rest)!
        value = Number(m[0]) * 16
        text = m[0]
      }
      if (rest[text.length] === '"') text += '"'
      out.push({ kind: 'num', value, pos: i, text })
      i += text.length
      continue
    }
    const id = IDENT.exec(rest)
    if (id) {
      out.push({ kind: 'name', path: id[0].split('.'), pos: i, text: id[0] })
      i += id[0].length
      continue
    }
    if (ch === '+' || ch === '-' || ch === '*' || ch === '/' || ch === '(' || ch === ')') {
      out.push({ kind: 'op', op: ch, pos: i, text: ch })
      i++
      continue
    }
    throw new ExprError(`Unexpected character "${ch}"`, i)
  }
  return out
}
