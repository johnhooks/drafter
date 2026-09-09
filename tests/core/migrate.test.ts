import { describe, expect, it } from 'vitest'
import { bodyVolume } from '../../src/core/geom/body'
import { evaluate } from '../../src/core/eval/evaluate'
import { parseDocument, serializeDocument } from '../../src/core/model/document'
import { DEFAULT_VIEW } from '../../src/core/model/types'

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
  it('version 1 loads as version 3 with handles, a default view, and identical geometry', () => {
    const r = parseDocument(JSON.stringify(v1))
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.file.version).toBe(3)
    expect(r.file.view).toEqual(DEFAULT_VIEW)
    expect(r.file.model.params).toEqual([])
    const s1 = r.file.model.features[0]!
    expect(s1).toMatchObject({ handle: 's1', rects: [{ id: 'a', handle: 'r1', u: { min: 0, max: 384 }, v: { min: 0, max: 384 } }] })
    expect(r.file.model.features[2]).toMatchObject({ handle: 's2', rects: [{ handle: 'r1' }] })
    const ev = evaluate(r.file.model)
    expect(ev.errors).toEqual([])
    expect(bodyVolume(ev.bodies.get('e1')!)).toBe(384 ** 3 - 64 * 64 * 32)
    // saved as version 3 and round trips
    const again = parseDocument(serializeDocument(r.file))
    expect(again.ok && again.file).toEqual(r.file)
  })
  it('version 2 loads as version 3 with a default view', () => {
    const v2 = { version: 2, title: 'two', params: [{ name: 'ply', value: 12 }], features: [] }
    const r = parseDocument(JSON.stringify(v2))
    expect(r.ok && r.file).toEqual({ version: 3, model: { title: 'two', params: [{ name: 'ply', value: 12 }], features: [] }, view: DEFAULT_VIEW })
  })
  it('version 3 keeps its view and validates the camera', () => {
    const file = { version: 3, model: { title: 't', params: [], features: [] }, view: { camera: { azimuth: 90, elevation: 0, zoom: 8, center: [16, 0, 0] }, sketchId: 'nope' } }
    const r = parseDocument(JSON.stringify(file))
    expect(r.ok && r.file.view).toEqual(file.view)
    const bad = parseDocument(JSON.stringify({ ...file, view: { camera: { azimuth: 'x', elevation: 0, zoom: 0, center: [0, 0] } } }))
    expect(bad.ok).toBe(false)
    if (!bad.ok) expect(bad.errors.map((e) => e.path).sort()).toEqual(['view.camera.azimuth', 'view.camera.center', 'view.camera.zoom'])
  })
  it('rejects other versions', () => {
    expect(parseDocument(JSON.stringify({ ...v1, version: 4 })).ok).toBe(false)
  })
})
