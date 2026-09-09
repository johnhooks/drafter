import { describe, expect, it } from 'vitest'
import { bodyBounds, bodyVolume } from '../../src/core/geom/body'
import { evaluate } from '../../src/core/eval/evaluate'
import { parseDocument, serializeDocument } from '../../src/core/model/document'
import { DEFAULT_PLANE, DEFAULT_VIEW, type Document, type SketchLine, newDocument, regionKey } from '../../src/core/model/types'
import { regionOf } from './fixtures'

const IN = (n: number) => n * 16

/** Four attached lines whose positions are expressions. Order left, bottom, right, top; ids `${p}_l` and so on. */
function exprRect(p: string, left: string | number, bottom: string | number, right: string | number, top: string | number): SketchLine[] {
  return [
    { id: `${p}_l`, handle: 'l1', dir: 'v', at: left, run: { min: 'l2.at', max: 'l4.at' } },
    { id: `${p}_b`, handle: 'l2', dir: 'h', at: bottom, run: { min: 'l1.at', max: 'l3.at' } },
    { id: `${p}_r`, handle: 'l3', dir: 'v', at: right, run: { min: 'l2.at', max: 'l4.at' } },
    { id: `${p}_t`, handle: 'l4', dir: 'h', at: top, run: { min: 'l1.at', max: 'l3.at' } },
  ]
}

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
      { kind: 'sketch', id: 's1', handle: 's1', name: 'Carcass', plane: DEFAULT_PLANE, lines: exprRect('c', 0, 0, 'l1.at + width', 'l2.at + height') },
      { kind: 'extrude', id: 'e1', name: 'Carcass', sketchId: 's1', regions: [regionOf('c')], distance: 'depth', op: 'new' },
      // the front of the carcass is the cap of the extrusion (XZ at y = -depth, normal -Y)
      {
        kind: 'sketch',
        id: 's2',
        handle: 's2',
        name: 'Door',
        plane: { kind: 'face', featureId: 'e1', region: regionOf('c'), face: 'cap' },
        lines: exprRect('d', 'face.left + reveal', 'face.bottom + reveal', 'face.right - reveal', 'face.top - reveal'),
      },
      { kind: 'extrude', id: 'e2', name: 'Door', sketchId: 's2', regions: [regionOf('d')], distance: 'ply', op: 'new' },
      // shelf sketched on the right side (YZ at x = width, normal +X), extruded back through the carcass
      {
        kind: 'sketch',
        id: 's3',
        handle: 's3',
        name: 'Shelf',
        plane: { kind: 'face', featureId: 'e1', region: regionOf('c'), face: 'side', lineId: 'c_r', outward: 1 },
        lines: exprRect('sh', 'face.left', 'l4.at - ply', 'face.right', 'face.top - 12'),
      },
      { kind: 'extrude', id: 'e3', name: 'Shelf', sketchId: 's3', regions: [regionOf('sh')], distance: '-(width)', op: 'join', targetBodyId: 'e1' },
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
    expect(shelf?.kind === 'extrude' && shelf.regions.get(regionKey(regionOf('sh')))!.boxes).toEqual([{ x0: 0, x1: IN(30), y0: -IN(24), y1: 0, z0: IN(22) - 12, z1: IN(22) }])
  })

  it('follows a change of width and ply', () => {
    const r = evaluate(carcass('36', '1/2'))
    expect(r.errors).toEqual([])
    expect(bodyVolume(r.bodies.get('e1')!)).toBe(IN(36) * IN(24) * IN(34))
    expect(bodyBounds(r.bodies.get('e2')!)).toEqual({ x0: 2, x1: IN(36) - 2, y0: -IN(24) - 8, y1: -IN(24), z0: 2, z1: IN(34) - 2 })
    const shelf = r.results.get('e3')
    expect(shelf?.kind === 'extrude' && shelf.regions.get(regionKey(regionOf('sh')))!.boxes).toEqual([{ x0: 0, x1: IN(36), y0: -IN(24), y1: 0, z0: IN(22) - 8, z1: IN(22) }])
  })

  it('round trips through the file format', () => {
    const doc = carcass('30', '3/4')
    const parsed = parseDocument(serializeDocument({ version: 4, model: doc, view: DEFAULT_VIEW }))
    expect(parsed.ok && parsed.file.model).toEqual(doc)
  })
})
