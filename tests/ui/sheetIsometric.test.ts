import { expect, it } from 'vitest'
import * as actions from '../../src/ui/store/actions'
import { newBody } from '../../src/core/geom/body'
import { box } from '../../src/core/geom/box'

it('captures the camera on creation and locks sheet direction', () => {
  const initial = actions.setCamera(actions.initialState(), { azimuth: 70, elevation: 25 })
  const state = actions.addSheet(initial, 'iso', 'isometric')
  expect(state.doc.sheets?.[0]?.camera).toEqual({ azimuth: 70, elevation: 25 })
  expect(actions.setCamera(state, { azimuth: 10 }).doc.sheets).toBe(state.doc.sheets)
  expect(actions.updateSheet(state, 'iso', { view: 'front' }).doc).toBe(state.doc)
  expect(actions.updateSheet(state, 'iso', { camera: { azimuth: 0, elevation: 0 } }).doc).toBe(state.doc)
  expect(actions.redo(actions.undo(state)).doc.sheets).toEqual(state.doc.sheets)
  expect(actions.loadFile(state, actions.fileOf(state)).doc.sheets).toEqual(state.doc.sheets)
})

it('chooses a fitting projected scale and preserves it through edits and reload', () => {
  const initial = actions.setCamera(actions.initialState(), { azimuth: -90, elevation: 0 })
  const body = newBody('body', 'Body', box(0, 384, 0, 1600, 0, 384))
  const state = actions.addSheet({ ...initial, eval: { ...initial.eval, bodies: new Map([[body.id, body]]) } }, 'iso', 'isometric')
  expect(state.doc.sheets?.[0]?.scale).toBe(4)
  expect(state.sheets.get('iso')?.warnings).toEqual([])
  const enlarged = actions.updateSheet(state, 'iso', { scale: 1 })
  expect(enlarged.doc.sheets?.[0]?.scale).toBe(1)
  expect(enlarged.sheets.get('iso')?.warnings.join()).toContain('exceeds')
  expect(actions.updateSheet(enlarged, 'iso', { orientation: 'portrait' }).doc.sheets?.[0]?.scale).toBe(1)
  expect(actions.undo(enlarged).doc.sheets?.[0]?.scale).toBe(4)
  expect(actions.loadFile(enlarged, actions.fileOf(enlarged)).doc.sheets?.[0]?.scale).toBe(1)
})

it('uses 1:1 for an empty target and warns at 1:24 if nothing fits', () => {
  const initial = actions.initialState()
  expect(actions.addSheet(initial, 'empty', 'isometric').doc.sheets?.[0]?.scale).toBe(1)
  const body = newBody('body', 'Body', box(0, 16000, 0, 16000, 0, 16000))
  const state = actions.addSheet({ ...initial, eval: { ...initial.eval, bodies: new Map([[body.id, body]]) } }, 'large', 'isometric')
  expect(state.doc.sheets?.[0]?.scale).toBe(24)
  expect(state.sheets.get('large')?.warnings.join()).toContain('exceeds')
})

it('locks existing orthographic sheets and refuses isometric dimensions', () => {
  const state = actions.addSheet(actions.initialState(), 'front')
  expect(actions.updateSheet(state, 'front', { view: 'top' }).doc).toBe(state.doc)
  const iso = actions.addSheet(actions.setSheetTool(state, 'dimension'), 'iso', 'isometric')
  expect(iso.sheetTool).toBe('select')
  expect(actions.setSheetTool(iso, 'dimension').sheetTool).toBe('select')
  const dimension = { id: 'dim', first: [0, 0] as const, second: [16, 0] as const, orientation: 'horizontal' as const, position: 0 }
  expect(actions.addSheetDimension(iso, 'iso', dimension).doc).toBe(iso.doc)
  const active = actions.setSheetTool(actions.setMode(iso, { kind: 'sheet', sheetId: 'front' }), 'dimension')
  expect(actions.setMode(active, { kind: 'sheet', sheetId: 'iso' }).sheetTool).toBe('select')
  expect(actions.deleteSheet(active, 'front').sheetTool).toBe('select')
})
