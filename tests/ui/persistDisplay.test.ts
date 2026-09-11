import { afterEach, describe, expect, it } from 'vitest'
import { loadDisplay } from '../../src/ui/persist'

function stubStorage(json: string | null) {
  const store = new Map<string, string>()
  if (json !== null) store.set('drafter.display', json)
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v) },
  })
}

describe('loadDisplay', () => {
  afterEach(() => {
    Reflect.deleteProperty(globalThis, 'localStorage')
  })
  it('reads the constraints toggle', () => {
    stubStorage(JSON.stringify({ grid: true, constraints: false, handles: false, sizes: false }))
    expect(loadDisplay().constraints).toBe(false)
  })
  it('reads a dimensions toggle stored by an earlier version as the constraints toggle', () => {
    stubStorage(JSON.stringify({ grid: true, dims: false, handles: true, sizes: false }))
    expect(loadDisplay()).toEqual({ grid: true, constraints: false, handles: true, sizes: false })
  })
  it('falls back to the default when nothing is stored', () => {
    stubStorage(null)
    expect(loadDisplay().constraints).toBe(true)
  })
})
