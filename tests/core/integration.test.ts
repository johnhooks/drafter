import { describe, expect, it } from 'vitest'
import { bodyBounds, bodyVolume } from '../../src/core/geom/body'
import { evaluate } from '../../src/core/eval/evaluate'
import { parseDocument, serializeDocument } from '../../src/core/model/document'
import { DEFAULT_PLANE, type Document, newDocument } from '../../src/core/model/types'

const IN = (n: number) => n * 16

/**
 * A base cabinet: carcass box, a door inset by `reveal` on all four sides of the front face,
 * and a shelf `ply` thick sitting 12" below the top, spanning the carcass width by parameter.
 */
function carcass(width: string, ply: string): Document {
  return {
    ...newDocument('Base cabinet'),
    params: [
      { name: 'width', value: width },
      { name: 'depth', value: 24 * 16 },
      { name: 'height', value: 34 * 16 },
      { name: 'ply', value: ply },
      { name: 'reveal', value: '1/8' },
    ],
    features: [
      { kind: 'sketch', id: 's1', handle: 's1', name: 'Carcass', plane: DEFAULT_PLANE, rects: [{ id: 'c', handle: 'r1', u: { min: 0, size: 'width' }, v: { min: 0, size: 'height' } }] },
      { kind: 'extrude', id: 'e1', name: 'Carcass', sketchId: 's1', rectIds: ['c'], distance: 'depth', op: 'new' },
      // the front of the carcass is the cap of the extrusion (XZ at y = -depth, normal -Y)
      {
        kind: 'sketch',
        id: 's2',
        handle: 's2',
        name: 'Door',
        plane: { kind: 'face', featureId: 'e1', face: 'cap' },
        rects: [{ id: 'd', handle: 'r1', u: { min: 'face.left + reveal', max: 'face.right - reveal' }, v: { min: 'face.bottom + reveal', max: 'face.top - reveal' } }],
      },
      { kind: 'extrude', id: 'e2', name: 'Door', sketchId: 's2', rectIds: ['d'], distance: 'ply', op: 'new' },
      // shelf sketched on the right side (YZ at x = width, normal +X), extruded back through the carcass
      {
        kind: 'sketch',
        id: 's3',
        handle: 's3',
        name: 'Shelf',
        plane: { kind: 'face', featureId: 'e1', face: 'uMax' },
        rects: [{ id: 'sh', handle: 'r1', u: { min: 'face.left', max: 'face.right' }, v: { max: 'face.top - 12', size: 'ply' } }],
      },
      { kind: 'extrude', id: 'e3', name: 'Shelf', sketchId: 's3', rectIds: ['sh'], distance: '-(width)', op: 'join', targetBodyId: 'e1' },
    ],
  }
}

describe('integration: parametric base cabinet', () => {
  it('builds with a 30" carcass and 3/4 ply', () => {
    const r = evaluate(carcass('30', '3/4'))
    expect(r.errors).toEqual([])
    const body = r.bodies.get('e1')!
    // shelf lies entirely inside the carcass, so the carcass volume is unchanged by the join
    expect(bodyVolume(body)).toBe(IN(30) * IN(24) * IN(34))
    const door = r.bodies.get('e2')!
    expect(bodyBounds(door)).toEqual({ x0: 2, x1: IN(30) - 2, y0: -IN(24) - 12, y1: -IN(24), z0: 2, z1: IN(34) - 2 })
    const shelf = r.results.get('e3')
    expect(shelf?.kind === 'extrude' && shelf.boxes.get('sh')).toEqual({ x0: 0, x1: IN(30), y0: -IN(24), y1: 0, z0: IN(22) - 12, z1: IN(22) })
  })

  it('follows a change of width and ply', () => {
    const r = evaluate(carcass('36', '1/2'))
    expect(r.errors).toEqual([])
    expect(bodyVolume(r.bodies.get('e1')!)).toBe(IN(36) * IN(24) * IN(34))
    expect(bodyBounds(r.bodies.get('e2')!)).toEqual({ x0: 2, x1: IN(36) - 2, y0: -IN(24) - 8, y1: -IN(24), z0: 2, z1: IN(34) - 2 })
    const shelf = r.results.get('e3')
    expect(shelf?.kind === 'extrude' && shelf.boxes.get('sh')).toEqual({ x0: 0, x1: IN(36), y0: -IN(24), y1: 0, z0: IN(22) - 8, z1: IN(22) })
  })

  it('round trips through the file format', () => {
    const doc = carcass('30', '3/4')
    const parsed = parseDocument(serializeDocument(doc))
    expect(parsed.ok && parsed.doc).toEqual(doc)
  })
})
