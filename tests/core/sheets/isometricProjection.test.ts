import { expect, it } from 'vitest'
import { box } from '../../../src/core/geom/box'
import { newBody } from '../../../src/core/geom/body'
import { isometricProjection } from '../../../src/core/sheets/isometric'
import { defaultScale } from '../../../src/core/sheets/layout'

it('fits captured projected bounds rather than the model diagonal', () => {
  const body = newBody('body', 'Body', box(0, 384, 0, 1600, 0, 384))
  const result = isometricProjection([body], { azimuth: -90, elevation: 0 })
  expect(result.bounds!.u1 - result.bounds!.u0).toBeCloseTo(384)
  expect(result.bounds!.v1 - result.bounds!.v0).toBeCloseTo(384)
  expect(defaultScale(result.bounds, 'landscape')).toBe(4)
})

it('centres the projected union, not empty corners of its world bounding box', () => {
  const bodies = [newBody('first', 'First', box(0, 16, 0, 16, 0, 16)), newBody('second', 'Second', box(160, 176, 160, 176, 0, 16)), newBody('third', 'Third', box(0, 16, 320, 336, 0, 16))]
  const result = isometricProjection(bodies, { azimuth: -45, elevation: 30 })
  const dot = (axis: readonly number[]) => axis.reduce((sum, value, index) => sum + value * result.center[index]!, 0)
  expect(dot(result.right)).toBeCloseTo((result.bounds!.u0 + result.bounds!.u1) / 2)
  expect(dot(result.up)).toBeCloseTo((result.bounds!.v0 + result.bounds!.v1) / 2)
  const enclosing = isometricProjection([newBody('outer', 'Outer', box(0, 176, 0, 336, 0, 16))], { azimuth: -45, elevation: 30 })
  expect(result.bounds).not.toEqual(enclosing.bounds)
})

it('returns no bounds for empty targets', () => {
  expect(isometricProjection([], { azimuth: 0, elevation: 0 }).bounds).toBeNull()
})

it('does not reject an exact fit at a cardinal camera angle', () => {
  const body = newBody('body', 'Body', box(0, 160, 0, 1600, 0, 96))
  expect(defaultScale(isometricProjection([body], { azimuth: -90, elevation: 0 }).bounds, 'landscape')).toBe(1)
})
