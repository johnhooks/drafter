import { describe, expect, it } from 'vitest'
import { box } from '../../../src/core/geom/box'
import { cut, join, newBody } from '../../../src/core/geom/body'
import { project } from '../../../src/core/projection/project'

const solid = newBody('body', 'Body', box(0, 24, -12, 0, 0, 30))

describe('orthographic projection', () => {
  it('projects a box with four visible edges and exact view bounds', () => {
    const result = project([solid], 'front')
    expect(result.bounds).toEqual({ u0: 0, u1: 24, v0: 0, v1: 30 })
    expect(result.segments).toHaveLength(4)
    expect(result.segments.every((segment) => segment.visible)).toBe(true)
    expect(result.vertices).toEqual([[0, 0], [0, 30], [24, 0], [24, 30]])
    expect(project([solid], 'top').bounds).toEqual({ u0: 0, u1: 24, v0: -12, v1: 0 })
  })

  it('mirrors left and right while retaining height', () => {
    expect(project([solid], 'right').bounds).toEqual({ u0: -12, u1: 0, v0: 0, v1: 30 })
    expect(project([solid], 'left').bounds).toEqual({ u0: 0, u1: 12, v0: 0, v1: 30 })
  })

  it('shows the pocket floor and walls hidden behind the front face', () => {
    const pocket = cut(solid, box(6, 18, -9, -3, 12, 30))
    const result = project([pocket], 'front')
    expect(result.segments.filter((segment) => !segment.visible)).toEqual([
      { dir: 'h', at: 12, min: 6, max: 18, visible: false },
      { dir: 'v', at: 6, min: 12, max: 30, visible: false },
      { dir: 'v', at: 18, min: 12, max: 30, visible: false },
    ])
    expect(result.vertices).toContainEqual([6, 12])
    expect(result.vertices).toContainEqual([18, 12])
    expect(result.segments.filter((segment) => segment.visible)).toHaveLength(4)
  })

  it('keeps a through hole visible', () => {
    const result = project([cut(solid, box(6, 18, -12, 0, 8, 22))], 'front')
    expect(result.segments).toHaveLength(8)
    expect(result.segments.every((segment) => segment.visible)).toBe(true)
  })

  it('hides a box behind another body and splits partly covered edges', () => {
    const rear = newBody('rear', 'Rear', box(6, 18, 3, 6, 8, 22))
    expect(project([solid, rear], 'front').segments.filter((segment) => !segment.visible)).toHaveLength(4)
    const crossing = newBody('crossing', 'Crossing', box(18, 36, 3, 6, 8, 22))
    const result = project([solid, crossing], 'front')
    expect(result.segments).toContainEqual({ dir: 'h', at: 8, min: 18, max: 24, visible: false })
    expect(result.segments).toContainEqual({ dir: 'h', at: 8, min: 24, max: 36, visible: true })
  })

  it('removes coplanar joins and redundant collinear splits', () => {
    const joined = join(solid, box(24, 48, -12, 0, 0, 30))
    const result = project([joined], 'front')
    expect(result.segments).toHaveLength(4)
    expect(result.segments).toContainEqual({ dir: 'h', at: 0, min: 0, max: 48, visible: true })
  })

  it('handles empty geometry and coincident edges with visible winning', () => {
    expect(project([], 'front')).toEqual({ segments: [], vertices: [], bounds: null })
    const rear = newBody('rear', 'Rear', box(0, 24, 2, 4, 0, 30))
    const result = project([solid, rear], 'front')
    expect(result.segments).toHaveLength(4)
    expect(result.segments.every((segment) => segment.visible)).toBe(true)
  })
})
