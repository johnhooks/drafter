import { afterEach, describe, expect, it } from 'vitest'
import { loadDisplay, loadPaneHeight } from '../../src/ui/persist'

function stubStorage(json: string | null, key = 'drafter.display') {
  const store = new Map<string, string>()
  if (json !== null) store.set(key, json)
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

describe('loadPaneHeight', () => {
  afterEach(() => {
    Reflect.deleteProperty(globalThis, 'localStorage')
  })
  it('reads a stored height', () => {
    stubStorage(JSON.stringify({ paneHeight: 240 }), 'drafter.layout')
    expect(loadPaneHeight()).toBe(240)
  })
  it('falls back to the default proportion when nothing or nonsense is stored', () => {
    stubStorage(null, 'drafter.layout')
    expect(loadPaneHeight()).toBeNull()
    stubStorage(JSON.stringify({ paneHeight: 'tall' }), 'drafter.layout')
    expect(loadPaneHeight()).toBeNull()
  })
})
