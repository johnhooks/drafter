import { describe, expect, it } from 'vitest'
import { box } from '../../src/core/geom/box'
import { boxFromRect, facePlaneOfExtrusion, toModel, toPlane } from '../../src/core/model/planes'
import type { ResolvedPlane } from '../../src/core/model/types'
import { sx } from '../../src/core/units'

const p = (plane: ResolvedPlane['plane'], offset: number, normal: 1 | -1): ResolvedPlane => ({ plane, offset: sx(offset), normal })

describe('plane mapping', () => {
  it('XY at offset 36 maps (u, v) to (x, y, 36)', () => {
    expect(toModel(p('XY', 576, 1), sx(10), sx(20))).toEqual({ x: 10, y: 20, z: 576 })
  })
  it('YZ mapping', () => {
    expect(toModel(p('YZ', 80, 1), sx(160), sx(320))).toEqual({ x: 80, y: 160, z: 320 })
  })
  it.each([
    p('XZ', 5, 1),
    p('XZ', 5, -1),
    p('XY', 5, 1),
    p('XY', 5, -1),
    p('YZ', 5, 1),
    p('YZ', 5, -1),
  ])('round trips on %o', (plane) => {
    const m = toModel(plane, sx(7), sx(9))
    expect(toPlane(plane, m)).toEqual({ u: 7, v: 9, n: 5 })
  })
})

describe('boxFromRect', () => {
  const r = { u0: 0, u1: 384, v0: 0, v1: 480 }
  it('front plane, positive distance goes along -Y', () => {
    expect(boxFromRect(p('XZ', 0, -1), r, sx(384))).toEqual(box(0, 384, -384, 0, 0, 480))
  })
  it('front plane, negative distance goes along +Y', () => {
    expect(boxFromRect(p('XZ', 0, -1), r, sx(-384))).toEqual(box(0, 384, 0, 384, 0, 480))
  })
  it('top plane', () => {
    expect(boxFromRect(p('XY', 16, 1), r, sx(32))).toEqual(box(0, 384, 0, 480, 16, 48))
  })
  it('side plane', () => {
    expect(boxFromRect(p('YZ', 16, 1), r, sx(32))).toEqual(box(16, 48, 0, 384, 0, 480))
  })
})

describe('facePlaneOfExtrusion', () => {
  const r = { u0: 0, u1: 384, v0: 0, v1: 480 }
  const front = p('XZ', 0, -1)
  it('cap of a 24" extrusion from XZ at 0 with normal -Y', () => {
    expect(facePlaneOfExtrusion(front, r, sx(384), 'cap')).toEqual(p('XZ', -384, -1))
  })
  it('follows a distance change', () => {
    expect(facePlaneOfExtrusion(front, r, sx(480), 'cap')).toEqual(p('XZ', -480, -1))
  })
  it('base faces back toward the viewer', () => {
    expect(facePlaneOfExtrusion(front, r, sx(384), 'base')).toEqual(p('XZ', 0, 1))
  })
  it('negative distance flips cap and base', () => {
    expect(facePlaneOfExtrusion(front, r, sx(-384), 'cap')).toEqual(p('XZ', 384, 1))
    expect(facePlaneOfExtrusion(front, r, sx(-384), 'base')).toEqual(p('XZ', 0, -1))
  })
  it('sides', () => {
    expect(facePlaneOfExtrusion(front, r, sx(384), 'uMin')).toEqual(p('YZ', 0, -1))
    expect(facePlaneOfExtrusion(front, r, sx(384), 'uMax')).toEqual(p('YZ', 384, 1))
    expect(facePlaneOfExtrusion(front, r, sx(384), 'vMin')).toEqual(p('XY', 0, -1))
    expect(facePlaneOfExtrusion(front, r, sx(384), 'vMax')).toEqual(p('XY', 480, 1))
  })
})
