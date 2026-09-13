import { describe, expect, it } from 'vitest'
import { box } from '../../../src/core/geom/box'
import { newBody } from '../../../src/core/geom/body'
import { evaluate } from '../../../src/core/eval/evaluate'
import { parseDocument, serializeDocument } from '../../../src/core/model/document'
import { newFile } from '../../../src/core/model/types'
import { project } from '../../../src/core/projection/project'
import { renderSheet } from '../../../src/core/sheets/render'
import { evaluateSheets } from '../../../src/core/sheets/evaluate'
import { dimensionDetached, dimensionValue, renderAnnotations } from '../../../src/core/sheets/annotations'
import { validateSheets } from '../../../src/core/sheets/validate'

const dimension = { id: 'width', first: [0, 480] as const, second: [384, 0] as const, orientation: 'horizontal' as const, position: -32 }
const note = { id: 'note', text: '3/4 ply\n<&"\'>', position: [1.25, 2.375] as const, leader: [384, 0] as const }
const sheet = { id: 'sheet', name: 'Front', orientation: 'landscape' as const, view: 'front' as const, scale: 4 as const }
const body = newBody('body', 'Body', box(0, 384, -192, 0, 0, 480))
const projection = project([body], 'front')
const render = (patch = {}) => renderSheet({ ...sheet, ...patch }, projection, { title: 'Drawing' }, 0, 1, '2026-09-12')
const validate = (patch: object) => validateSheets([{ ...sheet, ...patch }], undefined, undefined)

describe('sheet annotations', () => {
  it('round trips two dimensions and a multiline note without changing version', () => {
    const file = { ...newFile(), sheets: [{ ...sheet, dimensions: [dimension, { ...dimension, id: 'height', orientation: 'vertical' as const }], notes: [note] }] }
    expect(parseDocument(serializeDocument(file))).toEqual({ ok: true, file })
    expect(file.version).toBe(6)
    expect(validate({ dimensions: [], notes: [] })).toEqual([])
  })

  it.each([
    { dimensions: null }, { dimensions: {} }, { notes: 'note' },
    { dimensions: [null] }, { notes: [[]] },
    ...[{ id: '' }, { id: 2 }, { first: [1.5, 0] }, { second: [0, Number.MAX_SAFE_INTEGER + 1] }, { first: [0] }, { first: [0, 1, 2] }, { position: 1.5 }, { position: Infinity }, { orientation: 'aligned' }].map((patch) => ({ dimensions: [{ ...dimension, ...patch }] })),
    ...[{ id: '' }, { text: null }, { position: [Infinity, 0] }, { position: [0] }, { leader: [0.5, 0] }, { leader: null }].map((patch) => ({ notes: [{ ...note, ...patch }] })),
    { dimensions: [dimension, dimension] }, { notes: [note, note] }, { dimensions: [dimension], notes: [{ ...note, id: dimension.id }] },
  ])('rejects malformed annotations: %j', (patch) => {
    expect(validate(patch).length).toBeGreaterThan(0)
  })

  it('accepts finite decimal paper positions and integral negative view positions', () => {
    expect(validate({ dimensions: [dimension], notes: [note, { id: 'free', text: '', position: [-1.125, 0] }] })).toEqual([])
  })

  it('renders true horizontal values at either scale with fixed paper styling', () => {
    for (const scale of [4, 8]) {
      const svg = render({ dimensions: [dimension], scale })
      expect(svg).toContain('data-annotation-id="width" data-annotation-kind="dimension"')
      expect(svg).toContain('pointer-events="visiblePainted"')
      expect(svg).not.toContain('pointer-events="bounding-box"')
      expect(svg).toContain('>24&quot;</text>')
      expect(svg).toContain('font-size="0.09375"')
    }
  })

  it('leaves absent and empty annotations identical', () => {
    expect(render({ dimensions: [], notes: [] })).toBe(render())
  })

  it('places short horizontal text outside and vertical text reading upward', () => {
    const small = { ...dimension, first: [0, 0], second: [8, 0], position: 0 }
    const horizontal = render({ scale: 8, dimensions: [small] })
    expect(horizontal).toContain('>1/2&quot;</text>')
    const text = horizontal.match(/<text x="([^"]+)" y="([^"]+)"[^>]*>1\/2&quot;<\/text>/)!
    expect(Number(text[1])).toBeGreaterThan(4.0625)
    expect(Number(text[2])).toBeLessThan(5.625)
    const vertical = render({ dimensions: [{ ...dimension, orientation: 'vertical', position: 0 }] })
    expect(vertical).toContain('>30&quot;</text>')
    expect(vertical).toMatch(/transform="rotate\(-90 [^)]+\)"/)
    expect(vertical).toContain('<line x1="2.5" y1="0" x2="2.5" y2="7.5"/>')
  })

  it('draws dimension extensions past the line and ticks with centred text', () => {
    const svg = render({ dimensions: [dimension] })
    expect(svg).toContain('<line x1="2.5" y1="0.0625" x2="2.5" y2="8.0625"/>')
    expect(svg).toContain('<line x1="8.5" y1="7.5625" x2="8.5" y2="8.0625"/>')
    expect(svg).toContain('<line x1="2.5" y1="8" x2="8.5" y2="8"/>')
    expect(svg).toContain('x="5.5" y="7.9375" text-anchor="middle"')
    expect(svg).toContain('<line x1="2.46875" y1="8.03125" x2="2.53125" y2="7.96875"/>')
  })

  it('keeps note text on paper and moves leader endpoints with the view scale', () => {
    for (const [scale, end] of [[4, '8.5" y2="7.5'], [8, '7" y2="5.625']]) {
      const svg = render({ scale, notes: [{ ...note, id: '<&"\'>' }] })
      expect(svg).toContain('data-annotation-id="&lt;&amp;&quot;&apos;&gt;" data-annotation-kind="note"')
      expect(svg).toContain('<text x="1.25" y="2.375"')
      expect(svg).toContain('&lt;&amp;&quot;&apos;&gt;</tspan>')
      expect(svg).toContain(`<line x1="1.25" y1="2.375" x2="${end}"/>`)
      expect(svg).toContain('<polygon points="')
      expect(svg).not.toContain('<marker')
    }
  })

  it('warns when either endpoint detaches while preserving its stored value', () => {
    const annotated = { ...sheet, dimensions: [dimension] }
    const model = evaluate(newFile().model)
    const initial = evaluateSheets([annotated], { ...model, bodies: new Map([[body.id, body]]) }).get(sheet.id)!
    expect(initial.warnings.filter((warning) => warning.includes('detached'))).toEqual([])
    const narrowed = newBody('body', 'Body', box(0, 192, -192, 0, 0, 480))
    const updated = evaluateSheets([annotated], { ...model, bodies: new Map([[narrowed.id, narrowed]]) }).get(sheet.id)!
    expect(updated.warnings).toContain('Dimension width is detached from the view.')
    const svg = renderSheet(annotated, updated.projection, { title: '' }, 0, 1, '')
    expect(svg).toContain('data-detached="true"')
    expect(svg).toContain('stroke="orange"')
    expect(svg).toContain('>24&quot;</text>')
  })

  it('measures only the chosen axis, including reversed endpoints', () => {
    expect(dimensionValue(dimension)).toBe(384)
    expect(dimensionValue({ ...dimension, first: dimension.second, second: dimension.first })).toBe(384)
    expect(dimensionValue({ ...dimension, orientation: 'vertical' })).toBe(480)
    expect(dimensionValue({ ...dimension, second: dimension.first })).toBe(0)
  })

  it('recognizes vertices, merged segment interiors, and hidden segments', () => {
    expect(dimensionDetached(dimension, projection)).toBe(false)
    expect(dimensionDetached({ ...dimension, first: [96, 0], second: [288, 0] }, projection)).toBe(false)
    expect(dimensionDetached({ ...dimension, first: [0, 96], second: [0, 288] }, projection)).toBe(false)
    expect(dimensionDetached(dimension, { ...projection, segments: [] })).toBe(false)
    expect(dimensionDetached(dimension, { ...projection, vertices: [], segments: projection.segments.map((segment) => ({ ...segment, visible: false })) })).toBe(false)
    expect(dimensionDetached({ ...dimension, first: [96, 96] }, projection)).toBe(true)
    expect(dimensionDetached(dimension, project([], 'front'))).toBe(true)
  })

  it('keeps attachment after another body changes and reevaluates cached annotation warnings', () => {
    const other = newBody('other', 'Other', box(800, 960, -192, 0, 0, 160))
    const model = { ...evaluate(newFile().model), bodies: new Map([[body.id, body], [other.id, other]]) }
    const annotated = { ...sheet, dimensions: [dimension] }
    const initial = evaluateSheets([annotated], model)
    const changed = { ...model, bodies: new Map([[body.id, body], [other.id, newBody('other', 'Other', box(800, 880, -192, 0, 0, 160))]]) }
    const result = evaluateSheets([annotated], changed).get(sheet.id)!
    expect(dimensionDetached(dimension, result.projection)).toBe(false)
    expect(result.warnings.some((warning) => warning.includes('detached'))).toBe(false)
    const detached = evaluateSheets([{ ...annotated, dimensions: [{ ...dimension, first: [96, 96] }] }], model, initial).get(sheet.id)!
    expect(detached.projection).toBe(initial.get(sheet.id)!.projection)
    expect(detached.warnings).toContain('Dimension width is detached from the view.')
  })

  it('returns a pure SVG fragment with optional selection and no leader for free notes', () => {
    const annotated = { ...sheet, notes: [{ ...note, leader: undefined }] }
    const original = JSON.stringify(annotated)
    const svg = renderAnnotations(annotated, projection, { selectedId: note.id })
    expect(svg).toContain('data-selected="true"')
    expect(svg).toContain('y="2.4875"')
    expect(svg).not.toContain('<line')
    expect(svg).not.toContain('<polygon')
    expect(JSON.stringify(annotated)).toBe(original)
    expect(renderAnnotations(sheet, projection)).toBe('')
  })

  it('positions every note row explicitly so empty lines retain their spacing', () => {
    const svg = render({ notes: [{ ...note, position: [1, 1], text: 'First\n\nThird' }] })
    expect(svg).toContain('<tspan x="1" y="1">First</tspan>')
    expect(svg).toContain('<tspan x="1" y="1.1125"></tspan>')
    expect(svg).toContain('<tspan x="1" y="1.225">Third</tspan>')
  })
})
