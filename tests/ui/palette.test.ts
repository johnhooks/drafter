import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { CANVAS_ROLES } from '../../src/ui/sketch/palette'

describe('canvas palette', () => {
  it('names every --kit-canvas-* token the kit defines and nothing else', () => {
    const css = readFileSync(join(__dirname, '..', '..', 'packages', 'kit', 'src', 'tokens.css'), 'utf8')
    const defined = [...css.matchAll(/--kit-canvas-([a-z0-9-]+)(?=\s*:)/g)].map((m) => m[1]!).sort()
    expect([...CANVAS_ROLES].sort()).toEqual(defined)
  })
})
