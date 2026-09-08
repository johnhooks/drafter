import { describe, expect, it } from 'vitest'
import { evaluate } from '../../src/core/eval/evaluate'
import { rectFromCorners } from '../../src/core/model/sketch'
import { DEFAULT_PLANE, type Document, type SketchFeature, newDocument } from '../../src/core/model/types'
import { dimensionsOf, sizeLabel } from '../../src/ui/sketch/Dimensions'
import * as A from '../../src/ui/store/actions'

const IN = (n: number) => n * 16

function doc(layout?: SketchFeature['rects'][number]['layout']): Document {
  return {
    ...newDocument('t'),
    features: [
      { kind: 'sketch', id: 's1', handle: 's1', name: 'Sketch 1', plane: DEFAULT_PLANE, rects: [rectFromCorners('a', 'r1', 0, 0, IN(24), IN(24))] },
      { kind: 'extrude', id: 'e1', name: 'Extrude 1', sketchId: 's1', rectIds: ['a'], distance: IN(24), op: 'new' },
      {
        kind: 'sketch',
        id: 's2',
        handle: 's2',
        name: 'Sketch 2',
        plane: { kind: 'face', featureId: 'e1', face: 'vMax' },
        rects: [{ id: 'b', handle: 'r1', u: { min: 'face.left + 2', max: 'face.right - 2' }, v: { min: IN(-20), max: IN(-4) }, ...(layout ? { layout } : {}) }],
      },
    ],
  }
}

const sketchOf = (d: Document) => d.features[2] as SketchFeature
const resultOf = (d: Document) => {
  const r = evaluate(d).results.get('s2')
  if (r?.kind !== 'sketch') throw new Error('no sketch result')
  return r
}

describe('dimensionsOf placement', () => {
  const pxPerSx = 12 / 16 // 12 px per inch

  it('automatic dimensions sit above the rectangle and stack outward', () => {
    const d = doc()
    const { dims } = dimensionsOf(sketchOf(d), resultOf(d), { pxPerSx })
    expect(dims.map((x) => x.ref.slot)).toEqual(['min', 'max'])
    const step = Math.round(22 / pxPerSx)
    expect(dims[0]).toMatchObject({ edge: IN(-4), at: IN(-4) + step, offset: step, labelAt: 0.5, stored: false })
    expect(dims[1]).toMatchObject({ edge: IN(-4), at: IN(-4) + 2 * step, offset: 2 * step, stored: false })
  })

  it('a stored offset runs continuously from the top edge: positive above, negative inside, then below', () => {
    const d = doc({ u: { min: { offset: IN(3), label: 1 }, max: { offset: -IN(1) } } })
    const { dims } = dimensionsOf(sketchOf(d), resultOf(d), { pxPerSx })
    expect(dims[0]).toMatchObject({ edge: IN(-4), at: IN(-4) + IN(3), labelAt: 1, stored: true })
    // 1" inside the rectangle, still nearer the top edge
    expect(dims[1]).toMatchObject({ edge: IN(-4), at: IN(-5), stored: true })
    const far = doc({ u: { min: { offset: -IN(18) } } })
    const below = dimensionsOf(sketchOf(far), resultOf(far), { pxPerSx }).dims[0]!
    // 2" past the bottom edge: extension lines come from the bottom
    expect(below).toMatchObject({ edge: IN(-20), at: IN(-22) })
  })

  it('label fractions clamp to the allowed range', () => {
    const d = doc({ u: { min: { offset: IN(1), label: 9 } } })
    const { dims } = dimensionsOf(sketchOf(d), resultOf(d), { pxPerSx })
    expect(dims[0]!.labelAt).toBe(1.5)
  })

  it('overrides win over stored layouts while dragging', () => {
    const d = doc({ u: { min: { offset: IN(1) } } })
    const overrides = new Map([['b:u:min', { offset: IN(5), label: 0.25 }]])
    const { dims } = dimensionsOf(sketchOf(d), resultOf(d), { pxPerSx, overrides })
    expect(dims[0]).toMatchObject({ at: IN(-4) + IN(5), labelAt: 0.25 })
  })

  it('size labels default below and right, and follow a stored placement', () => {
    const d = doc()
    const rect = sketchOf(d).rects[0]!
    const r = resultOf(d).rects.get('b')!
    const w = sizeLabel(rect, r, 'u', { pxPerSx })
    expect(w).toMatchObject({ from: IN(2), to: IN(22), at: IN(-20) - Math.round(14 / pxPerSx), labelAt: 0.5, stored: false })
    const h = sizeLabel({ ...rect, layout: { v: { size: { offset: -IN(2), label: 0 } } } }, r, 'v', { pxPerSx })
    // 2" inside from the right edge, still nearer the right
    expect(h).toMatchObject({ from: IN(-20), to: IN(-4), at: IN(22) - IN(2), labelAt: 0, stored: true })
  })
})

describe('setDimLayout', () => {
  it('stores, replaces, clears, and is undoable; removing the constraint drops it', () => {
    let s = A.loadDocument(A.initialState(), doc())
    const before = s.history.past.length
    s = A.setDimLayout(s, 's2', 'b', 'u', 'min', { offset: IN(3), label: 1 })
    expect((s.doc.features[2] as SketchFeature).rects[0]!.layout).toEqual({ u: { min: { offset: IN(3), label: 1 } } })
    expect(s.history.past.length).toBe(before + 1)
    s = A.setDimLayout(s, 's2', 'b', 'u', 'min', undefined)
    expect((s.doc.features[2] as SketchFeature).rects[0]!.layout).toBeUndefined()
    s = A.setDimLayout(s, 's2', 'b', 'u', 'max', { offset: IN(1) })
    s = A.removeConstraint(s, { sketchId: 's2', rectId: 'b', axis: 'u', slot: 'max' })
    const rect = (s.doc.features[2] as SketchFeature).rects[0]!
    expect(rect.u.max).toBe(IN(22))
    expect(rect.layout).toBeUndefined()
  })
})
