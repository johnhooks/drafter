import { ExprError, type Token, tokenize } from './lexer'

export type Ast =
  | { kind: 'num'; value: number }
  | { kind: 'ref'; path: string[] }
  | { kind: 'neg'; arg: Ast }
  | { kind: 'bin'; op: '+' | '-' | '*' | '/'; left: Ast; right: Ast }

export function parse(src: string): Ast {
  const tokens = tokenize(src)
  if (tokens.length === 0) throw new ExprError('Empty expression', 0)
  let i = 0
  const peek = () => tokens[i]
  const take = () => tokens[i++]!
  const isOp = (t: Token | undefined, ...ops: string[]) => t?.kind === 'op' && ops.includes(t.op)

  function expr(): Ast {
    let left = term()
    while (isOp(peek(), '+', '-')) {
      const op = (take() as Token & { kind: 'op' }).op as '+' | '-'
      left = { kind: 'bin', op, left, right: term() }
    }
    return left
  }
  function term(): Ast {
    let left = unary()
    while (isOp(peek(), '*', '/')) {
      const op = (take() as Token & { kind: 'op' }).op as '*' | '/'
      left = { kind: 'bin', op, left, right: unary() }
    }
    return left
  }
  function unary(): Ast {
    if (isOp(peek(), '-')) {
      take()
      return { kind: 'neg', arg: unary() }
    }
    return primary()
  }
  function primary(): Ast {
    const t = peek()
    if (!t) throw new ExprError('Unexpected end of expression', src.length)
    if (t.kind === 'num') {
      take()
      return { kind: 'num', value: t.value }
    }
    if (t.kind === 'name') {
      take()
      return { kind: 'ref', path: t.path }
    }
    if (isOp(t, '(')) {
      take()
      const inner = expr()
      if (!isOp(peek(), ')')) throw new ExprError('Missing closing parenthesis', peek()?.pos ?? src.length)
      take()
      return inner
    }
    throw new ExprError(`Unexpected "${t.text}"`, t.pos)
  }

  const ast = expr()
  if (i < tokens.length) throw new ExprError(`Unexpected "${tokens[i]!.text}"`, tokens[i]!.pos)
  return ast
}

/** All dotted and plain names an expression references, in order of appearance. */
export function references(ast: Ast): string[][] {
  switch (ast.kind) {
    case 'num':
      return []
    case 'ref':
      return [ast.path]
    case 'neg':
      return references(ast.arg)
    case 'bin':
      return [...references(ast.left), ...references(ast.right)]
  }
}

/** Matches `ref`, `ref + lit`, or `ref - lit`, the shapes drawn as driving dimensions. */
export function simpleLink(ast: Ast): { ref: string[]; offset: number } | null {
  if (ast.kind === 'ref') return { ref: ast.path, offset: 0 }
  if (ast.kind === 'bin' && (ast.op === '+' || ast.op === '-') && ast.left.kind === 'ref' && ast.right.kind === 'num')
    return { ref: ast.left.path, offset: ast.op === '+' ? ast.right.value : -ast.right.value }
  return null
}
