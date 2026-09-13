import { afterEach, describe, expect, it, vi } from 'vitest'
import { allocateHeights, dockReducer, dockWidths, parseDockLayout, transferHeights, type DockLayout, type DockState } from '../../packages/kit/src/components/DockWorkspace/layout'
const defaults: DockLayout = { columns: { left: ['model', 'lists'], right: ['properties', 'selection'] }, widths: { left: 240, right: 300 }, hidden: { left: false, right: false }, folded: {}, weights: { model: 1, lists: 2, properties: 1, selection: 2 } }
const state = (): DockState => ({ layout: structuredClone(defaults), solo: {} })
describe('dock layout', () => {
  it('moves exactly once across docks and reorders without losing folds', () => {
    let s = dockReducer(state(), { type: 'fold', id: 'selection' })
    s = dockReducer(s, { type: 'move', id: 'selection', side: 'left', before: 'model' })
    expect(s.layout.columns).toEqual({ left: ['selection', 'model', 'lists'], right: ['properties'] })
    s = dockReducer(s, { type: 'move', id: 'model', side: 'left' })
    expect(s.layout.columns.left).toEqual(['selection', 'lists', 'model'])
    expect(s.layout.folded.selection).toBe(true)
    expect(dockReducer(s, { type: 'cancel' })).toBe(s)
  })
  it('temporarily fills a folded panel without changing normal state', () => {
    const s = dockReducer(state(), { type: 'fold', id: 'selection' })
    const filled = dockReducer(s, { type: 'fill', side: 'right', id: 'selection' })
    expect(filled.layout).toEqual(s.layout)
    expect(dockReducer(filled, { type: 'fill', side: 'right' })).toEqual(s)
    expect(dockReducer(filled, { type: 'move', id: 'selection', side: 'left' }).solo).toEqual({})
    expect(dockReducer(filled, { type: 'fold', id: 'selection' })).toEqual(s)
  })
  it('allocates short and mixed stacks without exceeding available space', () => {
    expect(allocateHeights([], defaults.weights, 500)).toEqual({})
    expect(allocateHeights(['model', 'lists'], defaults.weights, 60)).toEqual({ model: 30, lists: 30 })
    expect(allocateHeights(['lists'], defaults.weights, 500)).toEqual({ lists: 500 })
    const tall = allocateHeights(['model', 'lists'], defaults.weights, 300)
    expect(tall).toEqual({ model: 100, lists: 200 })
    allocateHeights(['model', 'lists'], defaults.weights, 20)
    expect(allocateHeights(['model', 'lists'], defaults.weights, 300)).toEqual(tall)
  })
  it('transfers only between neighbors and preserves folded weights', () => {
    const weights = { a: 1, b: 1, c: 1, folded: 2 }
    const result = transferHeights({ a: 100, b: 100, c: 100 }, weights, 'a', 'b', 1000)
    expect(allocateHeights(['a', 'b', 'c'], result, 300)).toEqual({ a: 160, b: 40, c: 100 })
    expect(result.folded).toBe(2)
  })
  it('retains a central viewport without mutating preferred widths', () => {
    const layout = structuredClone(defaults), widths = dockWidths(layout, 600)
    expect(widths.left + widths.right).toBeCloseTo(360)
    expect(layout.widths).toEqual(defaults.widths)
    expect(dockWidths(layout, 1200)).toEqual(defaults.widths)
  })
  it('repairs ids and malformed preferences and ignores temporary state', () => {
    const layout = parseDockLayout({ version: 1, columns: { left: ['selection', 'selection', 'bad'], right: ['selection'] }, widths: { left: Infinity }, weights: { model: NaN }, solo: { left: 'selection' } }, defaults)
    expect(layout.columns).toEqual({ left: ['selection', 'model', 'lists'], right: ['properties'] })
    expect(layout.widths.left).toBe(240)
    expect(layout.weights.model).toBe(1)
    expect(layout).not.toHaveProperty('solo')
    expect(parseDockLayout({ paneHeight: 800 }, defaults)).toEqual(defaults)
    expect(parseDockLayout(null, defaults)).toEqual(defaults)
  })
})

import { loadDockLayout, saveDockLayout } from '../../src/ui/persist'
afterEach(() => vi.unstubAllGlobals())
it('persists normal layout, leaves legacy data alone, and tolerates storage failure', () => {
  const data = new Map([['drafter.layout', '{"paneHeight":900}']])
  vi.stubGlobal('localStorage', { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => data.set(key, value) })
  expect(loadDockLayout(defaults)).toEqual(defaults)
  const moved = dockReducer(state(), { type: 'move', id: 'selection', side: 'left' })
  saveDockLayout(moved.layout)
  expect(loadDockLayout(defaults)).toEqual(moved.layout)
  expect(data.get('drafter.layout')).toBe('{"paneHeight":900}')
  expect(data.get('drafter.docks.v1')).not.toContain('solo')
  vi.stubGlobal('localStorage', { getItem: () => { throw Error('blocked') }, setItem: () => { throw Error('blocked') } })
  expect(loadDockLayout(defaults)).toEqual(defaults)
  expect(() => saveDockLayout(defaults)).not.toThrow()
})
