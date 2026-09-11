import { describe, expect, it } from 'vitest'
import { evaluate } from '../../src/core/eval/evaluate'
import { DEFAULT_PLANE, type Document, type SketchFeature, type SketchLine, newDocument } from '../../src/core/model/types'
import { dimensionsOf, labelsOf } from '../../src/ui/sketch/Dimensions'
import * as A from '../../src/ui/store/actions'
import { rectLines, regionOf } from '../core/fixtures'

const IN = (n: number) => n * 16

/** A cube, then on its top a rectangle whose left and right lines are linked to the face edges. */
function doc(layout?: { left?: SketchLine['layout']; right?: SketchLine['layout'] }, regionLabels?: SketchFeature['regionLabels']): Document {
  const pocket: SketchLine[] = [
    { id: 'b_l', handle: 'l1', dir: 'v', at: 'face.left + 2', run: { min: 'l2.at', max: 'l4.at' }, ...(layout?.left ? { layout: layout.left } : {}) },
    { id: 'b_b', handle: 'l2', dir: 'h', at: IN(-20), run: { min: 'l1.at', max: 'l3.at' } },
    { id: 'b_r', handle: 'l3', dir: 'v', at: 'face.right - 2', run: { min: 'l2.at', max: 'l4.at' }, ...(layout?.right ? { layout: layout.right } : {}) },
    { id: 'b_t', handle: 'l4', dir: 'h', at: IN(-4), run: { min: 'l1.at', max: 'l3.at' } },
  ]
  return {
    ...newDocument('t'),
    features: [
      { kind: 'sketch', rects: [], id: 's1', handle: 's1', name: 'Sketch 1', plane: DEFAULT_PLANE, lines: rectLines('a', 1, 0, IN(24), 0, IN(24)) },
      { kind: 'extrude', id: 'e1', name: 'Extrude 1', sketchId: 's1', regions: [regionOf('a')], distance: IN(24), op: 'new' },
      {
        kind: 'sketch', rects: [],
        id: 's2',
        handle: 's2',
        name: 'Sketch 2',
        plane: { kind: 'face', featureId: 'e1', region: regionOf('a'), face: 'side', lineId: 'a_t', outward: 1 },
        lines: pocket,
        ...(regionLabels ? { regionLabels } : {}),
      },
    ],
  }
}

const sketchOf = (d: Document) => d.features[2] as SketchFeature
const resultOf = (d: Document) => {
  const r = evaluate(d).results.get('s2')
  if (r?.kind !== 'sketch') throw new Error('no sketch result')
  return r
}

describe('dimensionsOf placement', () => {
  const pxPerSx = 12 / 16 // 12 px per inch

  it('position dimensions sit above the top end of a vertical line and stack when they overlap; attachments draw nothing', () => {
    const d = doc()
    const { dims, tags } = dimensionsOf(sketchOf(d), resultOf(d), { pxPerSx })
    expect(tags).toEqual([])
    expect(dims.map((x) => [x.ref.lineId, x.ref.slot])).toEqual([
      ['b_l', 'at'],
      ['b_r', 'at'],
    ])
    const step = Math.round(22 / pxPerSx)
    // left line: from face.left (0) to 2", drawn above its top end at v = -4
    expect(dims[0]).toMatchObject({ axis: 'u', from: 0, to: IN(2), edge: IN(-4), at: IN(-4) + step, offset: step, labelAt: 0.5, stored: false, label: '2"' })
    // right line: from face.right (24) to 22"; the spans do not overlap, so it is not stacked
    expect(dims[1]).toMatchObject({ axis: 'u', from: IN(24), to: IN(22), at: IN(-4) + step, stored: false })
  })

  it('overlapping automatic dimensions on the same edge stack outward', () => {
    const d = doc()
    const s = sketchOf(d)
    // link the right line to the face's left edge too, so both spans start at 0 and overlap
    const wide = { ...d, features: d.features.map((f) => (f.id === 's2' ? { ...s, lines: s.lines.map((l) => (l.id === 'b_r' ? { ...l, at: 'face.left + 22' } : l)) } : f)) }
    const { dims } = dimensionsOf(sketchOf(wide), resultOf(wide), { pxPerSx })
    const step = Math.round(22 / pxPerSx)
    expect(dims[0]!.offset).toBe(step)
    expect(dims[1]!.offset).toBe(2 * step)
  })

  it('a stored offset runs continuously from the top end: positive above, negative down the line, then past its bottom', () => {
    const d = doc({ left: { at: { offset: IN(3), label: 1 } }, right: { at: { offset: -IN(1) } } })
    const { dims } = dimensionsOf(sketchOf(d), resultOf(d), { pxPerSx })
    expect(dims[0]).toMatchObject({ edge: IN(-4), at: IN(-4) + IN(3), labelAt: 1, stored: true })
    // 1" down from the top end, still nearer the top
    expect(dims[1]).toMatchObject({ edge: IN(-4), at: IN(-5), stored: true })
    const far = doc({ left: { at: { offset: -IN(18) } } })
    const below = dimensionsOf(sketchOf(far), resultOf(far), { pxPerSx }).dims[0]!
    // 2" past the bottom end: extension lines come from the bottom
    expect(below).toMatchObject({ edge: IN(-20), at: IN(-22) })
  })

  it('label fractions clamp to the allowed range', () => {
    const d = doc({ left: { at: { offset: IN(1), label: 9 } } })
    const { dims } = dimensionsOf(sketchOf(d), resultOf(d), { pxPerSx })
    expect(dims[0]!.labelAt).toBe(1.5)
  })

  it('overrides win over stored layouts while dragging', () => {
    const d = doc({ left: { at: { offset: IN(1) } } })
    const overrides = new Map([['L:b_l:at', { offset: IN(5), label: 0.25 }]])
    const { dims } = dimensionsOf(sketchOf(d), resultOf(d), { pxPerSx, overrides })
    expect(dims[0]).toMatchObject({ at: IN(-4) + IN(5), labelAt: 0.25 })
  })

  it('a run dimension with a literal is drawn along the line; other expressions become tags', () => {
    const d = doc()
    const s = sketchOf(d)
    const edited = {
      ...d,
      features: d.features.map((f) => (f.id === 's2' ? { ...s, lines: s.lines.map((l) => (l.id === 'b_b' ? { ...l, run: { min: 'l1.at + 1', max: 'l3.at - l1.at' } } : l)) } : f)),
    }
    const { dims, tags } = dimensionsOf(sketchOf(edited), resultOf(edited), { pxPerSx })
    const run = dims.find((x) => x.ref.lineId === 'b_b')!
    const step = Math.round(22 / pxPerSx)
    expect(run).toMatchObject({ axis: 'u', from: IN(2), to: IN(3), edge: IN(-20), at: IN(-20) + step, label: '1"' })
    expect(tags).toEqual([{ ref: { sketchId: 's2', lineId: 'b_b', slot: 'max' }, text: 'max = l3.at - l1.at', u: IN(20), v: IN(-20) }])
  })

  it('region labels default below and right, follow stored placements, and free lines get length labels', () => {
    const d = doc(undefined, { 'b_l|b_b': { height: { offset: -IN(2), label: 0 } } })
    const labels = labelsOf(sketchOf(d), resultOf(d), { pxPerSx })
    const w = labels.find((l) => l.target.kind === 'region' && l.axis === 'u')!
    expect(w).toMatchObject({ from: IN(2), to: IN(22), at: IN(-20) - Math.round(14 / pxPerSx), labelAt: 0.5, stored: false, value: IN(20) })
    const h = labels.find((l) => l.target.kind === 'region' && l.axis === 'v')!
    // 2" inside from the right edge
    expect(h).toMatchObject({ from: IN(-20), to: IN(-4), at: IN(22) - IN(2), labelAt: 0, stored: true, value: IN(16) })
    expect(labels.filter((l) => l.target.kind === 'line')).toEqual([])
    const s = sketchOf(d)
    const withFree = { ...d, features: d.features.map((f) => (f.id === 's2' ? { ...s, lines: [...s.lines, { id: 'f', handle: 'l9', dir: 'h', at: IN(-2), run: { min: 0, max: IN(10) } } as SketchLine] } : f)) }
    const free = labelsOf(sketchOf(withFree), resultOf(withFree), { pxPerSx }).find((l) => l.target.kind === 'line')!
    expect(free).toMatchObject({ target: { kind: 'line', lineId: 'f', slot: 'size' }, axis: 'u', from: 0, to: IN(10), at: IN(-2) - Math.round(14 / pxPerSx), value: IN(10) })
  })
})

describe('setDimLayout', () => {
  it('stores, replaces, clears, and is undoable; removing the constraint drops it', () => {
    let s = A.loadDocument(A.initialState(), doc())
    const before = s.history.past.length
    s = A.setDimLayout(s, 's2', 'b_l', 'at', { offset: IN(3), label: 1 })
    expect((s.doc.features[2] as SketchFeature).lines[0]!.layout).toEqual({ at: { offset: IN(3), label: 1 } })
    expect(s.history.past.length).toBe(before + 1)
    s = A.setDimLayout(s, 's2', 'b_l', 'at', undefined)
    expect((s.doc.features[2] as SketchFeature).lines[0]!.layout).toBeUndefined()
    s = A.setDimLayout(s, 's2', 'b_r', 'at', { offset: IN(1) })
    s = A.removeConstraint(s, { sketchId: 's2', lineId: 'b_r', slot: 'at' })
    const line = (s.doc.features[2] as SketchFeature).lines[2]!
    expect(line.at).toBe(IN(22))
    expect(line.layout).toBeUndefined()
  })
  it('region label placement survives a move of the region and goes when the region does', () => {
    let s = A.loadDocument(A.initialState(), doc())
    s = A.setRegionLabelLayout(s, 's2', { vertical: 'b_l', horizontal: 'b_b' }, 'width', { offset: IN(2) })
    s = A.setLineSlot(s, 's2', 'b_t', 'at', IN(-6))
    expect((s.doc.features[2] as SketchFeature).regionLabels).toEqual({ 'b_l|b_b': { width: { offset: IN(2) } } })
    s = A.removeLines(s, 's2', ['b_t'])
    expect((s.doc.features[2] as SketchFeature).regionLabels).toBeUndefined()
  })
})

describe('dimensionsOf anchors and ticks', () => {
  const pxPerSx = 12 / 16

  /** A 24" square rectangle r1 (l1 left, l2 bottom, l3 right, l4 top) and a free vertical line l5 driven by `at`. */
  function rectDoc(at: string): Document {
    const lines: SketchLine[] = [...rectLines('a', 1, 0, IN(24), 0, IN(24)), { id: 'x', handle: 'l5', dir: 'v', at, run: { min: 0, max: IN(24) } }]
    return {
      ...newDocument('t'),
      features: [{ kind: 'sketch', id: 's1', handle: 's1', name: 'Sketch 1', plane: DEFAULT_PLANE, lines, rects: [{ id: 'r', handle: 'r1', lines: ['a_l', 'a_b', 'a_r', 'a_t'] }] }],
    }
  }
  const dimsOf = (d: Document) => {
    const s = d.features[0] as SketchFeature
    const r = evaluate(d).results.get('s1')
    if (r?.kind !== 'sketch') throw new Error('no sketch result')
    return dimensionsOf(s, r, { pxPerSx })
  }

  it('each constraint names the edges it measures from', () => {
    const d = doc()
    const { dims } = dimensionsOf(sketchOf(d), resultOf(d), { pxPerSx })
    expect(dims.map((x) => x.anchors)).toEqual([[{ kind: 'face', side: 'left' }], [{ kind: 'face', side: 'right' }]])
    expect(dimsOf(rectDoc('l3.at + 1')).dims.find((x) => x.ref.lineId === 'x')!.anchors).toEqual([{ kind: 'line', lineId: 'a_r' }])
    expect(dimsOf(rectDoc('r1.right + 1')).dims.find((x) => x.ref.lineId === 'x')!.anchors).toEqual([{ kind: 'line', lineId: 'a_r' }])
    expect(dimsOf(rectDoc('r1.umid + 1')).dims.find((x) => x.ref.lineId === 'x')!.anchors).toEqual([
      { kind: 'line', lineId: 'a_l' },
      { kind: 'line', lineId: 'a_r' },
    ])
  })

  it('a rectangle side anchors on its member line, the same as naming the line', () => {
    const viaRect = dimsOf(rectDoc('r1.right + 1'))
    const viaLine = dimsOf(rectDoc('l3.at + 1'))
    expect(viaRect.tags).toEqual([])
    const a = viaRect.dims.find((x) => x.ref.lineId === 'x')!
    const b = viaLine.dims.find((x) => x.ref.lineId === 'x')!
    expect(a).toMatchObject({ from: IN(24), to: IN(25), label: '1"', anchorName: 'r1.right' })
    expect([a.axis, a.from, a.to, a.at, a.edge, a.offset]).toEqual([b.axis, b.from, b.to, b.at, b.edge, b.offset])
  })

  it('a rectangle middle anchors at the mean of its two members', () => {
    const { dims, tags } = dimsOf(rectDoc('r1.umid + 2'))
    expect(tags).toEqual([])
    expect(dims.find((x) => x.ref.lineId === 'x')).toMatchObject({ axis: 'u', from: IN(12), to: IN(14), label: '2"' })
  })

  it('a middle anchor on an odd span rounds to the sixteenth the evaluator resolves', () => {
    // r1 spans 0..3 sixteenths, so r1.umid evaluates to round(1.5) = 2 and the line sits 1" past it; the anchor must be 2 too
    const lines: SketchLine[] = [...rectLines('a', 1, 0, 3, 0, IN(24)), { id: 'x', handle: 'l5', dir: 'v', at: 'r1.umid + 1', run: { min: 0, max: IN(24) } }]
    const d: Document = {
      ...newDocument('t'),
      features: [{ kind: 'sketch', id: 's1', handle: 's1', name: 'Sketch 1', plane: DEFAULT_PLANE, lines, rects: [{ id: 'r', handle: 'r1', lines: ['a_l', 'a_b', 'a_r', 'a_t'] }] }],
    }
    const { dims } = dimsOf(d)
    expect(dims.find((x) => x.ref.lineId === 'x')).toMatchObject({ from: 2, to: 18, label: '1"' })
  })

  it('a rectangle with a missing member line draws nothing for the slot and does not throw', () => {
    const d = rectDoc('r1.right + 1')
    const s = d.features[0] as SketchFeature
    const broken = { ...d, features: [{ ...s, rects: [{ id: 'r', handle: 'r1', lines: ['a_l', 'a_b', 'gone', 'a_t'] as const }] }] }
    expect(() => dimsOf(broken)).not.toThrow()
    expect(dimsOf(broken).dims.some((x) => x.ref.lineId === 'x')).toBe(false)
  })

  it('a driven position ticks at the run midpoint; attached corners do not tick', () => {
    const d = doc()
    const { ticks } = dimensionsOf(sketchOf(d), resultOf(d), { pxPerSx })
    expect(ticks).toEqual([
      { ref: { sketchId: 's2', lineId: 'b_l', slot: 'at' }, dir: 'v', u: IN(2), v: IN(-12) },
      { ref: { sketchId: 's2', lineId: 'b_r', slot: 'at' }, dir: 'v', u: IN(22), v: IN(-12) },
    ])
  })

  it('a driven run end ticks at that end', () => {
    const d = doc()
    const s = sketchOf(d)
    const edited = {
      ...d,
      features: d.features.map((f) => (f.id === 's2' ? { ...s, lines: s.lines.map((l) => (l.id === 'b_b' ? { ...l, run: { min: 'l1.at', max: 'l3.at - 1' } } : l)) } : f)),
    }
    const { ticks } = dimensionsOf(sketchOf(edited), resultOf(edited), { pxPerSx })
    expect(ticks).toContainEqual({ ref: { sketchId: 's2', lineId: 'b_b', slot: 'max' }, dir: 'h', u: IN(21), v: IN(-20) })
    expect(ticks.filter((t) => t.ref.lineId === 'b_b')).toHaveLength(1)
  })

  it('a failed line has no tick', () => {
    const d = doc()
    const s = sketchOf(d)
    const edited = {
      ...d,
      features: d.features.map((f) => (f.id === 's2' ? { ...s, lines: s.lines.map((l) => (l.id === 'b_l' ? { ...l, at: 'nothing + 2' } : l)) } : f)),
    }
    const { ticks } = dimensionsOf(sketchOf(edited), resultOf(edited), { pxPerSx })
    expect(ticks.some((t) => t.ref.lineId === 'b_l')).toBe(false)
  })
})
