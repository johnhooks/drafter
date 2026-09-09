import { describe, expect, it } from 'vitest'
import { DEFAULT_PLANE } from '../../src/core/model/types'
import * as A from '../../src/ui/store/actions'

describe('display preference and expression focus', () => {
  it('defaults to grid and dimensions on, handles and sizes off', () => {
    expect(A.initialState().display).toEqual({ grid: true, dims: true, handles: false, sizes: false })
    expect(A.initialState().exprFocus).toBe(false)
  })
  it('patches one toggle at a time and never touches history', () => {
    let s = A.addSketch(A.initialState(), DEFAULT_PLANE, 's1')
    const past = s.history.past.length
    s = A.setDisplay(s, { sizes: true })
    expect(s.display).toEqual({ grid: true, dims: true, handles: false, sizes: true })
    s = A.setDisplay(s, { grid: false })
    expect(s.display).toEqual({ grid: false, dims: true, handles: false, sizes: true })
    s = A.setExprFocus(s, true)
    expect(s.exprFocus).toBe(true)
    expect(s.history.past.length).toBe(past)
    expect(A.canRedo(s)).toBe(false)
  })
  it('setting the same focus returns the same state', () => {
    const s = A.initialState()
    expect(A.setExprFocus(s, false)).toBe(s)
  })
  it('survives loading a document, unlike the undo history', () => {
    let s = A.setDisplay(A.initialState(), { handles: true })
    s = A.loadDocument(s, A.initialState().doc)
    expect(s.display.handles).toBe(true)
  })
})
