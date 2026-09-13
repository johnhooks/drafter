import { expect, it } from 'vitest'
import { project } from '../../../src/core/projection/project'
import { renderSheet } from '../../../src/core/sheets/render'
import { renderAnnotations } from '../../../src/core/sheets/annotations'
import { sheetLayout } from '../../../src/core/sheets/layout'
import type { Sheet, SheetDimension } from '../../../src/core/sheets/types'

const projection = project([], 'front')
const sheet: Sheet = { id: 'sheet', name: 'Sheet', orientation: 'landscape', view: 'front', scale: 4 }

it.each([4, 8] as const)('uses physical line widths at 1:%s', (scale) => {
  const view = { ...projection, segments: [
    { dir: 'h' as const, at: 0, min: 0, max: 16, visible: true },
    { dir: 'h' as const, at: 16, min: 0, max: 16, visible: false },
  ] }
  const svg = renderSheet({ ...sheet, scale, notes: [{ id: 'note', text: 'Note', position: [1, 1], leader: [0, 0] }] }, view, { title: '' }, 0, 1, '')
  expect(svg).toContain(`stroke-width="${0.5 / 25.4}"`)
  expect(svg).toContain(`stroke-width="${0.25 / 25.4}" stroke-dasharray="0.08 0.04"`)
  expect(svg).toMatch(new RegExp(`data-annotation-kind="note"[^>]*stroke-width="${0.25 / 25.4}"`))
  expect(svg).toContain('stroke-width="0.01"')
  expect(svg).toContain('font-size="0.09375"')
})

for (const orientation of ['horizontal', 'vertical'] as const) {
  for (const scale of [4, 8] as const) {
    it.each([-16, -8, -4, -2, 0, 2, 4, 8, 16])(`${orientation} extension at 1:${scale}, offset %s`, (position) => {
      const dimension: SheetDimension = { id: 'dim', orientation, first: [0, 0], second: orientation === 'horizontal' ? [64, 0] : [0, 64], position }
      const current = { ...sheet, scale, dimensions: [dimension] }
      const before = JSON.stringify(current)
      const svg = renderAnnotations(current, projection)
      const lines = [...svg.matchAll(/<line x1="([^"]+)" y1="([^"]+)" x2="([^"]+)" y2="([^"]+)"\/>/g)].map((match) => match.slice(1).map(Number))
      const distance = Math.abs(position) / (16 * scale)
      expect(lines).toHaveLength(distance <= 1 / 16 ? 3 : 5)
      if (distance > 1 / 16) {
        const { originU, originV, factor } = sheetLayout(current, projection.bounds)
        const axis = orientation === 'horizontal' ? 1 : 0
        const origin = axis === 1 ? originV : originU
        const direction = Math.sign(position) * (axis === 1 ? -1 : 1)
        expect(lines[0]![axis]).toBeCloseTo(origin + direction / 16)
        expect(lines[0]![axis + 2]).toBeCloseTo(origin + position * factor * (axis === 1 ? -1 : 1) + direction / 16)
      }
      expect(svg).toContain('>4&quot;</text>')
      expect(JSON.stringify(current)).toBe(before)
    })
  }
}

it('offsets straddling points independently', () => {
  const svg = renderAnnotations({ ...sheet, dimensions: [{ id: 'dim', first: [0, -64], second: [64, 64], orientation: 'horizontal', position: 0 }] }, projection)
  const { originV } = sheetLayout(sheet, projection.bounds)
  expect(svg).toContain(`y1="${originV + 1 - 1 / 16}"`)
  expect(svg).toContain(`y1="${originV - 1 + 1 / 16}"`)
})

it('keeps the isometric image and note endpoints while thinning leaders', () => {
  const svg = renderSheet({ ...sheet, view: 'isometric', camera: { azimuth: -45, elevation: 30 }, notes: [{ id: 'note', text: 'Note', position: [1, 1], leader: [2, 3] }] }, projection, { title: '' }, 0, 1, '', 'data:image/png;base64,test')
  expect(svg).toContain('href="data:image/png;base64,test"')
  expect(svg).toContain(`<g data-annotation-id="note" data-annotation-kind="note" pointer-events="visiblePainted" fill="black" stroke="black" stroke-width="${0.25 / 25.4}"`)
  expect(svg).toContain('<line x1="1" y1="1" x2="2" y2="3"/>')
  expect(svg).toContain('stroke-width="0.01"')
})

it.each([1, 2, 4, 8, 12, 16, 24] as const)('omits exact-gap extensions at 1:%s with off-centre bounds', (scale) => {
  for (const orientation of ['horizontal', 'vertical'] as const) {
    for (const offset of [1, 17, 101]) {
      const view = { ...projection, bounds: { u0: 1, u1: 102, v0: 3, v1: 107 } }
      const dimension: SheetDimension = { id: 'dim', orientation, first: [offset, offset], second: orientation === 'horizontal' ? [offset + 16, offset] : [offset, offset + 16], position: offset + scale }
      const svg = renderAnnotations({ ...sheet, scale, dimensions: [dimension] }, view)
      expect([...svg.matchAll(/<line /g)]).toHaveLength(3)
    }
  }
})
