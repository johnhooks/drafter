import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const src = join(__dirname, '..', 'src')

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n)
    return statSync(p).isDirectory() ? walk(p) : [p]
  })
}

const tokenNames = (css: string) => [...css.matchAll(/--kit-[a-z0-9-]+(?=\s*:)/g)].map((m) => m[0])
const COLOUR = /#[0-9a-f]{3,8}\b|\brgba?\(|\bhsla?\(/i
/** Tokens whose root value is a colour; a theme must reassign each of these and nothing else. */
const colourTokenNames = (css: string) => [...css.matchAll(/(--kit-[a-z0-9-]+)\s*:\s*([^;]+);/g)].filter((m) => COLOUR.test(m[2]!)).map((m) => m[1]!)

describe('tokens', () => {
  it('component stylesheets contain no literal colours', () => {
    const offenders: string[] = []
    for (const f of walk(join(src, 'components')).filter((f) => f.endsWith('.css'))) {
      const css = readFileSync(f, 'utf8')
      if (COLOUR.test(css)) offenders.push(f)
    }
    expect(offenders).toEqual([])
  })

  it('every theme assigns the same colour tokens as the root fallback', () => {
    const root = readFileSync(join(src, 'tokens.css'), 'utf8')
    const rootColours = new Set(colourTokenNames(root))
    for (const theme of ['light', 'dark']) {
      const css = readFileSync(join(src, 'themes', `${theme}.css`), 'utf8')
      expect(new Set(tokenNames(css))).toEqual(rootColours)
    }
  })
})
