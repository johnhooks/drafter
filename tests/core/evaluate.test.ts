import { describe, expect, it } from 'vitest'
import { bodyBounds, bodyVolume } from '../../src/core/geom/body'
import { box } from '../../src/core/geom/box'
import { evaluate } from '../../src/core/eval/evaluate'
import { dependentsOf } from '../../src/core/model/deps'
import { parseDocument, serializeDocument } from '../../src/core/model/document'
import { defaultOp } from '../../src/core/model/extrude'
import { nextName } from '../../src/core/model/names'
import { DEFAULT_PLANE, type Document, type ExtrudeFeature, type SketchFeature, newDocument } from '../../src/core/model/types'
import { validateDocument } from '../../src/core/model/validate'
import { sx } from '../../src/core/units'

const IN = (n: number) => sx(n * 16)

const sketch = (id: string, name: string, plane: SketchFeature['plane'], rects: Array<[string, number, number, number, number]>): SketchFeature => ({
  kind: 'sketch',
  id,
  name,
  plane,
  rects: rects.map(([rid, u1, v1, u2, v2]) => ({ id: rid, u1: IN(u1), v1: IN(v1), u2: IN(u2), v2: IN(v2) })),
})
const extrude = (id: string, name: string, sketchId: string, rectIds: string[], distance: number, op: ExtrudeFeature['op'], targetBodyId?: string): ExtrudeFeature => ({
  kind: 'extrude',
  id,
  name,
  sketchId,
  rectIds,
  distance: IN(distance),
  op,
  targetBodyId,
})

/** A 24" cube from the front plane, then a sketch on its top and a pocket cut. */
function cubeWithPocket(): Document {
  return {
    ...newDocument('t'),
    features: [
      sketch('s1', 'Sketch 1', DEFAULT_PLANE, [['r1', 0, 0, 24, 24]]),
      extrude('e1', 'Extrude 1', 's1', ['r1'], 24, 'new'),
      sketch('s2', 'Sketch 2', { kind: 'face', featureId: 'e1', face: 'vMax' }, [['r2', 10, -14, 14, -10]]),
      extrude('e2', 'Extrude 2', 's2', ['r2'], -2, 'cut', 'e1'),
    ],
  }
}

describe('evaluate', () => {
  it('extrude new creates one body from the union of overlapping rects', () => {
    const doc: Document = {
      ...newDocument('t'),
      features: [
        sketch('s1', 'Sketch 1', DEFAULT_PLANE, [
          ['a', 0, 0, 24, 24],
          ['b', 12, 0, 36, 24],
        ]),
        extrude('e1', 'Extrude 1', 's1', ['a', 'b'], 24, 'new'),
      ],
    }
    const r = evaluate(doc)
    expect(r.errors).toEqual([])
    expect(r.bodies.size).toBe(1)
    expect(bodyVolume(r.bodies.get('e1')!)).toBe(IN(36) * IN(24) * IN(24))
    expect(r.bodies.get('e1')!.name).toBe('Extrude 1')
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
  })

  it('dado cut across the top reduces volume by 4 1/2 cubic inches', () => {
    const doc = cubeWithPocket()
    const s2 = sketch('s2', 'Sketch 2', { kind: 'face', featureId: 'e1', face: 'vMax' }, [['r2', 10, -24, 10.75, 0]])
    const e2 = extrude('e2', 'Extrude 2', 's2', ['r2'], -0.25, 'cut', 'e1')
    const r = evaluate({ ...doc, features: [doc.features[0]!, doc.features[1]!, s2, e2] })
    expect(r.errors).toEqual([])
    expect(IN(24) ** 3 - bodyVolume(r.bodies.get('e1')!)).toBe(4.5 * 16 ** 3)
  })

  it('join adds a shelf and grows the bounds', () => {
    const doc = cubeWithPocket()
    const s2 = sketch('s2', 'Sketch 2', { kind: 'face', featureId: 'e1', face: 'uMax' }, [['r2', -20, 4, -4, 8]])
    const e2 = extrude('e2', 'Extrude 2', 's2', ['r2'], 12, 'join', 'e1')
    const r = evaluate({ ...doc, features: [doc.features[0]!, doc.features[1]!, s2, e2] })
    expect(r.errors).toEqual([])
    expect(bodyBounds(r.bodies.get('e1')!)).toEqual(box(0, IN(36), -IN(24), 0, 0, IN(24)))
  })

  it('upstream edit propagates: cap sketch follows the extrude distance', () => {
    const doc: Document = {
      ...newDocument('t'),
      features: [
        sketch('s1', 'Sketch 1', DEFAULT_PLANE, [['r1', 0, 0, 24, 24]]),
        extrude('e1', 'Extrude 1', 's1', ['r1'], 24, 'new'),
        sketch('s2', 'Sketch 2', { kind: 'face', featureId: 'e1', face: 'cap' }, [['r2', 4, 4, 8, 8]]),
        extrude('e2', 'Extrude 2', 's2', ['r2'], 2, 'join', 'e1'),
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

  it('missing target body errors in isolation', () => {
    const doc: Document = {
      ...newDocument('t'),
      features: [
        sketch('s1', 'Sketch 1', DEFAULT_PLANE, [
          ['r1', 0, 0, 24, 24],
          ['r2', 30, 0, 40, 10],
        ]),
        extrude('e1', 'Extrude 1', 's1', ['r1'], 24, 'cut', 'nope'),
        extrude('e2', 'Extrude 2', 's1', ['r2'], 24, 'new'),
      ],
    }
    const r = evaluate(doc)
    expect(r.errors).toHaveLength(1)
    expect(r.errors[0]!.featureId).toBe('e1')
    expect(r.bodies.size).toBe(1)
    expect(r.bodies.has('e2')).toBe(true)
  })

  it('dependents of a failed feature are marked as depending on it', () => {
    const doc: Document = {
      ...newDocument('t'),
      features: [
        sketch('s1', 'Sketch 1', DEFAULT_PLANE, [['r1', 0, 0, 24, 24]]),
        extrude('e1', 'Extrude 1', 's1', ['r1'], 24, 'cut', 'nope'),
        sketch('s2', 'Sketch 2', { kind: 'face', featureId: 'e1', face: 'cap' }, [['r2', 4, 4, 8, 8]]),
        extrude('e2', 'Extrude 2', 's2', ['r2'], 2, 'join', 'e1'),
      ],
    }
    const r = evaluate(doc)
    expect(r.results.get('s2')).toMatchObject({ kind: 'error', dependsOn: 'e1' })
    expect(r.results.get('e2')).toMatchObject({ kind: 'error', dependsOn: 's2' })
  })

  it('face removed by a later cut errors the sketch that references it', () => {
    const doc = cubeWithPocket()
    // cut away the whole top 2" so the vMax face at z = 24 no longer exists
    const s3 = sketch('s3', 'Sketch 3', DEFAULT_PLANE, [['r3', -1, 22, 25, 30]])
    const e3 = extrude('e3', 'Extrude 3', 's3', ['r3'], 30, 'cut', 'e1')
    const s4 = sketch('s4', 'Sketch 4', { kind: 'face', featureId: 'e1', face: 'vMax' }, [['r4', 1, -3, 3, -1]])
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
    expect(defaultOp(sketch('s', 'S', { kind: 'face', featureId: 'e1', face: 'cap' }, []))).toBe('join')
  })
  it('auto naming', () => {
    const doc = cubeWithPocket()
    expect(nextName(doc, 'sketch')).toBe('Sketch 3')
    expect(nextName(doc, 'extrude')).toBe('Extrude 3')
    expect(nextName(newDocument(), 'sketch')).toBe('Sketch 1')
  })
  it('delete cascade lists the extrude, the face sketch on it, and that sketch\'s extrude', () => {
    expect(dependentsOf(cubeWithPocket(), 'e1')).toEqual(['e1', 's2', 'e2'])
    expect(dependentsOf(cubeWithPocket(), 's2')).toEqual(['s2', 'e2'])
    expect(dependentsOf(cubeWithPocket(), 'e2')).toEqual(['e2'])
  })
})

describe('document format', () => {
  it('round trips', () => {
    const doc = cubeWithPocket()
    const parsed = parseDocument(serializeDocument(doc))
    expect(parsed.ok).toBe(true)
    if (parsed.ok) {
      expect(parsed.doc).toEqual(doc)
      expect(bodyVolume(evaluate(parsed.doc).bodies.get('e1')!)).toBe(bodyVolume(evaluate(doc).bodies.get('e1')!))
    }
  })
  it('rejects a dangling sketch reference', () => {
    const doc = cubeWithPocket()
    const bad = { ...doc, features: doc.features.filter((f) => f.id !== 's2') }
    const parsed = parseDocument(JSON.stringify(bad))
    expect(parsed.ok).toBe(false)
    if (!parsed.ok) expect(parsed.errors.some((e) => e.path.includes('sketchId'))).toBe(true)
  })
  it('validation flags zero width, zero distance, missing rects, missing target', () => {
    const errs = validateDocument({
      version: 1,
      title: 't',
      features: [
        { kind: 'sketch', id: 's', name: 'S', plane: DEFAULT_PLANE, rects: [{ id: 'r', u1: 0, v1: 0, u2: 0, v2: 10 }] },
        { kind: 'extrude', id: 'e', name: 'E', sketchId: 's', rectIds: [], distance: 0, op: 'cut' },
      ],
    })
    expect(errs.map((e) => e.path).sort()).toEqual(
      ['features[0].rects[0]', 'features[1].distance', 'features[1].rectIds', 'features[1].targetBodyId'].sort(),
    )
  })
  it('rejects non-JSON and non-object', () => {
    expect(parseDocument('{').ok).toBe(false)
    expect(parseDocument('42').ok).toBe(false)
  })
})
