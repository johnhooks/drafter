import { describe, expect, it } from 'vitest'
import { bodyBounds } from '../../src/core/geom/body'
import { rectFromCorners } from '../../src/core/model/sketch'
import { DEFAULT_PLANE } from '../../src/core/model/types'
import { sx } from '../../src/core/units'
import * as A from '../../src/ui/store/actions'

const IN = (n: number) => sx(n * 16)

function cube() {
  let s = A.initialState()
  s = A.addSketch(s, DEFAULT_PLANE, 's1')
  s = A.addRect(s, 's1', rectFromCorners('r1', 'r1', IN(0), IN(0), IN(24), IN(24)))
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

  it('add extrude defaults to new body from a principal plane and uses all rects', () => {
    const s = cube()
    const e = s.doc.features[1]!
    expect(e).toMatchObject({ kind: 'extrude', name: 'Extrude 1', op: 'new', rectIds: ['r1'] })
    expect(s.eval.bodies.has('e1')).toBe(true)
    expect(s.selection.featureId).toBe('e1')
  })

  it('add extrude from a face sketch defaults to join onto that body', () => {
    let s = cube()
    s = A.addSketch(s, { kind: 'face', featureId: 'e1', face: 'vMax' }, 's2')
    s = A.addRect(s, 's2', rectFromCorners('r2', 'r1', IN(2), IN(-6), IN(6), IN(-2)))
    s = A.addExtrude(s, 's2', ['r2'], IN(3), 'e2')
    expect(s.doc.features[3]).toMatchObject({ op: "join", targetBodyId: "e1" })
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
    s = A.addSketch(s, { kind: 'face', featureId: 'e1', face: 'vMax' }, 's2')
    s = A.addRect(s, 's2', rectFromCorners('r2', 'r1', IN(2), IN(-6), IN(6), IN(-2)))
    s = A.addExtrude(s, 's2', ['r2'], IN(3), 'e2')
    s = A.setMode(s, { kind: 'sketch', sketchId: 's2' })
    s = A.deleteFeature(s, 'e1')
    expect(s.doc.features.map((f) => f.id)).toEqual(['s1'])
    expect(s.mode).toEqual({ kind: 'model' })
    expect(s.selection).toEqual(A.EMPTY_SELECTION)
    expect(s.eval.bodies.size).toBe(0)
  })

  it('removing the only rect of an extrude deletes the extrude', () => {
    let s = cube()
    s = A.removeRects(s, 's1', ['r1'])
    expect(s.doc.features.map((f) => f.id)).toEqual(['s1'])
  })

  it('toggle rect selection', () => {
    let s = cube()
    s = A.toggleRect(s, 'r1', false)
    expect(s.selection.rectIds).toEqual(['r1'])
    s = A.toggleRect(s, 'r2', true)
    expect(s.selection.rectIds).toEqual(['r1', 'r2'])
    s = A.toggleRect(s, 'r1', true)
    expect(s.selection.rectIds).toEqual(['r2'])
  })
})

describe('constraint actions', () => {
  it('sketches and rects get handles', () => {
    let s = A.addSketch(A.initialState(), DEFAULT_PLANE, 's1')
    s = A.addSketch(s, DEFAULT_PLANE, 's2')
    expect(s.doc.features.map((f) => (f as { handle: string }).handle)).toEqual(['s1', 's2'])
    s = A.addRect(s, 's2', rectFromCorners('a', '', 0, 0, 16, 16))
    s = A.addRect(s, 's2', rectFromCorners('b', '', 0, 0, 16, 16))
    s = A.removeRects(s, 's2', ['a'])
    s = A.addRect(s, 's2', rectFromCorners('c', '', 0, 0, 16, 16))
    expect((s.doc.features[1] as unknown as { rects: Array<{ handle: string }> }).rects.map((r) => r.handle)).toEqual(['r2', 'r3'])
  })

  it('setRectSlot applies the slot rule and refuses with a notice', () => {
    let s = cube()
    s = A.setRectSlot(s, 's1', 'r1', 'u', 'min', 'face.left')
    expect((s.doc.features[0] as unknown as { rects: Array<{ u: unknown }> }).rects[0]!.u).toEqual({ min: 'face.left', size: IN(24) })
    // no face on XZ: rect fails, extrude fails, notices stay empty (errors live in eval)
    expect(s.eval.errors.map((e) => e.featureId)).toEqual(['s1', 'e1'])
    s = A.setRectSlot(s, 's1', 'r1', 'u', 'max', '30')
    s = A.setRectSlot(s, 's1', 'r1', 'u', 'size', IN(5))
    expect(s.notices[0]).toMatch(/r1: size is fixed by min \(face.left\) and max \(30\)/)
  })

  it('removeConstraint freezes the current value', () => {
    let s = cube()
    s = A.addSketch(s, { kind: 'face', featureId: 'e1', face: 'vMax' }, 's2')
    s = A.addRect(s, 's2', rectFromCorners('r2', 'r1', IN(2), IN(-6), IN(6), IN(-2)))
    s = A.setRectSlot(s, 's2', 'r2', 'u', 'min', 'face.left + 3')
    expect(s.eval.errors).toEqual([])
    s = A.removeConstraint(s, { sketchId: 's2', rectId: 'r2', axis: 'u', slot: 'min' })
    expect((s.doc.features[2] as unknown as { rects: Array<{ u: unknown }> }).rects[0]!.u).toEqual({ min: IN(3), size: IN(4) })
  })

  it('parameters: add, rename rewrites, delete refused when used', () => {
    let s = cube()
    s = A.addParam(s, 'ply', '3/4')
    s = A.addParam(s, 'face', 16 as never)
    expect(s.notices[0]).toMatch(/reserved/)
    s = A.setRectSlot(s, 's1', 'r1', 'u', 'size', 'ply * 2')
    expect(s.eval.errors).toEqual([])
    s = A.deleteParam(s, 'ply')
    expect(s.doc.params).toHaveLength(1)
    expect(s.notices[1]).toMatch(/ply is used by r1 u size in Sketch 1/)
    s = A.renameParam(s, 'ply', 'stock')
    expect((s.doc.features[0] as unknown as { rects: Array<{ u: { size: string } }> }).rects[0]!.u.size).toBe('stock * 2')
    s = A.setParamValue(s, 'stock', '1/2')
    expect(s.eval.bodies.get('e1')!.boxes[0]!.x1).toBe(16)
  })
})
