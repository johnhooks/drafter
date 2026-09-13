import { expect, it } from 'vitest'
import { newFile } from '../../../src/core/model/types'
import { parseDocument, serializeDocument } from '../../../src/core/model/document'
import { validateSheets } from '../../../src/core/sheets/validate'
import { renderSheet } from '../../../src/core/sheets/render'
import { project } from '../../../src/core/projection/project'

const sheet = { id: 'iso', name: 'Iso', view: 'isometric' as const, orientation: 'landscape' as const, scale: 4 as const, camera: { azimuth: 37, elevation: 28 }, notes: [{ id: 'note', text: 'Detail', position: [1, 2] as const, leader: [2.25, 3.125] as const }] }

it('round trips captured orientation and paper-space leaders', () => {
  const file = { ...newFile(), sheets: [sheet] }
  expect(parseDocument(serializeDocument(file))).toEqual({ ok: true, file })
})

it.each([undefined, null, {}, { azimuth: Infinity, elevation: 0 }, { azimuth: 0, elevation: '30' }])('rejects invalid captured camera %j', (camera) => {
  expect(validateSheets([{ ...sheet, camera }], undefined, undefined).some((error) => error.path.endsWith('camera'))).toBe(true)
})

it('rejects projected dimensions on isometric sheets', () => {
  expect(validateSheets([{ ...sheet, dimensions: [{ id: 'dim', first: [0, 0], second: [16, 0], position: 0, orientation: 'horizontal' }] }], undefined, undefined).some((error) => error.path.endsWith('dimensions'))).toBe(true)
})

it.each([4, 8] as const)('renders an embedded image, ratio 1:%s and a paper-space leader', (scale) => {
  const svg = renderSheet({ ...sheet, scale }, project([], 'front'), { title: 'Drawing' }, 0, 1, '2026-09-13', 'data:image/png;base64,test')
  expect(svg).toContain('<image')
  expect(svg).toContain('href="data:image/png;base64,test"')
  expect(svg).toContain(`Isometric   1:${scale}`)
  expect(svg).not.toContain('NTS')
  expect(svg).toContain('x2="2.25" y2="3.125"')
})
