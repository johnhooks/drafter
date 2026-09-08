import { describe, expect, it } from 'vitest'
import { bodyBounds } from '../../src/core/geom/body'
import { DEFAULT_PLANE } from '../../src/core/model/types'
import { sx } from '../../src/core/units'
import * as A from '../../src/ui/store/actions'

const IN = (n: number) => sx(n * 16)

function cube() {
  let s = A.initialState()
  s = A.addSketch(s, DEFAULT_PLANE, 's1')
  s = A.addRect(s, 's1', { id: 'r1', u1: IN(0), v1: IN(0), u2: IN(24), v2: IN(24) })
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
    s = A.addRect(s, 's2', { id: 'r2', u1: IN(2), v1: IN(-6), u2: IN(6), v2: IN(-2) })
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
    s = A.addRect(s, 's2', { id: 'r2', u1: IN(2), v1: IN(-6), u2: IN(6), v2: IN(-2) })
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
