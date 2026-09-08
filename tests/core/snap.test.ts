import { describe, expect, it } from 'vitest'
import { snap } from '../../src/core/snap'

const ctx = { corners: [[384, 384]] as const, uEdges: [384, 0], vEdges: [384, 0], range: 6 }

describe('snap', () => {
  it('grid snap rounds to the nearest sixteenth', () => {
    expect(snap(160.48, 100.2, { corners: [], uEdges: [], vEdges: [], range: 6 })).toMatchObject({ u: 160, v: 100, kind: 'grid' })
  })
  it('edge beats grid, per axis', () => {
    const r = snap(381, 100.2, ctx)
    expect(r).toMatchObject({ u: 384, v: 100, kind: 'edge', snappedU: true, snappedV: false })
  })
  it('corner beats edge', () => {
    expect(snap(381, 387, ctx)).toMatchObject({ u: 384, v: 384, kind: 'corner' })
  })
  it('out of range falls through', () => {
    expect(snap(370, 100, ctx)).toMatchObject({ u: 370, v: 100, kind: 'grid' })
  })
})
