import { describe, expect, it } from 'vitest'
import { bodyVolume } from '../../src/core/geom/body'
import { evaluate } from '../../src/core/eval/evaluate'
import { parseDocument, serializeDocument } from '../../src/core/model/document'
import { DEFAULT_VIEW, type SketchFeature } from '../../src/core/model/types'

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

/** The version 3 sample from the File Format page: a block, a pocket linked to the face edges, a parameter. */
const v3 = {
  version: 3,
  model: {
    title: 'Block',
    params: [{ name: 'ply', value: '3/4' }],
    features: [
      {
        kind: 'sketch',
        id: 's_a1',
        handle: 's1',
        name: 'Sketch 1',
        plane: { kind: 'principal', plane: 'XZ', offset: 0, normal: -1 },
        rects: [{ id: 'r_b2', handle: 'r1', u: { min: 0, max: 384 }, v: { min: 0, max: 384 } }],
      },
      { kind: 'extrude', id: 'e_c3', name: 'Extrude 1', sketchId: 's_a1', rectIds: ['r_b2'], distance: 384, op: 'new' },
      {
        kind: 'sketch',
        id: 's_d4',
        handle: 's2',
        name: 'Sketch 2',
        plane: { kind: 'face', featureId: 'e_c3', rectId: 'r_b2', face: 'vMax' },
        rects: [{ id: 'r_e5', handle: 'r1', u: { min: 'face.left + 2', max: 'face.right - 2' }, v: { min: -352, size: 64 }, layout: { u: { min: { offset: 40, label: 1 } }, v: { size: { offset: -16 } } } }],
      },
      { kind: 'extrude', id: 'e_f6', name: 'Extrude 2', sketchId: 's_d4', rectIds: ['r_e5'], distance: '-(ply)', op: 'cut', targetBodyId: 'e_c3' },
    ],
  },
  view: { camera: { azimuth: -45, elevation: 35.264, zoom: 6, center: [0, 0, 0] }, sketchId: 's_d4' },
}

describe('migration', () => {
  it('version 1 loads as version 5 with attached lines, a rectangle record, a default view, and identical geometry', () => {
    const r = parseDocument(JSON.stringify(v1))
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.file.version).toBe(5)
    expect(r.file.view).toEqual(DEFAULT_VIEW)
    expect(r.file.model.params).toEqual([])
    const s1 = r.file.model.features[0] as SketchFeature
    expect(s1.handle).toBe('s1')
    expect(s1.lines.map((l) => [l.handle, l.dir, l.at])).toEqual([
      ['l1', 'v', 0],
      ['l2', 'h', 0],
      ['l3', 'v', 384],
      ['l4', 'h', 384],
    ])
    expect(s1.lines[1]!.run).toEqual({ min: 'l1.at', max: 'l3.at' })
    expect(s1.rects).toEqual([{ id: 'a', handle: 'r1', lines: ['a_l', 'a_b', 'a_r', 'a_t'] }])
    expect(r.file.model.features[1]).toMatchObject({ regions: [{ vertical: 'a_l', horizontal: 'a_b' }] })
    expect(r.file.model.features[2]).toMatchObject({ plane: { kind: 'face', featureId: 'e1', region: { vertical: 'a_l', horizontal: 'a_b' }, face: 'side', lineId: 'a_t', outward: 1 } })
    const ev = evaluate(r.file.model)
    expect(ev.errors).toEqual([])
    expect(bodyVolume(ev.bodies.get('e1')!)).toBe(384 ** 3 - 64 * 64 * 32)
    // saved as version 4 and round trips
    const again = parseDocument(serializeDocument(r.file))
    expect(again.ok && again.file).toEqual(r.file)
  })
  it('version 3 sample: size-driven axis, face links, placements, and the same bodies', () => {
    const r = parseDocument(JSON.stringify(v3))
    expect(r.ok).toBe(true)
    if (!r.ok) return
    const s2 = r.file.model.features[2] as SketchFeature
    expect(s2.lines.map((l) => l.at)).toEqual(['face.left + 2', -352, 'face.right - 2', 'l2.at + 4'])
    expect(s2.lines[0]!.layout).toEqual({ at: { offset: 40, label: 1 } })
    expect(s2.regionLabels).toEqual({ 'r_e5_l|r_e5_b': { height: { offset: -16 } } })
    expect(r.file.view.sketchId).toBe('s_d4')
    const ev = evaluate(r.file.model)
    expect(ev.errors).toEqual([])
    expect(bodyVolume(ev.bodies.get('e_c3')!)).toBe(384 ** 3 - 320 * 64 * 12)
  })
  it('version 3 expressions naming rectangle properties are kept and resolve through the records', () => {
    const doc = {
      version: 3,
      model: {
        title: 't',
        params: [],
        features: [
          {
            kind: 'sketch',
            id: 's1',
            handle: 's1',
            name: 'S',
            plane: { kind: 'principal', plane: 'XZ', offset: 0, normal: -1 },
            rects: [
              { id: 'a', handle: 'r1', u: { min: 0, max: 160 }, v: { min: 0, max: 64 } },
              { id: 'b', handle: 'r2', u: { min: 'r1.right + 1', size: 'r1.width / 2' }, v: { max: 'r1.top', size: 'r1.height' } },
            ],
          },
        ],
      },
      view: DEFAULT_VIEW,
    }
    const r = parseDocument(JSON.stringify(doc))
    expect(r.ok).toBe(true)
    if (!r.ok) return
    const s = r.file.model.features[0] as SketchFeature
    const b = s.lines.slice(4)
    expect(b.map((l) => l.at)).toEqual(['r1.right + 1', 'l8.at - (r1.height)', 'l5.at + (r1.width / 2)', 'r1.top'])
    expect(s.rects.map((x) => x.handle)).toEqual(['r1', 'r2'])
    const ev = evaluate(r.file.model)
    expect(ev.errors).toEqual([])
    const sr = ev.results.get('s1')
    expect(sr?.kind === 'sketch' && sr.regions.map((x) => x.bounds)).toEqual([
      { u0: 0, u1: 160, v0: 0, v1: 64 },
      { u0: 176, u1: 256, v0: 0, v1: 64 },
    ])
  })
  it('version 2 loads as version 5 with a default view', () => {
    const v2 = { version: 2, title: 'two', params: [{ name: 'ply', value: 12 }], features: [] }
    const r = parseDocument(JSON.stringify(v2))
    expect(r.ok && r.file).toEqual({ version: 5, model: { title: 'two', params: [{ name: 'ply', value: 12 }], features: [] }, view: DEFAULT_VIEW })
  })
  it('version 4 bumps to 5 with empty rectangle lists and its expressions unchanged', () => {
    const v4 = {
      version: 4,
      model: {
        title: 't',
        params: [],
        features: [
          {
            kind: 'sketch',
            id: 's1',
            handle: 's1',
            name: 'S',
            plane: { kind: 'principal', plane: 'XZ', offset: 0, normal: -1 },
            lines: [{ id: 'a', handle: 'l1', dir: 'h', at: 'l2.at + 4', run: { min: 0, max: 64 } }, { id: 'b', handle: 'l2', dir: 'h', at: 0, run: { min: 0, max: 64 } }],
          },
        ],
      },
      view: DEFAULT_VIEW,
    }
    const r = parseDocument(JSON.stringify(v4))
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.file.version).toBe(5)
    const s = r.file.model.features[0] as SketchFeature
    expect(s.rects).toEqual([])
    expect(s.lines[0]!.at).toBe('l2.at + 4')
    // a version 4 file presented as 5 without rectangle lists is refused
    expect(parseDocument(JSON.stringify({ ...v4, version: 5 })).ok).toBe(false)
  })
  it('version 5 keeps its view and validates the camera', () => {
    const file = { version: 5, model: { title: 't', params: [], features: [] }, view: { camera: { azimuth: 90, elevation: 0, zoom: 8, center: [16, 0, 0] }, sketchId: 'nope' } }
    const r = parseDocument(JSON.stringify(file))
    expect(r.ok && r.file.view).toEqual(file.view)
    const bad = parseDocument(JSON.stringify({ ...file, view: { camera: { azimuth: 'x', elevation: 0, zoom: 0, center: [0, 0] } } }))
    expect(bad.ok).toBe(false)
    if (!bad.ok) expect(bad.errors.map((e) => e.path).sort()).toEqual(['view.camera.azimuth', 'view.camera.center', 'view.camera.zoom'])
  })
  it('rejects other versions', () => {
    expect(parseDocument(JSON.stringify({ ...v1, version: 6 })).ok).toBe(false)
  })
})
