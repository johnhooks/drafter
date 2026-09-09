import { describe, expect, it } from 'vitest'
import { bodyBounds, bodyVolume } from '../../src/core/geom/body'
import { DEFAULT_PLANE, type SketchFeature } from '../../src/core/model/types'
import { sx } from '../../src/core/units'
import * as A from '../../src/ui/store/actions'

const IN = (n: number) => sx(n * 16)
const R = ['r_l', 'r_b', 'r_r', 'r_t'] as const
const region = { vertical: 'r_l', horizontal: 'r_b' }
const lines = (s: A.State, i = 0) => (s.doc.features[i] as SketchFeature).lines
const top = (featureId: string) => ({ kind: 'face' as const, featureId, region, face: 'side' as const, lineId: 'r_t', outward: 1 as const })

function cube() {
  let s = A.initialState()
  s = A.addSketch(s, DEFAULT_PLANE, 's1')
  s = A.addRectangle(s, 's1', IN(0), IN(24), IN(0), IN(24), R)
  s = A.addExtrude(s, 's1', [], IN(24), 'e1')
  return s
}

describe('actions', () => {
  it('add sketch enters sketch mode with the rect tool', () => {
    const s = A.addSketch(A.initialState(), DEFAULT_PLANE, 's1')
    expect(s.doc.features).toHaveLength(1)
    expect(s.doc.features[0]!.name).toBe('Sketch 1')
    expect(s.mode).toEqual({ kind: 'sketch', sketchId: 's1' })
    expect(s.tool).toBe('rect')
  })

  it('addRectangle makes four attached lines with running handles; zero size adds nothing', () => {
    let s = A.addSketch(A.initialState(), DEFAULT_PLANE, 's1')
    s = A.addRectangle(s, 's1', IN(2), IN(10), IN(4), IN(20), R)
    expect(lines(s).map((l) => [l.handle, l.dir, l.at, l.run])).toEqual([
      ['l1', 'v', IN(2), { min: 'l2.at', max: 'l4.at' }],
      ['l2', 'h', IN(4), { min: 'l1.at', max: 'l3.at' }],
      ['l3', 'v', IN(10), { min: 'l2.at', max: 'l4.at' }],
      ['l4', 'h', IN(20), { min: 'l1.at', max: 'l3.at' }],
    ])
    expect(A.regionsOf(s, 's1')).toHaveLength(1)
    const before = s
    s = A.addRectangle(s, 's1', IN(2), IN(2), IN(4), IN(20))
    expect(s).toBe(before)
    s = A.addRectangle(s, 's1', IN(30), IN(40), IN(0), IN(10))
    expect(lines(s).map((l) => l.handle).slice(4)).toEqual(['l5', 'l6', 'l7', 'l8'])
  })

  it('moving one side keeps the rectangle closed', () => {
    let s = cube()
    s = A.setLineSlot(s, 's1', 'r_r', 'at', IN(30))
    expect(A.regionsOf(s, 's1')[0]!.bounds).toEqual({ u0: 0, u1: IN(30), v0: 0, v1: IN(24) })
    expect(bodyBounds(s.eval.bodies.get('e1')!)!.x1).toBe(IN(30))
  })

  it('addLine attaches endpoints on perpendicular lines and splits the region', () => {
    let s = cube()
    s = A.addLine(s, 's1', { dir: 'v', at: IN(10), from: IN(0), to: IN(16) }, 'm')
    const m = lines(s).find((l) => l.id === 'm')!
    // bottom end sits on the bottom line, top end is in the open
    expect(m).toMatchObject({ handle: 'l5', dir: 'v', at: IN(10), run: { min: 'l2.at', max: IN(16) } })
    expect(A.regionsOf(s, 's1')).toHaveLength(1)
    s = A.addLine(s, 's1', { dir: 'v', at: IN(12), from: IN(0), to: IN(24) }, 'n')
    expect(lines(s).find((l) => l.id === 'n')!.run).toEqual({ min: 'l2.at', max: 'l4.at' })
    expect(A.regionsOf(s, 's1').map((r) => r.bounds.u0)).toEqual([0, IN(12)])
    // the extrude keeps the corner part
    expect(bodyBounds(s.eval.bodies.get('e1')!)!.x1).toBe(IN(12))
  })

  it('addLine attaches a plain endpoint of an existing line that lands on it', () => {
    let s = A.addSketch(A.initialState(), DEFAULT_PLANE, 's1')
    s = A.addLine(s, 's1', { dir: 'h', at: 0, from: 0, to: IN(10) }, 'a')
    s = A.addLine(s, 's1', { dir: 'v', at: IN(10), from: 0, to: IN(5) }, 'b')
    s = A.addLine(s, 's1', { dir: 'h', at: IN(5), from: IN(10), to: 0 }, 'c')
    s = A.addLine(s, 's1', { dir: 'v', at: 0, from: IN(5), to: 0 }, 'd')
    const byId = Object.fromEntries(lines(s).map((l) => [l.id, l.run]))
    expect(byId).toEqual({
      a: { min: 'l4.at', max: 'l2.at' },
      b: { min: 'l1.at', max: 'l3.at' },
      c: { min: 'l4.at', max: 'l2.at' },
      d: { min: 'l1.at', max: 'l3.at' },
    })
    expect(A.regionsOf(s, 's1')).toHaveLength(1)
    s = A.setLineSlot(s, 's1', 'b', 'at', IN(14))
    expect(A.regionsOf(s, 's1')[0]!.bounds.u1).toBe(IN(14))
    // attach: false leaves plain numbers
    s = A.addLine(s, 's1', { dir: 'v', at: IN(7), from: 0, to: IN(5), attach: false }, 'e')
    expect(lines(s).find((l) => l.id === 'e')!.run).toEqual({ min: 0, max: IN(5) })
  })

  it('add extrude defaults to new body from a principal plane and uses all regions', () => {
    const s = cube()
    const e = s.doc.features[1]!
    expect(e).toMatchObject({ kind: 'extrude', name: 'Extrude 1', op: 'new', regions: [region] })
    expect(s.eval.bodies.has('e1')).toBe(true)
    expect(s.selection.featureId).toBe('e1')
  })

  it('add extrude from a face sketch defaults to join onto that body', () => {
    let s = cube()
    s = A.addSketch(s, top('e1'), 's2')
    s = A.addRectangle(s, 's2', IN(2), IN(6), IN(-6), IN(-2), ['p_l', 'p_b', 'p_r', 'p_t'])
    s = A.addExtrude(s, 's2', [{ vertical: 'p_l', horizontal: 'p_b' }], IN(3), 'e2')
    expect(s.doc.features[3]).toMatchObject({ op: 'join', targetBodyId: 'e1' })
    expect(bodyBounds(s.eval.bodies.get('e1')!)!.z1).toBe(IN(27))
  })

  it('editing distance re-evaluates', () => {
    let s = cube()
    expect(bodyBounds(s.eval.bodies.get('e1')!)!.y0).toBe(-IN(24))
    s = A.updateExtrude(s, 'e1', { distance: IN(30) })
    expect(bodyBounds(s.eval.bodies.get('e1')!)!.y0).toBe(-IN(30))
  })

  it('delete cascades and clears selection and mode', () => {
    let s = cube()
    s = A.addSketch(s, top('e1'), 's2')
    s = A.addRectangle(s, 's2', IN(2), IN(6), IN(-6), IN(-2), ['p_l', 'p_b', 'p_r', 'p_t'])
    s = A.addExtrude(s, 's2', [{ vertical: 'p_l', horizontal: 'p_b' }], IN(3), 'e2')
    s = A.setMode(s, { kind: 'sketch', sketchId: 's2' })
    s = A.deleteFeature(s, 'e1')
    expect(s.doc.features.map((f) => f.id)).toEqual(['s1'])
    expect(s.mode).toEqual({ kind: 'model' })
    expect(s.selection).toEqual(A.EMPTY_SELECTION)
    expect(s.eval.bodies.size).toBe(0)
  })

  it('deleting one side of a rectangle freezes the attached ends and leaves no region', () => {
    let s = cube()
    s = A.removeLines(s, 's1', ['r_r'])
    expect(lines(s).map((l) => l.id)).toEqual(['r_l', 'r_b', 'r_t'])
    expect(lines(s).find((l) => l.id === 'r_b')!.run).toEqual({ min: 'l1.at', max: IN(24) })
    expect(lines(s).find((l) => l.id === 'r_t')!.run).toEqual({ min: 'l1.at', max: IN(24) })
    expect(A.regionsOf(s, 's1')).toEqual([])
    expect(s.eval.errors.map((e) => e.featureId)).toEqual(['e1'])
  })

  it('removing a corner line of an extrude\'s only region deletes the extrude with its dependents', () => {
    let s = cube()
    s = A.addSketch(s, top('e1'), 's2')
    s = A.removeLines(s, 's1', ['r_l'])
    expect(s.doc.features.map((f) => f.id)).toEqual(['s1'])
  })

  it('deleteSelection removes lines that bound only the selected regions', () => {
    let s = cube()
    s = A.addLine(s, 's1', { dir: 'v', at: IN(12), from: 0, to: IN(24) }, 'm')
    const right = A.regionsOf(s, 's1')[1]!.ref
    s = A.toggleRegion(s, right, false)
    s = A.deleteSelection(s, 's1')
    // the splitting line bounds the left region too, so it stays; the right line goes
    expect(lines(s).map((l) => l.id).sort()).toEqual(['m', 'r_b', 'r_l', 'r_t'])
    expect(A.regionsOf(s, 's1')).toHaveLength(1)
  })

  it('toggle line and region selection', () => {
    let s = cube()
    s = A.toggleLine(s, 'r_l', false)
    expect(s.selection.lineIds).toEqual(['r_l'])
    s = A.toggleLine(s, 'r_b', true)
    expect(s.selection.lineIds).toEqual(['r_l', 'r_b'])
    s = A.toggleLine(s, 'r_l', true)
    expect(s.selection.lineIds).toEqual(['r_b'])
    s = A.toggleRegion(s, region, true)
    expect(s.selection).toMatchObject({ lineIds: ['r_b'], regions: [region] })
    s = A.toggleRegion(s, region, false)
    expect(s.selection).toMatchObject({ lineIds: [], regions: [region] })
    s = A.toggleRegion(s, region, true)
    expect(s.selection.regions).toEqual([])
  })

  it('a deleted line and a region that no longer resolves leave the selection', () => {
    let s = cube()
    s = A.toggleRegion(s, region, false)
    s = A.toggleLine(s, 'r_t', true)
    expect(s.selection).toMatchObject({ lineIds: ['r_t'], regions: [region] })
    // opening the loop keeps both corner lines but no region resolves at their corner
    s = A.removeLines(s, 's1', ['r_r'])
    expect(s.selection.regions).toEqual([])
    expect(s.selection.lineIds).toEqual(['r_t'])
    s = A.removeLines(s, 's1', ['r_t'])
    expect(s.selection.lineIds).toEqual([])
    // undo brings the lines back but not the selection
    s = A.undo(s)
    s = A.undo(s)
    expect(A.regionsOf(s, 's1')).toHaveLength(1)
    expect(s.selection).toMatchObject({ lineIds: [], regions: [] })
  })

  it('construction lines merge regions and can be toggled', () => {
    let s = cube()
    s = A.addLine(s, 's1', { dir: 'v', at: IN(12), from: 0, to: IN(24) }, 'm')
    expect(A.regionsOf(s, 's1')).toHaveLength(2)
    s = A.toggleConstruction(s, 's1', ['m'])
    expect(lines(s).find((l) => l.id === 'm')!.construction).toBe(true)
    expect(A.regionsOf(s, 's1')).toHaveLength(1)
    s = A.toggleConstruction(s, 's1', ['m'])
    expect(lines(s).find((l) => l.id === 'm')!.construction).toBeUndefined()
  })

  it('setRegionSize moves the far extreme lines and refuses on an expression', () => {
    let s = cube()
    s = A.setRegionSize(s, 's1', region, 'u', IN(30))
    expect(lines(s).find((l) => l.id === 'r_r')!.at).toBe(IN(30))
    expect(A.regionsOf(s, 's1')[0]!.bounds.u1).toBe(IN(30))
    s = A.setRegionSize(s, 's1', region, 'v', IN(10))
    expect(lines(s).find((l) => l.id === 'r_t')!.at).toBe(IN(10))
    s = A.setLineSlot(s, 's1', 'r_r', 'at', 'l1.at + 20')
    s = A.setRegionSize(s, 's1', region, 'u', IN(8))
    expect(s.notices.at(-1)!.text).toMatch(/l3 is fixed by l1.at \+ 20/)
    expect(lines(s).find((l) => l.id === 'r_r')!.at).toBe('l1.at + 20')
    // a splitting line: the left region's height edit moves the top line both regions share
    s = A.addLine(s, 's1', { dir: 'v', at: IN(12), from: 0, to: IN(10) }, 'm')
    expect(A.regionsOf(s, 's1')).toHaveLength(2)
    s = A.setRegionSize(s, 's1', region, 'v', IN(12))
    expect(lines(s).find((l) => l.id === 'r_t')!.at).toBe(IN(12))
    expect(A.regionsOf(s, 's1').map((r) => r.bounds.v1)).toEqual([IN(12), IN(12)])
  })

  it('stale region label placements are pruned on the next edit', () => {
    let s = cube()
    s = A.setRegionLabelLayout(s, 's1', region, 'width', { offset: IN(2) })
    expect((s.doc.features[0] as SketchFeature).regionLabels).toEqual({ 'r_l|r_b': { width: { offset: IN(2) } } })
    s = A.setLineSlot(s, 's1', 'r_r', 'at', IN(30))
    expect((s.doc.features[0] as SketchFeature).regionLabels).toEqual({ 'r_l|r_b': { width: { offset: IN(2) } } })
    s = A.removeLines(s, 's1', ['r_t'])
    expect((s.doc.features[0] as SketchFeature).regionLabels).toBeUndefined()
  })
})

describe('constraint actions', () => {
  it('sketches and lines get handles', () => {
    let s = A.addSketch(A.initialState(), DEFAULT_PLANE, 's1')
    s = A.addSketch(s, DEFAULT_PLANE, 's2')
    expect(s.doc.features.map((f) => (f as { handle: string }).handle)).toEqual(['s1', 's2'])
    s = A.addLine(s, 's2', { dir: 'h', at: 0, from: 0, to: 16 }, 'a')
    s = A.addLine(s, 's2', { dir: 'h', at: 16, from: 0, to: 16 }, 'b')
    s = A.removeLines(s, 's2', ['a'])
    s = A.addLine(s, 's2', { dir: 'h', at: 32, from: 0, to: 16 }, 'c')
    expect(lines(s, 1).map((l) => l.handle)).toEqual(['l2', 'l3'])
  })

  it('setLineSlot applies the slot rule to the run and refuses with a notice', () => {
    let s = cube()
    s = A.setLineSlot(s, 's1', 'r_l', 'at', 'face.left')
    expect(lines(s)[0]!.at).toBe('face.left')
    // no face on XZ: the line fails, its neighbours fail, the extrude fails; notices stay empty (errors live in eval)
    expect([...new Set(s.eval.errors.map((e) => e.featureId))]).toEqual(['s1', 'e1'])
    s = A.setLineSlot(s, 's1', 'r_b', 'size', IN(5))
    expect(s.notices[0]!.text).toMatch(/l2: size is fixed by min \(l1.at\) and max \(l3.at\)/)
    s = A.addLine(s, 's1', { dir: 'h', at: IN(40), from: 0, to: IN(10) }, 'free')
    s = A.setLineSlot(s, 's1', 'free', 'size', IN(5))
    expect(lines(s).find((l) => l.id === 'free')!.run).toEqual({ min: 0, size: IN(5) })
  })

  it('removeConstraint freezes the current value', () => {
    let s = cube()
    s = A.addSketch(s, top('e1'), 's2')
    s = A.addRectangle(s, 's2', IN(2), IN(6), IN(-6), IN(-2), ['p_l', 'p_b', 'p_r', 'p_t'])
    s = A.setLineSlot(s, 's2', 'p_l', 'at', 'face.left + 3')
    expect(s.eval.errors).toEqual([])
    s = A.removeConstraint(s, { sketchId: 's2', lineId: 'p_l', slot: 'at' })
    expect(lines(s, 2)[0]!.at).toBe(IN(3))
  })

  it('parameters: add, rename rewrites, delete refused when used', () => {
    let s = cube()
    s = A.addParam(s, 'ply', '3/4')
    s = A.addParam(s, 'face', 16 as never)
    expect(s.notices[0]!.text).toMatch(/reserved/)
    s = A.setLineSlot(s, 's1', 'r_r', 'at', 'l1.at + ply * 2')
    expect(s.eval.errors).toEqual([])
    s = A.deleteParam(s, 'ply')
    expect(s.doc.params).toHaveLength(1)
    expect(s.notices[1]!.text).toMatch(/ply is used by l3 at in Sketch 1/)
    s = A.renameParam(s, 'ply', 'stock')
    expect(lines(s).find((l) => l.id === 'r_r')!.at).toBe('l1.at + stock * 2')
    s = A.setParamValue(s, 'stock', '1/2')
    expect(bodyVolume(s.eval.bodies.get('e1')!)).toBe(16 * IN(24) * IN(24))
  })
})
