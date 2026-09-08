import { describe, expect, it } from 'vitest'
import { bodyVolume } from '../../src/core/geom/body'
import { evaluate } from '../../src/core/eval/evaluate'
import { parseDocument, serializeDocument } from '../../src/core/model/document'

const v1 = {
  version: 1,
  title: 'old',
  features: [
    { kind: 'sketch', id: 's1', name: 'Sketch 1', plane: { kind: 'principal', plane: 'XZ', offset: 0, normal: -1 }, rects: [{ id: 'a', u1: 384, v1: 384, u2: 0, v2: 0 }] },
    { kind: 'extrude', id: 'e1', name: 'Extrude 1', sketchId: 's1', rectIds: ['a'], distance: 384, op: 'new' },
    { kind: 'sketch', id: 's2', name: 'Sketch 2', plane: { kind: 'face', featureId: 'e1', face: 'vMax' }, rects: [{ id: 'b', u1: 160, v1: -224, u2: 224, v2: -160 }] },
    { kind: 'extrude', id: 'e2', name: 'Extrude 2', sketchId: 's2', rectIds: ['b'], distance: -32, op: 'cut', targetBodyId: 'e1' },
  ],
}

describe('migration', () => {
  it('version 1 loads as version 2 with handles and identical geometry', () => {
    const r = parseDocument(JSON.stringify(v1))
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.doc.version).toBe(2)
    expect(r.doc.params).toEqual([])
    const s1 = r.doc.features[0]!
    expect(s1).toMatchObject({ handle: 's1', rects: [{ id: 'a', handle: 'r1', u: { min: 0, max: 384 }, v: { min: 0, max: 384 } }] })
    expect(r.doc.features[2]).toMatchObject({ handle: 's2', rects: [{ handle: 'r1' }] })
    const ev = evaluate(r.doc)
    expect(ev.errors).toEqual([])
    expect(bodyVolume(ev.bodies.get('e1')!)).toBe(384 ** 3 - 64 * 64 * 32)
    // saved as version 2 and round trips
    const again = parseDocument(serializeDocument(r.doc))
    expect(again.ok && again.doc).toEqual(r.doc)
  })
  it('rejects other versions', () => {
    expect(parseDocument(JSON.stringify({ ...v1, version: 3 })).ok).toBe(false)
  })
})
