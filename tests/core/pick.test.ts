import { describe, expect, it } from 'vitest'
import { evaluate } from '../../src/core/eval/evaluate'
import { findFaceRef } from '../../src/core/eval/pick'
import { DEFAULT_PLANE, type Document, newDocument } from '../../src/core/model/types'
import { sx } from '../../src/core/units'
import { rectLines, regionOf } from './fixtures'

const IN = (n: number) => sx(n * 16)

const doc: Document = {
  ...newDocument('t'),
  features: [
    { kind: 'sketch', id: 's1', handle: 's1', name: 'Sketch 1', plane: DEFAULT_PLANE, lines: rectLines('a', 1, IN(0), IN(24), IN(0), IN(24)) },
    { kind: 'extrude', id: 'e1', name: 'Extrude 1', sketchId: 's1', regions: [regionOf('a')], distance: IN(24), op: 'new' },
    // the right side of the cube is the sweep of the rectangle's right line (a_r) outward +u
    {
      kind: 'sketch',
      id: 's2',
      handle: 's2',
      name: 'Sketch 2',
      plane: { kind: 'face', featureId: 'e1', region: regionOf('a'), face: 'side', lineId: 'a_r', outward: 1 },
      lines: rectLines('b', 1, IN(-20), IN(-4), IN(4), IN(8)),
    },
    { kind: 'extrude', id: 'e2', name: 'Extrude 2', sketchId: 's2', regions: [regionOf('b')], distance: IN(12), op: 'join', targetBodyId: 'e1' },
  ],
}

describe('findFaceRef', () => {
  const r = evaluate(doc)
  it('evaluates without errors', () => {
    expect(r.errors).toEqual([])
  })
  it('top of the cube is the sweep of the top line outward +v', () => {
    expect(findFaceRef(r, { plane: 'XY', offset: IN(24), normal: 1 }, IN(5), IN(-5))).toEqual({
      kind: 'face',
      featureId: 'e1',
      region: regionOf('a'),
      face: 'side',
      lineId: 'a_t',
      outward: 1,
    })
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
