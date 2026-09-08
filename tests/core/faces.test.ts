import { describe, expect, it } from 'vitest'
import { box } from '../../src/core/geom/box'
import { cut, join, newBody } from '../../src/core/geom/body'
import { faces } from '../../src/core/geom/faces'

const cube = () => newBody('b1', 'Body', box(0, 24, 0, 24, 0, 24))

describe('faces', () => {
  it('six faces of one box', () => {
    const f = faces(cube())
    expect(f).toHaveLength(6)
    const keys = f.map((x) => `${x.axis}${x.dir > 0 ? '+' : '-'}`).sort()
    expect(keys).toEqual(['x+', 'x-', 'y+', 'y-', 'z+', 'z-'])
    for (const face of f) expect(face.area).toBe(24 * 24)
  })

  it('merged top face after join', () => {
    const b = join(cube(), box(24, 48, 0, 24, 0, 24))
    const top = faces(b).filter((f) => f.axis === 'z' && f.dir === 1)
    expect(top).toHaveLength(1)
    expect(top[0]!.area).toBe(48 * 24)
    expect(top[0]!.loops).toHaveLength(1)
    // no internal face at x = 24
    expect(faces(b).filter((f) => f.axis === 'x' && f.coord === 24)).toHaveLength(0)
  })

  it('pocket creates faces', () => {
    const b = cut(cube(), box(10, 14, 10, 14, 22, 30))
    const all = faces(b)
    const top = all.filter((f) => f.axis === 'z' && f.dir === 1)
    expect(top).toHaveLength(2)
    const ring = top.find((f) => f.coord === 24)!
    const floor = top.find((f) => f.coord === 22)!
    expect(ring.loops).toHaveLength(2)
    expect(ring.area).toBe(24 * 24 - 16)
    expect(floor.area).toBe(16)
    const pocketWalls = all.filter((f) => f.axis !== 'z' && f.area === 4 * 2)
    expect(pocketWalls).toHaveLength(4)
  })

  it('through hole faces', () => {
    const b = cut(cube(), box(10, 14, -1, 25, 10, 14))
    const front = faces(b).filter((f) => f.axis === 'y' && f.dir === -1)
    expect(front).toHaveLength(1)
    expect(front[0]!.loops).toHaveLength(2)
  })
})
