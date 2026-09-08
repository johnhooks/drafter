import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const forbidden = [/from ['"]react/, /from ['"]three/, /from ['"]zustand/, /\b(document|window)\.\w/]

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name)
    return statSync(p).isDirectory() ? walk(p) : [p]
  })
}

describe('core boundaries', () => {
  it('src/core has no UI or DOM dependencies', () => {
    const offenders: string[] = []
    for (const file of walk('src/core')) {
      const text = readFileSync(file, 'utf8')
      for (const re of forbidden) {
        if (re.test(text)) offenders.push(`${file}: ${re}`)
      }
    }
    expect(offenders).toEqual([])
  })
})
