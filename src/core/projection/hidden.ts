import type { Rect2 } from '../geom/rect2d'

export interface Segment {
  readonly dir: 'h' | 'v'
  readonly at: number
  readonly min: number
  readonly max: number
  readonly visible: boolean
}

export interface Candidate extends Omit<Segment, 'visible'> {
  readonly depth: number
}

export interface Occluder extends Rect2 {
  readonly depth: number
}

export function classify(edge: Candidate, occluders: readonly Occluder[]): Segment[] {
  const covered = occluders.filter((face) => face.depth > edge.depth
    && (edge.dir === 'h' ? edge.at >= face.v0 && edge.at <= face.v1 : edge.at >= face.u0 && edge.at <= face.u1))
    .map((face) => [Math.max(edge.min, edge.dir === 'h' ? face.u0 : face.v0), Math.min(edge.max, edge.dir === 'h' ? face.u1 : face.v1)] as const)
    .filter(([min, max]) => min < max)
  const points = [...new Set([edge.min, edge.max, ...covered.flat()])].sort((first, second) => first - second)
  return points.slice(1).map((max, index) => {
    const min = points[index]!
    return { dir: edge.dir, at: edge.at, min, max, visible: !covered.some(([start, end]) => start <= min && end >= max) }
  })
}

export function mergeSegments(segments: readonly Segment[]): Segment[] {
  const groups = new Map<string, Segment[]>()
  for (const segment of segments) {
    const key = `${segment.dir}:${segment.at}`
    const group = groups.get(key) ?? []
    group.push(segment)
    groups.set(key, group)
  }
  const merged: Segment[] = []
  for (const group of groups.values()) {
    const points = [...new Set(group.flatMap((segment) => [segment.min, segment.max]))].sort((first, second) => first - second)
    let previous: Segment | undefined
    for (let index = 1; index < points.length; index++) {
      const min = points[index - 1]!
      const max = points[index]!
      const covering = group.filter((segment) => segment.min <= min && segment.max >= max)
      if (!covering.length) continue
      const visible = covering.some((segment) => segment.visible)
      if (previous?.max === min && previous.visible === visible) {
        previous = { ...previous, max }
        merged[merged.length - 1] = previous
      } else {
        previous = { dir: group[0]!.dir, at: group[0]!.at, min, max, visible }
        merged.push(previous)
      }
    }
  }
  return merged.sort((first, second) => first.dir.localeCompare(second.dir) || first.at - second.at || first.min - second.min)
}
