import { describe, expect, it } from 'vitest'
import { box } from '../../../src/core/geom/box'
import { cut, newBody } from '../../../src/core/geom/body'
import { parseDocument, serializeDocument } from '../../../src/core/model/document'
import { newFile } from '../../../src/core/model/types'
import { project } from '../../../src/core/projection/project'
import { defaultScale, sheetLayout } from '../../../src/core/sheets/layout'
import { renderSheet } from '../../../src/core/sheets/render'
import type { Sheet } from '../../../src/core/sheets/types'

const sheet: Sheet = { id: 'sheet-1', name: 'Case Front', orientation: 'landscape', view: 'front', scale: 4 }

describe('drawing sheets', () => {
  it('keeps clip identifiers unique and URL-safe for imported sheet ids', () => {
    const ids = ['sheet 1', 'sheet%201', 'sheet#1', 'sheet-1', '图纸', 'sheet_20_1']
    const clips = ids.map((id) => {
      const svg = renderSheet({ ...sheet, id }, project([], 'front'), { title: 'Test' }, 0, 1, '2026-09-12')
      const clip = svg.match(/<clipPath id="([^"]+)"/)![1]!
      expect(decodeURIComponent(clip)).toBe(clip)
      expect(clip).toMatch(/^[a-zA-Z][a-zA-Z0-9_-]*$/)
      expect(svg).toContain(`clip-path="url(#${clip})"`)
      return clip
    })
    expect(new Set(clips).size).toBe(ids.length)
  })

  it('loads version 5 unchanged and saves ordered sheets and their counter in version 6', () => {
    const old = parseDocument(JSON.stringify({ ...newFile(), version: 5 }))
    expect(old.ok).toBe(true)
    if (!old.ok) return
    expect(old.file.version).toBe(6)
    expect(old.file.sheets).toBeUndefined()
    const file = { ...old.file, sheets: [sheet, { ...sheet, id: 'sheet-2' }], nextSheetNumber: 3 }
    expect(parseDocument(serializeDocument(file))).toEqual({ ok: true, file })
  })

  it('validates sheets, duplicate ids, counters, and missing target ids by shape only', () => {
    const valid = { ...newFile(), sheets: [{ ...sheet, targetBodyId: 'missing-body' }], nextSheetNumber: 3 }
    expect(parseDocument(JSON.stringify(valid)).ok).toBe(true)
    for (const patch of [{ scale: 3 }, { view: 'isometric' }, { orientation: 'square' }, { id: '' }, { targetBodyId: 12 }, { name: null }]) {
      expect(parseDocument(JSON.stringify({ ...valid, sheets: [{ ...sheet, ...patch }] })).ok).toBe(false)
    }
    for (const nextSheetNumber of [0, -1, 1.5, '3']) expect(parseDocument(JSON.stringify({ ...valid, nextSheetNumber })).ok).toBe(false)
    expect(parseDocument(JSON.stringify({ ...valid, sheets: [sheet, sheet] })).ok).toBe(false)
  })

  it('chooses the largest fitting scale and centres oversized views without shrinking them', () => {
    expect(defaultScale({ u0: 0, u1: 60 * 16, v0: 0, v1: 36 * 16 }, 'landscape')).toBe(8)
    const layout = sheetLayout(sheet, { u0: 0, u1: 24 * 16, v0: 0, v1: 30 * 16 })
    expect(layout.width).toBe(11)
    expect(layout.height).toBe(8.5)
    expect(layout.viewWidth).toBe(6)
    expect(layout.viewHeight).toBe(7.5)
    expect(layout.originU + 3).toBe(layout.drawing.x + layout.drawing.width / 2)
    expect(layout.originV - 3.75).toBe(layout.drawing.y + layout.drawing.height / 2)
    expect(layout.warnings).toHaveLength(1)
  })

  it('renders standalone paper SVG, escaped title text and dashed hidden edges', () => {
    const body = cut(newBody('body', 'Body', box(0, 384, -192, 0, 0, 480)), box(96, 288, -144, -48, 192, 480))
    const svg = renderSheet(sheet, project([body], 'front'), { ...newFile().model, title: 'Case <A> & B' }, 1, 3, '2026-09-08')
    expect(svg).toContain('width="11in" height="8.5in"')
    expect(svg).toContain('Case &lt;A&gt; &amp; B')
    for (const text of ['Case Front', 'Front', '1:4', '2026-09-08', 'Sheet 2 of 3']) expect(svg).toContain(text)
    expect(svg).toContain('stroke-dasharray="0.08 0.04"')
    expect(svg).toContain('data-reference-bar="1"')
    expect(svg).toContain('clipPath')
    expect(svg).toMatchSnapshot()
  })
})
