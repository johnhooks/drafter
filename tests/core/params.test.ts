import { describe, expect, it } from 'vitest'
import { evaluateParams, renameParam, usesOf, validateParamName } from '../../src/core/model/params'
import { DEFAULT_PLANE, type Document, newDocument } from '../../src/core/model/types'
import { nextHandle } from '../../src/core/model/names'
import { hline, vline } from './fixtures'

describe('parameters', () => {
  it('evaluate in order, parameter from parameter', () => {
    const r = evaluateParams([
      { name: 'ply', value: '3/4' },
      { name: 'dado', value: 'ply / 2' },
    ])
    expect(r.values.get('ply')?.value).toBe(12)
    expect(r.values.get('dado')?.value).toBe(6)
    expect(r.errors.size).toBe(0)
  })
  it('later parameter is unknown', () => {
    const r = evaluateParams([
      { name: 'a', value: 'b + 1' },
      { name: 'b', value: 16 as never },
    ])
    expect(r.errors.get('a')).toMatch(/Unknown name b/)
  })
  it('names', () => {
    expect(validateParamName('3ply', [])).toMatch(/must start/)
    expect(validateParamName('face', [])).toMatch(/reserved/)
    expect(validateParamName('ply', ['ply'])).toMatch(/exists/)
    expect(validateParamName('ply_2', [])).toBeNull()
  })
  const doc: Document = {
    ...newDocument('t'),
    params: [
      { name: 'ply', value: 12 as never },
      { name: 'dado', value: 'ply/2' },
    ],
    features: [
      {
        kind: 'sketch',
        id: 's1',
        handle: 's1',
        name: 'Sketch 1',
        plane: { ...DEFAULT_PLANE, offset: 'ply' },
        lines: [{ ...hline('a', 'l1', 0, 0, 16), run: { min: 0, size: 'ply * 2' } }, vline('b', 'l2', 0, 0, 8)],
      },
      { kind: 'extrude', id: 'e1', name: 'Extrude 1', sketchId: 's1', regions: [{ vertical: 'b', horizontal: 'a' }], distance: '-(ply)', op: 'new' },
    ],
  }
  it('usesOf lists every place', () => {
    expect(usesOf(doc, 'ply').map((u) => u.where)).toEqual(['parameter dado', 'Sketch 1 plane offset', 'l1 size in Sketch 1', 'Extrude 1 distance'])
    expect(usesOf(doc, 'nothing')).toEqual([])
  })
  it('rename rewrites exactly the references', () => {
    const out = renameParam(doc, 'ply', 'stock')
    expect(out.params).toEqual([
      { name: 'stock', value: 12 },
      { name: 'dado', value: 'stock/2' },
    ])
    const s = out.features[0]!
    expect(s.kind === 'sketch' && s.plane.kind === 'principal' && s.plane.offset).toBe('stock')
    expect(s.kind === 'sketch' && s.lines[0]!.run.size).toBe('stock * 2')
    expect(out.features[1]).toMatchObject({ distance: '-(stock)' })
    // untouched expression strings are the same objects
    expect(renameParam(doc, 'zzz', 'y')).toBe(doc)
  })
  it('nextHandle skips to one past the highest', () => {
    expect(nextHandle('r', ['r1', 'r3'])).toBe('r4')
    expect(nextHandle('r', [])).toBe('r1')
    expect(nextHandle('s', ['s2', 'x9'])).toBe('s3')
  })
})
