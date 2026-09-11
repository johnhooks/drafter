import { describe, expect, it } from 'vitest'
import { bodyBounds, bodyVolume } from '../../src/core/geom/body'
import { box } from '../../src/core/geom/box'
import { evaluate } from '../../src/core/eval/evaluate'
import { dependentsOf } from '../../src/core/model/deps'
import { parseDocument, serializeDocument } from '../../src/core/model/document'
import { defaultOp } from '../../src/core/model/extrude'
import { nextName } from '../../src/core/model/names'
import { DEFAULT_PLANE, DEFAULT_VIEW, type Document, type ExtrudeFeature, type RegionRef, type SketchFeature, type SketchLine, newDocument } from '../../src/core/model/types'
import { validateDocument } from '../../src/core/model/validate'
import { sx } from '../../src/core/units'
import { rectLines, regionOf, vline } from './fixtures'

const IN = (n: number) => sx(n * 16)

/** A sketch of rectangles given as [prefix, u1, v1, u2, v2] in inches; line handles run on from each other. */
const sketch = (id: string, name: string, plane: SketchFeature['plane'], rects: Array<[string, number, number, number, number]>, extra: SketchLine[] = []): SketchFeature => ({
  kind: 'sketch', rects: [],
  id,
  handle: id,
  name,
  plane,
  lines: [...rects.flatMap(([p, u1, v1, u2, v2], i) => rectLines(p, i * 4 + 1, IN(u1), IN(u2), IN(v1), IN(v2))), ...extra],
})
const extrude = (id: string, name: string, sketchId: string, regions: RegionRef[], distance: number, op: ExtrudeFeature['op'], targetBodyId?: string): ExtrudeFeature => ({
  kind: 'extrude',
  id,
  name,
  sketchId,
  regions,
  distance: IN(distance),
  op,
  targetBodyId,
})
const top = (featureId: string, p: string): SketchFeature['plane'] => ({ kind: 'face', featureId, region: regionOf(p), face: 'side', lineId: `${p}_t`, outward: 1 })
const right = (featureId: string, p: string): SketchFeature['plane'] => ({ kind: 'face', featureId, region: regionOf(p), face: 'side', lineId: `${p}_r`, outward: 1 })

/** A 24" cube from the front plane, then a sketch on its top and a pocket cut. */
function cubeWithPocket(): Document {
  return {
    ...newDocument('t'),
    features: [
      sketch('s1', 'Sketch 1', DEFAULT_PLANE, [['r1', 0, 0, 24, 24]]),
      extrude('e1', 'Extrude 1', 's1', [regionOf('r1')], 24, 'new'),
      sketch('s2', 'Sketch 2', top('e1', 'r1'), [['r2', 10, -14, 14, -10]]),
      extrude('e2', 'Extrude 2', 's2', [regionOf('r2')], -2, 'cut', 'e1'),
    ],
  }
}

describe('evaluate', () => {
  it('extrude new creates one body from adjacent regions', () => {
    const doc: Document = {
      ...newDocument('t'),
      features: [
        sketch('s1', 'Sketch 1', DEFAULT_PLANE, [
          ['a', 0, 0, 24, 24],
          ['b', 24, 0, 36, 24],
        ]),
        extrude('e1', 'Extrude 1', 's1', [regionOf('a'), regionOf('b')], 24, 'new'),
      ],
    }
    const r = evaluate(doc)
    expect(r.errors).toEqual([])
    expect(r.bodies.size).toBe(1)
    expect(bodyVolume(r.bodies.get('e1')!)).toBe(IN(36) * IN(24) * IN(24))
    expect(r.bodies.get('e1')!.name).toBe('Extrude 1')
  })

  it('a split rectangle extrudes as two regions, together or apart', () => {
    const s = sketch('s1', 'Sketch 1', DEFAULT_PLANE, [['a', 0, 0, 24, 16]], [vline('m', 'l5', IN(10), 0, IN(16))])
    const sr = evaluate({ ...newDocument('t'), features: [s] }).results.get('s1')
    expect(sr?.kind === 'sketch' && sr.regions.map((x) => x.ref)).toEqual([regionOf('a'), { vertical: 'm', horizontal: 'a_b' }])
    const apart: Document = {
      ...newDocument('t'),
      features: [s, extrude('e1', 'Left', 's1', [regionOf('a')], 12, 'new'), extrude('e2', 'Right', 's1', [{ vertical: 'm', horizontal: 'a_b' }], 24, 'new')],
    }
    const r = evaluate(apart)
    expect(r.errors).toEqual([])
    expect(bodyBounds(r.bodies.get('e1')!)).toEqual(box(0, IN(10), -IN(12), 0, 0, IN(16)))
    expect(bodyBounds(r.bodies.get('e2')!)).toEqual(box(IN(10), IN(24), -IN(24), 0, 0, IN(16)))
    const together = evaluate({ ...newDocument('t'), features: [s, extrude('e1', 'Both', 's1', [regionOf('a'), { vertical: 'm', horizontal: 'a_b' }], 12, 'new')] })
    expect(together.bodies.size).toBe(1)
    expect(bodyVolume(together.bodies.get('e1')!)).toBe(IN(24) * IN(16) * IN(12))
  })

  it('an L region extrudes to one body of the L area', () => {
    const s: SketchFeature = {
      kind: 'sketch', rects: [],
      id: 's1',
      handle: 's1',
      name: 'S',
      plane: DEFAULT_PLANE,
      lines: [
        vline('a', 'l1', 0, 0, IN(24)),
        { id: 'b', handle: 'l2', dir: 'h', at: 0, run: { min: 0, max: IN(24) } },
        vline('c', 'l3', IN(24), 0, IN(12)),
        { id: 'd', handle: 'l4', dir: 'h', at: IN(12), run: { min: IN(12), max: IN(24) } },
        vline('e', 'l5', IN(12), IN(12), IN(24)),
        { id: 'f', handle: 'l6', dir: 'h', at: IN(24), run: { min: 0, max: IN(12) } },
      ],
    }
    const r = evaluate({ ...newDocument('t'), features: [s, extrude('e1', 'E', 's1', [{ vertical: 'a', horizontal: 'b' }], 1, 'new')] })
    expect(r.errors).toEqual([])
    expect(r.bodies.size).toBe(1)
    expect(bodyVolume(r.bodies.get('e1')!)).toBe((IN(24) * IN(24) - IN(12) * IN(12)) * 16)
  })

  it('sequential dependency: cube, sketch on top face, pocket cut', () => {
    const r = evaluate(cubeWithPocket())
    expect(r.errors).toEqual([])
    const body = r.bodies.get('e1')!
    expect(bodyVolume(body)).toBe(IN(24) ** 3 - IN(4) * IN(4) * IN(2))
    expect(bodyBounds(body)).toEqual(box(0, IN(24), -IN(24), 0, 0, IN(24)))
    const s2 = r.results.get('s2')!
    expect(s2.kind === 'sketch' && s2.plane).toEqual({ plane: 'XY', offset: IN(24), normal: 1 })
    expect(s2.kind === 'sketch' && s2.coplanarFaces.length).toBe(1)
    expect(s2.kind === 'sketch' && s2.face).toEqual({ u0: 0, u1: IN(24), v0: -IN(24), v1: 0 })
  })

  it('dado cut across the top reduces volume by 4 1/2 cubic inches', () => {
    const doc = cubeWithPocket()
    const s2 = sketch('s2', 'Sketch 2', top('e1', 'r1'), [['r2', 10, -24, 10.75, 0]])
    const e2 = extrude('e2', 'Extrude 2', 's2', [regionOf('r2')], -0.25, 'cut', 'e1')
    const r = evaluate({ ...doc, features: [doc.features[0]!, doc.features[1]!, s2, e2] })
    expect(r.errors).toEqual([])
    expect(IN(24) ** 3 - bodyVolume(r.bodies.get('e1')!)).toBe(4.5 * 16 ** 3)
  })

  it('join adds a shelf and grows the bounds', () => {
    const doc = cubeWithPocket()
    const s2 = sketch('s2', 'Sketch 2', right('e1', 'r1'), [['r2', -20, 4, -4, 8]])
    const e2 = extrude('e2', 'Extrude 2', 's2', [regionOf('r2')], 12, 'join', 'e1')
    const r = evaluate({ ...doc, features: [doc.features[0]!, doc.features[1]!, s2, e2] })
    expect(r.errors).toEqual([])
    expect(bodyBounds(r.bodies.get('e1')!)).toEqual(box(0, IN(36), -IN(24), 0, 0, IN(24)))
  })

  it('upstream edit propagates: cap sketch follows the extrude distance', () => {
    const doc: Document = {
      ...newDocument('t'),
      features: [
        sketch('s1', 'Sketch 1', DEFAULT_PLANE, [['r1', 0, 0, 24, 24]]),
        extrude('e1', 'Extrude 1', 's1', [regionOf('r1')], 24, 'new'),
        sketch('s2', 'Sketch 2', { kind: 'face', featureId: 'e1', region: regionOf('r1'), face: 'cap' }, [['r2', 4, 4, 8, 8]]),
        extrude('e2', 'Extrude 2', 's2', [regionOf('r2')], 2, 'join', 'e1'),
      ],
    }
    const a = evaluate(doc)
    expect(a.results.get('s2')).toMatchObject({ plane: { plane: 'XZ', offset: -IN(24), normal: -1 } })
    expect(bodyBounds(a.bodies.get('e1')!)!.y0).toBe(-IN(26))
    const edited = { ...doc, features: doc.features.map((f) => (f.id === 'e1' ? { ...f, distance: IN(30) } : f)) }
    const b = evaluate(edited)
    expect(b.results.get('s2')).toMatchObject({ plane: { plane: 'XZ', offset: -IN(30), normal: -1 } })
    expect(bodyBounds(b.bodies.get('e1')!)!.y0).toBe(-IN(32))
  })

  it('a side face reference fails when its line no longer bounds the region on that side', () => {
    const doc = cubeWithPocket()
    // move the top line down past the middle: still a rectangle, still bounded by a_t on top, so it resolves
    const s1 = doc.features[0] as SketchFeature
    const lower = { ...doc, features: [{ ...s1, lines: s1.lines.map((l) => (l.id === 'r1_t' ? { ...l, at: IN(12) } : l)) }, ...doc.features.slice(1)] }
    expect(evaluate(lower).results.get('s2')).toMatchObject({ plane: { plane: 'XY', offset: IN(12) } })
    // a second horizontal line across the rectangle takes over the boundary of the corner region
    const split = { ...doc, features: [{ ...s1, lines: [...s1.lines, { id: 'mid', handle: 'l9', dir: 'h', at: IN(12), run: { min: 0, max: IN(24) } } as SketchLine] }, ...doc.features.slice(1)] }
    const r = evaluate(split)
    expect(r.results.get('s2')).toMatchObject({ kind: 'error', message: /l4 no longer bounds the region/ })
  })

  it('missing target body errors in isolation', () => {
    const doc: Document = {
      ...newDocument('t'),
      features: [
        sketch('s1', 'Sketch 1', DEFAULT_PLANE, [
          ['r1', 0, 0, 24, 24],
          ['r2', 30, 0, 40, 10],
        ]),
        extrude('e1', 'Extrude 1', 's1', [regionOf('r1')], 24, 'cut', 'nope'),
        extrude('e2', 'Extrude 2', 's1', [regionOf('r2')], 24, 'new'),
      ],
    }
    const r = evaluate(doc)
    expect(r.errors).toHaveLength(1)
    expect(r.errors[0]!.featureId).toBe('e1')
    expect(r.bodies.size).toBe(1)
    expect(r.bodies.has('e2')).toBe(true)
  })

  it('region errors: opened loop, deleted corner line, no regions', () => {
    const doc = cubeWithPocket()
    const s1 = doc.features[0] as SketchFeature
    const opened = evaluate({ ...doc, features: [{ ...s1, lines: s1.lines.filter((l) => l.id !== 'r1_t') }, ...doc.features.slice(1)] })
    expect(opened.results.get('e1')).toMatchObject({ kind: 'error', message: /No region is enclosed at the corner of l1 and l2 in Sketch 1/ })
    const deleted = evaluate({ ...doc, features: [{ ...s1, lines: s1.lines.filter((l) => l.id !== 'r1_l') }, ...doc.features.slice(1)] })
    expect(deleted.results.get('e1')).toMatchObject({ kind: 'error', message: /A line bounding the region was deleted from Sketch 1/ })
    const none = evaluate({ ...doc, features: [s1, { ...(doc.features[1] as ExtrudeFeature), regions: [] }] })
    expect(none.results.get('e1')).toMatchObject({ kind: 'error', message: /no regions/ })
  })

  it('dependents of a failed feature are marked as depending on it', () => {
    const doc: Document = {
      ...newDocument('t'),
      features: [
        sketch('s1', 'Sketch 1', DEFAULT_PLANE, [['r1', 0, 0, 24, 24]]),
        extrude('e1', 'Extrude 1', 's1', [regionOf('r1')], 24, 'cut', 'nope'),
        sketch('s2', 'Sketch 2', { kind: 'face', featureId: 'e1', region: regionOf('r1'), face: 'cap' }, [['r2', 4, 4, 8, 8]]),
        extrude('e2', 'Extrude 2', 's2', [regionOf('r2')], 2, 'join', 'e1'),
      ],
    }
    const r = evaluate(doc)
    expect(r.results.get('s2')).toMatchObject({ kind: 'error', dependsOn: 'e1' })
    expect(r.results.get('e2')).toMatchObject({ kind: 'error', dependsOn: 's2' })
  })

  it('face removed by a later cut errors the sketch that references it', () => {
    const doc = cubeWithPocket()
    // cut away the whole top 2" so the top face at z = 24 no longer exists
    const s3 = sketch('s3', 'Sketch 3', DEFAULT_PLANE, [['r3', -1, 22, 25, 30]])
    const e3 = extrude('e3', 'Extrude 3', 's3', [regionOf('r3')], 30, 'cut', 'e1')
    const s4 = sketch('s4', 'Sketch 4', top('e1', 'r1'), [['r4', 1, -3, 3, -1]])
    const r = evaluate({ ...doc, features: [...doc.features, s3, e3, s4] })
    expect(r.results.get('s4')).toMatchObject({ kind: 'error' })
    expect(r.errors.map((e) => e.featureId)).toEqual(['s4'])
  })

  it('deleted reference errors the sketch', () => {
    const doc = cubeWithPocket()
    const r = evaluate({ ...doc, features: doc.features.filter((f) => f.id !== 'e1') })
    expect(r.results.get('s2')).toMatchObject({ kind: 'error' })
    expect(r.errors[0]!.message).toContain('e1')
  })
})

describe('defaults, names, dependencies', () => {
  it('default op from plane kind', () => {
    expect(defaultOp(sketch('s', 'S', DEFAULT_PLANE, []))).toBe('new')
    expect(defaultOp(sketch('s', 'S', { kind: 'face', featureId: 'e1', region: regionOf('x'), face: 'cap' }, []))).toBe('join')
  })
  it('auto naming', () => {
    const doc = cubeWithPocket()
    expect(nextName(doc, 'sketch')).toBe('Sketch 3')
    expect(nextName(doc, 'extrude')).toBe('Extrude 3')
    expect(nextName(newDocument(), 'sketch')).toBe('Sketch 1')
  })
  it("delete cascade lists the extrude, the face sketch on it, and that sketch's extrude", () => {
    expect(dependentsOf(cubeWithPocket(), 'e1')).toEqual(['e1', 's2', 'e2'])
    expect(dependentsOf(cubeWithPocket(), 's2')).toEqual(['s2', 'e2'])
    expect(dependentsOf(cubeWithPocket(), 'e2')).toEqual(['e2'])
  })
})

describe('document format', () => {
  it('round trips', () => {
    const doc = cubeWithPocket()
    const parsed = parseDocument(serializeDocument({ version: 5, model: doc, view: DEFAULT_VIEW }))
    expect(parsed.ok).toBe(true)
    if (parsed.ok) {
      expect(parsed.file.model).toEqual(doc)
      expect(bodyVolume(evaluate(parsed.file.model).bodies.get('e1')!)).toBe(bodyVolume(evaluate(doc).bodies.get('e1')!))
    }
  })
  it('rejects a dangling sketch reference', () => {
    const doc = cubeWithPocket()
    const bad = { version: 5, model: { ...doc, features: doc.features.filter((f) => f.id !== 's2') }, view: DEFAULT_VIEW }
    const parsed = parseDocument(JSON.stringify(bad))
    expect(parsed.ok).toBe(false)
    if (!parsed.ok) expect(parsed.errors.some((e) => e.path.includes('sketchId'))).toBe(true)
  })
  it('validation flags zero length, three run slots, zero distance, missing regions, a wrong-direction corner; a missing target is left to evaluation', () => {
    const errs = validateDocument({
      title: 't',
      params: [],
      features: [
        {
          kind: 'sketch', rects: [],
          id: 's',
          handle: 's1',
          name: 'S',
          plane: DEFAULT_PLANE,
          lines: [
            { id: 'a', handle: 'l1', dir: 'h', at: 0, run: { min: 0, max: 0 } },
            { id: 'b', handle: 'l2', dir: 'v', at: 0, run: { min: 0, max: 10, size: 10 } },
          ],
        },
        { kind: 'extrude', id: 'e', name: 'E', sketchId: 's', regions: [], distance: 0, op: 'cut' },
        { kind: 'extrude', id: 'e2', name: 'E2', sketchId: 's', regions: [{ vertical: 'a', horizontal: 'b' }], distance: 16, op: 'new' },
      ],
    })
    expect(errs.map((e) => e.path).sort()).toEqual(
      ['features[0].lines[0]', 'features[0].lines[1].run', 'features[1].distance', 'features[1].regions', 'features[2].regions[0].vertical', 'features[2].regions[0].horizontal'].sort(),
    )
  })
  it('rejects non-JSON and non-object', () => {
    expect(parseDocument('{').ok).toBe(false)
    expect(parseDocument('42').ok).toBe(false)
  })
})
