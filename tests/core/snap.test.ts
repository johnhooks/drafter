import { describe, expect, it } from 'vitest'
import { projectionSnapContext, snap } from '../../src/core/snap'
import type { Projection } from '../../src/core/projection/project'

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

describe('snap to sketch lines', () => {
  // a vertical line at u = 160 supplies a u edge; its endpoints are corners
  const lines = { corners: [[160, 0], [160, 256]] as const, uEdges: [160], vEdges: [], range: 6 }
  it('a pointer near a vertical line snaps its u only', () => {
    expect(snap(163, 100.4, lines)).toMatchObject({ u: 160, v: 100, kind: 'edge', snappedU: true, snappedV: false })
  })
  it('a pointer near an endpoint snaps both', () => {
    expect(snap(163, 253, lines)).toMatchObject({ u: 160, v: 256, kind: 'corner' })
  })
})

describe('snap candidate source', () => {
  it('uses source candidates instead of legacy candidates', () => {
    const source = { corners: [[160, 256]] as const, uEdges: [160], vEdges: [256] }
    const context = { ...ctx, source }
    expect(snap(163, 253, context)).toEqual({ u: 160, v: 256, kind: 'corner', snappedU: true, snappedV: true })
    expect(snap(158, 100.4, context)).toEqual({ u: 160, v: 100, kind: 'edge', snappedU: true, snappedV: false })
    expect(snap(100.4, 253, context)).toEqual({ u: 100, v: 256, kind: 'edge', snappedU: false, snappedV: true })
    expect(snap(381, 387, context)).toEqual({ u: 381, v: 387, kind: 'grid', snappedU: false, snappedV: false })
  })
})

describe('snap to projection', () => {
  const projection: Projection = {
    vertices: [[160, 256], [160, 320], [163, 0], [163, 64], [224, 256]],
    segments: [
      { dir: 'v', at: 160, min: 256, max: 320, visible: false },
      { dir: 'h', at: 256, min: 160, max: 224, visible: false },
      { dir: 'v', at: 163, min: 0, max: 64, visible: true },
    ],
    bounds: { u0: 160, u1: 224, v0: 0, v1: 320 },
  }

  it('prioritizes a hidden corner over a closer visible edge', () => {
    expect(snap(163, 253, projectionSnapContext(projection, 6))).toEqual({ u: 160, v: 256, kind: 'corner', snappedU: true, snappedV: true })
  })

  it.each([
    [158, 290.4, 160, 290, 'edge', true, false],
    [200.4, 253, 200, 256, 'edge', false, true],
    [165, 30.4, 163, 30, 'edge', true, false],
    [100.4, 100.6, 100, 101, 'grid', false, false],
  ] as const)('snaps (%s, %s) per axis before falling back to grid', (u, v, expectedU, expectedV, kind, snappedU, snappedV) => {
    expect(snap(u, v, projectionSnapContext(projection, 6))).toEqual({ u: expectedU, v: expectedV, kind, snappedU, snappedV })
  })

  it('uses the caller range in view sixteenths', () => {
    expect(snap(158, 290.4, projectionSnapContext(projection, 1))).toEqual({ u: 158, v: 290, kind: 'grid', snappedU: false, snappedV: false })
  })

  it('falls back to grid for an empty projection', () => {
    expect(snap(12.4, -3.6, projectionSnapContext({ vertices: [], segments: [], bounds: null }, 6))).toEqual({ u: 12, v: -4, kind: 'grid', snappedU: false, snappedV: false })
  })
})
