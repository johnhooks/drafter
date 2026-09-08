import { describe, expect, it } from 'vitest'
import { evaluate } from '../../src/core/eval/evaluate'
import { findFaceRef } from '../../src/core/eval/pick'
import { rectFromCorners } from '../../src/core/model/sketch'
import { DEFAULT_PLANE, type Document, newDocument } from '../../src/core/model/types'
import { sx } from '../../src/core/units'

const IN = (n: number) => sx(n * 16)

const doc: Document = {
  ...newDocument('t'),
  features: [
    { kind: 'sketch', id: 's1', handle: 's1', name: 'Sketch 1', plane: DEFAULT_PLANE, rects: [rectFromCorners('r1', 'r1', IN(0), IN(0), IN(24), IN(24))] },
    { kind: 'extrude', id: 'e1', name: 'Extrude 1', sketchId: 's1', rectIds: ['r1'], distance: IN(24), op: 'new' },
    { kind: 'sketch', id: 's2', handle: 's2', name: 'Sketch 2', plane: { kind: 'face', featureId: 'e1', face: 'uMax' }, rects: [rectFromCorners('r2', 'r1', IN(-20), IN(4), IN(-4), IN(8))] },
    { kind: 'extrude', id: 'e2', name: 'Extrude 2', sketchId: 's2', rectIds: ['r2'], distance: IN(12), op: 'join', targetBodyId: 'e1' },
  ],
}

describe('findFaceRef', () => {
  const r = evaluate(doc)
  it('top of the cube is the vMax face of Extrude 1', () => {
    expect(findFaceRef(r, { plane: 'XY', offset: IN(24), normal: 1 }, IN(5), IN(-5))).toEqual({ kind: 'face', featureId: 'e1', rectId: 'r1', face: 'vMax' })
  })
  it('cap of the cube', () => {
    expect(findFaceRef(r, { plane: 'XZ', offset: IN(-24), normal: -1 }, IN(5), IN(5))).toMatchObject({ featureId: 'e1', face: 'cap' })
  })
  it('end of the shelf resolves to the shelf extrude, not the cube', () => {
    expect(findFaceRef(r, { plane: 'YZ', offset: IN(36), normal: 1 }, IN(-10), IN(6))).toMatchObject({ featureId: 'e2', face: 'cap' })
  })
  it('nothing on an empty plane', () => {
    expect(findFaceRef(r, { plane: 'XY', offset: IN(50), normal: 1 }, IN(5), IN(5))).toBeNull()
  })
})
