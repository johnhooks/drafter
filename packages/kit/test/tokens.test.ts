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
const entries = (css: string) => [...css.matchAll(/(--kit-[a-z0-9-]+)\s*:\s*([^;]+);/g)].map((m) => ({ name: m[1]!, value: m[2]!.trim() }))
const isPrimitive = (name: string) => name.startsWith('--kit-color-')
/** A role is a colour token when it points at a primitive; a theme must reassign each of these and nothing else. */
const colourRoles = (css: string) => entries(css).filter((e) => !isPrimitive(e.name) && /^var\(--kit-color-[a-z0-9-]+\)$/.test(e.value)).map((e) => e.name)

describe('tokens', () => {
  it('component stylesheets contain no literal colours', () => {
    const offenders: string[] = []
    for (const f of walk(join(src, 'components')).filter((f) => f.endsWith('.css'))) {
      const css = readFileSync(f, 'utf8')
      if (COLOUR.test(css)) offenders.push(f)
    }
    expect(offenders).toEqual([])
  })

  it('colour values live only on primitives, and every role points at a primitive that exists', () => {
    const root = readFileSync(join(src, 'tokens.css'), 'utf8')
    const all = entries(root)
    const primitives = new Set(all.filter((e) => isPrimitive(e.name)).map((e) => e.name))
    expect(all.filter((e) => isPrimitive(e.name) && !COLOUR.test(e.value)).map((e) => e.name)).toEqual([])
    expect(all.filter((e) => !isPrimitive(e.name) && COLOUR.test(e.value)).map((e) => e.name)).toEqual([])
    for (const theme of ['light', 'dark']) {
      const css = readFileSync(join(src, 'themes', `${theme}.css`), 'utf8')
      const themed = entries(css)
      expect(themed.filter((e) => isPrimitive(e.name)).map((e) => e.name)).toEqual([])
      const dangling = themed.filter((e) => !primitives.has(e.value.slice('var('.length, -1))).map((e) => `${e.name}: ${e.value}`)
      expect(dangling).toEqual([])
    }
  })

  it('every theme assigns the same colour roles as the root fallback', () => {
    const root = readFileSync(join(src, 'tokens.css'), 'utf8')
    const rootColours = new Set(colourRoles(root))
    for (const theme of ['light', 'dark']) {
      const css = readFileSync(join(src, 'themes', `${theme}.css`), 'utf8')
      expect(new Set(tokenNames(css))).toEqual(rootColours)
    }
  })
})
