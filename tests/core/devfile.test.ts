import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { bodyVolume } from '../../src/core/geom/body'
import { evaluate } from '../../src/core/eval/evaluate'
import { parseDocument } from '../../src/core/model/document'

/**
 * A development file saved as version 2: twelve plain rectangles, one expression-driven rectangle
 * inside another, and eight extrudes. Volumes are the rectangle areas times the distances, except
 * Extrude 2, whose rectangle r4 is subdivided by r13: the migrated extrude keeps the corner region only.
 */
const file = readFileSync(new URL('./fixtures/dev-cabinets.v2.json', import.meta.url), 'utf8')

describe('development file migration', () => {
  it('loads as version 5 and evaluates to the expected bodies', () => {
    const r = parseDocument(file)
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.file.version).toBe(5)
    const ev = evaluate(r.file.model)
    // Extrude 7 is a cut with no target, as it was before migration
    expect(ev.errors.map((e) => e.featureId)).toEqual(['e_mtszt21p1'])
    const vol = (id: string) => bodyVolume(ev.bodies.get(id)!)
    expect(vol('e_mts7zas84')).toBe(120640 * 384)
    expect(vol('e_mts92kxdj')).toBe(190848 * 400)
    expect(vol('e_mts93g34l')).toBe(202516 * 192)
    expect(vol('e_mts94gvin')).toBe(171024 * 384)
    expect(vol('e_mts94oroo')).toBe(258720 * 384)
    expect(vol('e_mtsqbp8a1')).toBe(276480 * 384)
    // r4 is 232 by 509; r13 inside it (inset 3", 2", and 2" by expression) is 152 by 477, and the extrude of r4 now excludes it
    expect(vol('e_mts8z6tji')).toBe((232 * 509 - 152 * 477) * 192)
    // the inner region exists and can be added back to the extrude by hand
    const sr = ev.results.get('s_mts7uly41') ?? [...ev.results.values()].find((x) => x.kind === 'sketch')
    expect(sr?.kind === 'sketch' && sr.regions.some((x) => x.area === 152 * 477)).toBe(true)
  })
})
