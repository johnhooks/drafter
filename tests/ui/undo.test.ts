import { describe, expect, it } from 'vitest'
import { bodyBounds } from '../../src/core/geom/body'
import { rectFromCorners } from '../../src/core/model/sketch'
import { DEFAULT_PLANE, newDocument } from '../../src/core/model/types'
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

describe('undo and redo', () => {
  it('undoes and redoes a distance change and re-evaluates', () => {
    let s = cube()
    const before = s.history.past.length
    s = A.updateExtrude(s, 'e1', { distance: IN(30) })
    expect(bodyBounds(s.eval.bodies.get('e1')!)!.y0).toBe(-IN(30))
    expect(s.history.past.length).toBe(before + 1)
    s = A.undo(s)
    expect(bodyBounds(s.eval.bodies.get('e1')!)!.y0).toBe(-IN(24))
    expect(A.canRedo(s)).toBe(true)
    s = A.redo(s)
    expect(bodyBounds(s.eval.bodies.get('e1')!)!.y0).toBe(-IN(30))
    expect(A.canRedo(s)).toBe(false)
  })

  it('a new edit clears redo', () => {
    let s = A.updateExtrude(cube(), 'e1', { distance: IN(30) })
    s = A.undo(s)
    s = A.updateExtrude(s, 'e1', { distance: IN(36) })
    expect(A.canRedo(s)).toBe(false)
  })

  it('undo on an empty stack is a no-op', () => {
    const s = A.initialState()
    expect(A.undo(s)).toBe(s)
    expect(A.redo(s)).toBe(s)
    expect(A.canUndo(s)).toBe(false)
  })

  it('a cascade delete is one entry', () => {
    let s = cube()
    s = A.addSketch(s, { kind: 'face', featureId: 'e1', face: 'vMax' }, 's2')
    s = A.addRect(s, 's2', rectFromCorners('r2', 'r1', IN(2), IN(-6), IN(6), IN(-2)))
    s = A.addExtrude(s, 's2', ['r2'], IN(3), 'e2')
    s = A.deleteFeature(s, 'e1')
    expect(s.doc.features.map((f) => f.id)).toEqual(['s1'])
    s = A.undo(s)
    expect(s.doc.features.map((f) => f.id)).toEqual(['s1', 'e1', 's2', 'e2'])
  })

  it('typing a name coalesces within two seconds and splits beyond it', () => {
    let s = cube()
    const before = s.history.past.length
    let t = 1000
    for (const ch of ['C', 'Ca', 'Car']) s = A.renameFeature(s, 's1', ch, (t += 100))
    expect(s.history.past.length).toBe(before + 1)
    s = A.undo(s)
    expect(s.doc.features[0]!.name).toBe('Sketch 1')
    s = A.redo(s)
    s = A.renameFeature(s, 's1', 'Carc', t + 5000)
    expect(s.history.past.length).toBe(before + 2)
    // a different field in between breaks the run
    s = A.setTitle(s, 'T', t + 5100)
    s = A.renameFeature(s, 's1', 'Carca', t + 5200)
    expect(s.history.past.length).toBe(before + 4)
  })

  it('caps the stack at the limit', () => {
    let s = cube()
    for (let i = 0; i < A.HISTORY_LIMIT + 20; i++) s = A.updateExtrude(s, 'e1', { distance: IN(25 + (i % 5)) })
    expect(s.history.past.length).toBe(A.HISTORY_LIMIT)
  })

  it('keeps the sketch editor open when the sketch survives, returns to model when it does not', () => {
    let s = cube()
    s = A.addSketch(s, { kind: 'face', featureId: 'e1', face: 'vMax' }, 's2')
    s = A.addRect(s, 's2', rectFromCorners('r2', 'r1', IN(2), IN(-6), IN(6), IN(-2)))
    expect(s.mode).toEqual({ kind: 'sketch', sketchId: 's2' })
    s = A.undo(s)
    expect(s.mode).toEqual({ kind: 'sketch', sketchId: 's2' })
    expect((s.doc.features[2] as unknown as { rects: unknown[] }).rects).toHaveLength(0)
    s = A.undo(s)
    expect(s.mode).toEqual({ kind: 'model' })
    expect(s.selection.featureId).toBeUndefined()
  })

  it('drops a selected body that no longer exists and keeps one that does', () => {
    let s = cube()
    s = A.select(s, { featureId: 'e1', bodyId: 'e1' })
    s = A.updateExtrude(s, 'e1', { distance: IN(30) })
    s = A.undo(s)
    expect(s.selection.bodyId).toBe('e1')
    s = A.undo(s)
    expect(s.selection.bodyId).toBeUndefined()
  })

  it('loading a document clears history', () => {
    let s = A.updateExtrude(cube(), 'e1', { distance: IN(30) })
    s = A.loadDocument(s, newDocument())
    expect(A.canUndo(s)).toBe(false)
    expect(A.canRedo(s)).toBe(false)
  })

  it('every document-changing action grows the undo stack', () => {
    const base = cube()
    const cases: Array<[string, (s: A.State) => A.State]> = [
      ['setTitle', (s) => A.setTitle(s, 'X')],
      ['addSketch', (s) => A.addSketch(s, DEFAULT_PLANE)],
      ['addExtrude', (s) => A.addExtrude(s, 's1', [], IN(2))],
      ['updateExtrude', (s) => A.updateExtrude(s, 'e1', { distance: IN(30) })],
      ['renameFeature', (s) => A.renameFeature(s, 's1', 'Z')],
      ['setSketchPlaneOffset', (s) => A.setSketchPlaneOffset(s, 's1', IN(1))],
      ['addRect', (s) => A.addRect(s, 's1', rectFromCorners('r9', '', 0, 0, 16, 16))],
      ['updateRect', (s) => A.updateRect(s, 's1', rectFromCorners('r1', 'r1', 0, 0, 16, 16))],
      ['setRectSlot', (s) => A.setRectSlot(s, 's1', 'r1', 'u', 'size', IN(10))],
      ['removeRects', (s) => A.removeRects(s, 's1', ['r1'])],
      ['deleteFeature', (s) => A.deleteFeature(s, 'e1')],
      ['addParam', (s) => A.addParam(s, 'ply', '3/4')],
      ['setParamValue', (s) => A.setParamValue(A.addParam(s, 'ply', '3/4'), 'ply', '1/2')],
      ['renameParam', (s) => A.renameParam(A.addParam(s, 'ply', '3/4'), 'ply', 'stock')],
      ['deleteParam', (s) => A.deleteParam(A.addParam(s, 'ply', '3/4'), 'ply')],
      ['removeConstraint', (s) => A.removeConstraint(A.setRectSlot(s, 's1', 'r1', 'u', 'size', '24'), { sketchId: 's1', rectId: 'r1', axis: 'u', slot: 'size' })],
    ]
    for (const [name, run] of cases) {
      const out = run(base)
      expect(out.doc, name).not.toBe(base.doc)
      expect(out.history.past.length, name).toBeGreaterThan(base.history.past.length)
    }
  })
})
