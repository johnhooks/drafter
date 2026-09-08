import { describe, expect, it } from 'vitest'
import { bodyBounds, bodyVolume } from '../../src/core/geom/body'
import { evaluate } from '../../src/core/eval/evaluate'
import { resolveSketch } from '../../src/core/eval/resolveSketch'
import { length } from '../../src/core/expr/evaluate'
import { rectFromCorners } from '../../src/core/model/sketch'
import { DEFAULT_PLANE, type Document, type ResolvedPlane, type SketchFeature, type SketchRect, newDocument } from '../../src/core/model/types'
import type { Sixteenths } from '../../src/core/units'

const IN = (n: number) => n * 16
const plane: ResolvedPlane = { plane: 'XY', offset: IN(24) as Sixteenths, normal: 1 }
const face = { u0: 0, u1: IN(24), v0: -IN(24), v1: 0 }
const sk = (rects: SketchRect[]): SketchFeature => ({ kind: 'sketch', id: 's', handle: 's1', name: 'S', plane: DEFAULT_PLANE, rects })
const params = new Map([['ply', length(12)]])

describe('resolveSketch', () => {
  it('reference to a later rectangle resolves', () => {
    const r = resolveSketch(
      sk([
        { id: 'a', handle: 'r1', u: { min: 'r2.right + 1', size: 4 }, v: { min: 0, max: 4 } },
        rectFromCorners('b', 'r2', 0, 0, IN(10), IN(4)),
      ]),
      plane,
      { params, face },
    )
    expect(r.errors.size).toBe(0)
    expect(r.rects.get('a')).toMatchObject({ u0: IN(11), u1: IN(11) + 4 })
  })
  it('cycle names both rectangles', () => {
    const r = resolveSketch(
      sk([
        { id: 'a', handle: 'r1', u: { min: 'r2.right', size: 4 }, v: { min: 0, max: 4 } },
        { id: 'b', handle: 'r2', u: { max: 'r1.left + 4', size: 4 }, v: { min: 0, max: 4 } },
      ]),
      plane,
      { params, face },
    )
    expect(r.errors.get('a')).toMatch(/Circular reference between r1, r2/)
    expect(r.errors.get('b')).toMatch(/Circular/)
  })
  it('inset follows the face', () => {
    const s = sk([{ id: 'a', handle: 'r1', u: { min: 'face.left + 2', max: 'face.right - 2' }, v: { min: 'face.bottom + 2', max: 'face.top - 2' } }])
    const a = resolveSketch(s, plane, { params, face })
    expect(a.rects.get('a')).toMatchObject({ u0: IN(2), u1: IN(22), v0: -IN(22), v1: -IN(2) })
    const b = resolveSketch(s, plane, { params, face: { ...face, u1: IN(30) } })
    expect(b.rects.get('a')!.u1 - b.rects.get('a')!.u0).toBe(IN(26))
  })
  it('parameter change', () => {
    const s = sk([{ id: 'a', handle: 'r1', u: { min: 0, size: 'ply' }, v: { min: 0, max: 4 } }])
    expect(resolveSketch(s, plane, { params, face }).rects.get('a')!.u1).toBe(12)
    expect(resolveSketch(s, plane, { params: new Map([['ply', length(8)]]), face }).rects.get('a')!.u1).toBe(8)
  })
  it('unknown name, self reference, no face, wrong axis, bad size', () => {
    const r = resolveSketch(
      sk([
        { id: 'a', handle: 'r1', u: { min: 'r9.left + 1', size: 4 }, v: { min: 0, max: 4 } },
        { id: 'b', handle: 'r2', u: { min: 'r2.right', size: 4 }, v: { min: 0, max: 4 } },
        { id: 'c', handle: 'r3', u: { min: 'face.left', size: 4 }, v: { min: 0, max: 4 } },
        { id: 'd', handle: 'r4', u: { min: 'r5.top', size: 4 }, v: { min: 0, max: 4 } },
        rectFromCorners('e', 'r5', 0, 0, 4, 4),
        { id: 'f', handle: 'r6', u: { min: 0, size: 'r5.left' }, v: { min: 0, max: 4 } },
        { id: 'g', handle: 'r7', u: { min: 10, max: 4 }, v: { min: 0, max: 4 } },
        { id: 'h', handle: 'r8', u: { min: 'r7.left', size: 4 }, v: { min: 0, max: 4 } },
      ]),
      plane,
      { params, noFaceReason: 'S is on a principal plane and has no face' },
    )
    expect(r.errors.get('a')).toMatch(/Unknown name r9/)
    expect(r.errors.get('b')).toMatch(/cannot reference itself/)
    expect(r.errors.get('c')).toMatch(/no face/)
    expect(r.errors.get('d')).toMatch(/Y position.*X axis/)
    expect(r.errors.get('f')).toMatch(/position.*length/)
    expect(r.errors.get('g')).toMatch(/Width must be greater than zero/)
    expect(r.errors.get('h')).toMatch(/r7 failed/)
    expect(r.rects.has('e')).toBe(true)
  })
  it('slot values are reported for display', () => {
    const r = resolveSketch(sk([{ id: 'a', handle: 'r1', u: { min: 'face.left + 2', max: 100 }, v: { min: 0, max: 4 } }]), plane, { params, face })
    expect(r.slotValues.get('a')).toEqual({ u: { min: 32, max: 100 }, v: { min: 0, max: 4 } })
  })
})

describe('evaluate with constraints', () => {
  const cube = (): Document => ({
    ...newDocument('t'),
    params: [{ name: 'ply', value: '3/4' }],
    features: [
      { kind: 'sketch', id: 's1', handle: 's1', name: 'Sketch 1', plane: DEFAULT_PLANE, rects: [rectFromCorners('a', 'r1', 0, 0, IN(24), IN(24))] },
      { kind: 'extrude', id: 'e1', name: 'Extrude 1', sketchId: 's1', rectIds: ['a'], distance: IN(24), op: 'new' },
      {
        kind: 'sketch',
        id: 's2',
        handle: 's2',
        name: 'Sketch 2',
        plane: { kind: 'face', featureId: 'e1', face: 'vMax' },
        rects: [{ id: 'b', handle: 'r1', u: { min: 'face.left + 2', max: 'face.right - 2' }, v: { min: 'face.bottom + 2', max: 'face.top - 2' } }],
      },
      { kind: 'extrude', id: 'e2', name: 'Extrude 2', sketchId: 's2', rectIds: ['b'], distance: '-(ply)', op: 'cut', targetBodyId: 'e1' },
    ],
  })
  it('inset pocket follows the carcass width and the parameter', () => {
    const a = evaluate(cube())
    expect(a.errors).toEqual([])
    expect(bodyVolume(a.bodies.get('e1')!)).toBe(IN(24) ** 3 - IN(20) * IN(20) * 12)
    const wider = cube()
    const s1 = wider.features[0] as SketchFeature
    const doc2: Document = {
      ...wider,
      params: [{ name: 'ply', value: '1/2' }],
      features: [{ ...s1, rects: [rectFromCorners('a', 'r1', 0, 0, IN(30), IN(24))] }, ...wider.features.slice(1)],
    }
    const b = evaluate(doc2)
    expect(b.errors).toEqual([])
    expect(bodyVolume(b.bodies.get('e1')!)).toBe(IN(30) * IN(24) * IN(24) - IN(26) * IN(20) * 8)
  })
  it('extrude blocked by a failed rectangle names it', () => {
    const doc = cube()
    const r = evaluate({ ...doc, params: [] })
    expect(r.results.get('e2')).toMatchObject({ kind: 'error', message: /Distance: Unknown name ply/ })
    const doc2: Document = {
      ...doc,
      features: doc.features.map((f) => (f.id === 's2' && f.kind === 'sketch' ? { ...f, rects: [{ ...f.rects[0]!, u: { min: 'nope', max: 4 } }] } : f)),
    }
    const r2 = evaluate(doc2)
    expect(r2.results.get('e2')).toMatchObject({ kind: 'error', message: /r1 in Sketch 2 failed: Unknown name nope/ })
    expect(r2.errors.map((e) => e.featureId)).toEqual(['s2', 'e2'])
  })
  it('plane offset and distance by parameter; a rectangle reference in a distance is unknown', () => {
    const doc: Document = {
      ...newDocument('t'),
      params: [{ name: 'ply', value: 12 as never }],
      features: [
        { kind: 'sketch', id: 's1', handle: 's1', name: 'S', plane: { ...DEFAULT_PLANE, offset: 'ply * 2' }, rects: [rectFromCorners('a', 'r1', 0, 0, 16, 16)] },
        { kind: 'extrude', id: 'e1', name: 'E', sketchId: 's1', rectIds: ['a'], distance: 'ply', op: 'new' },
        { kind: 'extrude', id: 'e2', name: 'E2', sketchId: 's1', rectIds: ['a'], distance: 'r1.width', op: 'new' },
      ],
    }
    const r = evaluate(doc)
    // offset ply * 2 = 1 1/2" along +Y, extrude ply along -Y
    expect(bodyBounds(r.bodies.get('e1')!)).toMatchObject({ y0: 12, y1: 24 })
    expect(r.results.get('e2')).toMatchObject({ kind: 'error', message: /Unknown name r1/ })
  })
})
