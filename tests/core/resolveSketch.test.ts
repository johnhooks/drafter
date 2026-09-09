import { describe, expect, it } from 'vitest'
import { bodyBounds, bodyVolume } from '../../src/core/geom/body'
import { evaluate } from '../../src/core/eval/evaluate'
import { resolveSketch } from '../../src/core/eval/resolveSketch'
import { length } from '../../src/core/expr/evaluate'
import { DEFAULT_PLANE, type Document, type ResolvedPlane, type SketchFeature, type SketchLine, newDocument } from '../../src/core/model/types'
import type { Sixteenths } from '../../src/core/units'
import { hline, rectLines, regionOf, vline } from './fixtures'

const IN = (n: number) => n * 16
const plane: ResolvedPlane = { plane: 'XY', offset: IN(24) as Sixteenths, normal: 1 }
const face = { u0: 0, u1: IN(24), v0: -IN(24), v1: 0 }
const sk = (lines: SketchLine[]): SketchFeature => ({ kind: 'sketch', id: 's', handle: 's1', name: 'S', plane: DEFAULT_PLANE, lines })
const params = new Map([['ply', length(12)]])

describe('resolveSketch', () => {
  it('a rectangle of mutually attached lines resolves', () => {
    const r = resolveSketch(sk(rectLines('a', 1, IN(2), IN(10), IN(4), IN(20))), plane, { params, face })
    expect(r.errors.size).toBe(0)
    expect(r.lines.get('a_l')).toMatchObject({ dir: 'v', at: IN(2), min: IN(4), max: IN(20), size: IN(16) })
    expect(r.lines.get('a_t')).toMatchObject({ dir: 'h', at: IN(20), min: IN(2), max: IN(10) })
    expect(r.slotValues.get('a_b')).toEqual({ at: IN(4), min: IN(2), max: IN(10) })
  })
  it('reference to a later line resolves', () => {
    const r = resolveSketch(sk([{ id: 'a', handle: 'l1', dir: 'v', at: 'l2.at + 1', run: { min: 0, max: 4 } }, vline('b', 'l2', IN(10), 0, 4)]), plane, { params, face })
    expect(r.errors.size).toBe(0)
    expect(r.lines.get('a')!.at).toBe(IN(10) + 16)
  })
  it('a cycle between two positions names both lines', () => {
    const r = resolveSketch(
      sk([
        { id: 'a', handle: 'l1', dir: 'v', at: 'l2.at', run: { min: 0, max: 4 } },
        { id: 'b', handle: 'l2', dir: 'v', at: 'l1.at + 4', run: { min: 0, max: 4 } },
      ]),
      plane,
      { params, face },
    )
    expect(r.errors.get('a')).toMatch(/Circular reference between l1, l2/)
    expect(r.errors.get('b')).toMatch(/Circular/)
  })
  it('inset follows the face', () => {
    const s = sk([
      { id: 'a', handle: 'l1', dir: 'v', at: 'face.left + 2', run: { min: 'l2.at', max: 'l4.at' } },
      { id: 'b', handle: 'l2', dir: 'h', at: 'face.bottom + 2', run: { min: 'l1.at', max: 'l3.at' } },
      { id: 'c', handle: 'l3', dir: 'v', at: 'face.right - 2', run: { min: 'l2.at', max: 'l4.at' } },
      { id: 'd', handle: 'l4', dir: 'h', at: 'face.top - 2', run: { min: 'l1.at', max: 'l3.at' } },
    ])
    const a = resolveSketch(s, plane, { params, face })
    expect(a.errors.size).toBe(0)
    expect(a.lines.get('b')).toMatchObject({ at: -IN(22), min: IN(2), max: IN(22) })
    const b = resolveSketch(s, plane, { params, face: { ...face, u1: IN(30) } })
    expect(b.lines.get('b')!.size).toBe(IN(26))
  })
  it('parameter change', () => {
    const s = sk([{ id: 'a', handle: 'l1', dir: 'h', at: 0, run: { min: 0, size: 'ply' } }])
    expect(resolveSketch(s, plane, { params, face }).lines.get('a')!.max).toBe(12)
    expect(resolveSketch(s, plane, { params: new Map([['ply', length(8)]]), face }).lines.get('a')!.max).toBe(8)
  })
  it('unknown name, wrong property, no face, wrong axis, bad size, failed dependency', () => {
    const r = resolveSketch(
      sk([
        { id: 'a', handle: 'l1', dir: 'v', at: 'l99.at + 1', run: { min: 0, max: 4 } },
        vline('b', 'l2', 0, 0, 4),
        { id: 'c', handle: 'l3', dir: 'v', at: 'l2.left', run: { min: 0, max: 4 } },
        { id: 'd', handle: 'l4', dir: 'v', at: 'face.left', run: { min: 0, max: 4 } },
        hline('e', 'l5', 0, 0, 4),
        { id: 'f', handle: 'l6', dir: 'v', at: 'l5.at', run: { min: 0, max: 4 } },
        { id: 'g', handle: 'l7', dir: 'v', at: 0, run: { min: 0, size: 'l5.at' } },
        { id: 'h', handle: 'l8', dir: 'v', at: 0, run: { min: 10, max: 4 } },
        { id: 'i', handle: 'l9', dir: 'v', at: 'l8.at', run: { min: 'l1.at', max: 4 } },
      ]),
      plane,
      { params, noFaceReason: 'S is on a principal plane and has no face' },
    )
    expect(r.errors.get('a')).toMatch(/Unknown name l99/)
    expect(r.errors.get('c')).toMatch(/l2 is a vertical line and has bottom, top, mid, length, at; it has no left/)
    expect(r.errors.get('d')).toMatch(/no face/)
    expect(r.errors.get('f')).toMatch(/Y position.*X axis/)
    expect(r.errors.get('g')).toMatch(/position.*length/)
    expect(r.errors.get('h')).toMatch(/Length must be greater than zero/)
    // l9's position is fine (l8's position resolved) but its run depends on l1, which failed
    expect(r.errors.get('i')).toMatch(/l1 failed/)
    expect(r.lines.has('b')).toBe(true)
    expect(r.lines.has('e')).toBe(true)
  })
})

describe('evaluate with constraints', () => {
  const cube = (): Document => ({
    ...newDocument('t'),
    params: [{ name: 'ply', value: '3/4' }],
    features: [
      { kind: 'sketch', id: 's1', handle: 's1', name: 'Sketch 1', plane: DEFAULT_PLANE, lines: rectLines('a', 1, 0, IN(24), 0, IN(24)) },
      { kind: 'extrude', id: 'e1', name: 'Extrude 1', sketchId: 's1', regions: [regionOf('a')], distance: IN(24), op: 'new' },
      {
        kind: 'sketch',
        id: 's2',
        handle: 's2',
        name: 'Sketch 2',
        plane: { kind: 'face', featureId: 'e1', region: regionOf('a'), face: 'side', lineId: 'a_t', outward: 1 },
        lines: [
          { id: 'b_l', handle: 'l1', dir: 'v', at: 'face.left + 2', run: { min: 'l2.at', max: 'l4.at' } },
          { id: 'b_b', handle: 'l2', dir: 'h', at: 'face.bottom + 2', run: { min: 'l1.at', max: 'l3.at' } },
          { id: 'b_r', handle: 'l3', dir: 'v', at: 'face.right - 2', run: { min: 'l2.at', max: 'l4.at' } },
          { id: 'b_t', handle: 'l4', dir: 'h', at: 'face.top - 2', run: { min: 'l1.at', max: 'l3.at' } },
        ],
      },
      { kind: 'extrude', id: 'e2', name: 'Extrude 2', sketchId: 's2', regions: [{ vertical: 'b_l', horizontal: 'b_b' }], distance: '-(ply)', op: 'cut', targetBodyId: 'e1' },
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
      features: [{ ...s1, lines: rectLines('a', 1, 0, IN(30), 0, IN(24)) }, ...wider.features.slice(1)],
    }
    const b = evaluate(doc2)
    expect(b.errors).toEqual([])
    expect(bodyVolume(b.bodies.get('e1')!)).toBe(IN(30) * IN(24) * IN(24) - IN(26) * IN(20) * 8)
  })
  it('extrude blocked by a failed line names it', () => {
    const doc = cube()
    const r = evaluate({ ...doc, params: [] })
    expect(r.results.get('e2')).toMatchObject({ kind: 'error', message: /Distance: Unknown name ply/ })
    const doc2: Document = {
      ...doc,
      features: doc.features.map((f) => (f.id === 's2' && f.kind === 'sketch' ? { ...f, lines: f.lines.map((l) => (l.id === 'b_l' ? { ...l, at: 'nope' } : l)) } : f)),
    }
    const r2 = evaluate(doc2)
    expect(r2.results.get('e2')).toMatchObject({ kind: 'error', message: /l1 in Sketch 2 failed: Unknown name nope/ })
    // the two lines attached to l1 fail with it, so the sketch reports three line errors
    expect([...new Set(r2.errors.map((e) => e.featureId))]).toEqual(['s2', 'e2'])
    expect(r2.errors.filter((e) => e.featureId === 's2').map((e) => e.message)).toEqual(['l1: Unknown name nope', 'l2: l1 failed', 'l4: l1 failed'])
  })
  it('plane offset and distance by parameter; a line reference in a distance is unknown', () => {
    const doc: Document = {
      ...newDocument('t'),
      params: [{ name: 'ply', value: 12 as never }],
      features: [
        { kind: 'sketch', id: 's1', handle: 's1', name: 'S', plane: { ...DEFAULT_PLANE, offset: 'ply * 2' }, lines: rectLines('a', 1, 0, 16, 0, 16) },
        { kind: 'extrude', id: 'e1', name: 'E', sketchId: 's1', regions: [regionOf('a')], distance: 'ply', op: 'new' },
        { kind: 'extrude', id: 'e2', name: 'E2', sketchId: 's1', regions: [regionOf('a')], distance: 'l1.length', op: 'new' },
      ],
    }
    const r = evaluate(doc)
    // offset ply * 2 = 1 1/2" along +Y, extrude ply along -Y
    expect(bodyBounds(r.bodies.get('e1')!)).toMatchObject({ y0: 12, y1: 24 })
    expect(r.results.get('e2')).toMatchObject({ kind: 'error', message: /Unknown name l1/ })
  })
})
