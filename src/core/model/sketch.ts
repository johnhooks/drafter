import { rewriteNames } from '../expr/rewrite'
import type { Sixteenths } from '../units'
import type { LineDir, SketchFeature, SketchLine, SketchRect } from './types'

/** A horizontal or vertical line between two points as plain numbers; null when the points do not share an axis or coincide. */
export function lineFromPoints(id: string, handle: string, u0: number, v0: number, u1: number, v1: number): SketchLine | null {
  if (u0 === u1 && v0 === v1) return null
  if (v0 === v1) return { id, handle, dir: 'h', at: v0 as Sixteenths, run: { min: Math.min(u0, u1) as Sixteenths, max: Math.max(u0, u1) as Sixteenths } }
  if (u0 === u1) return { id, handle, dir: 'v', at: u0 as Sixteenths, run: { min: Math.min(v0, v1) as Sixteenths, max: Math.max(v0, v1) as Sixteenths } }
  return null
}

/** Projects an end point onto the axis the pointer moved farther along, so a drawn line is always axis-aligned. */
export function projectEnd(start: readonly [number, number], end: readonly [number, number]): { dir: LineDir; end: [number, number] } {
  const du = Math.abs(end[0] - start[0])
  const dv = Math.abs(end[1] - start[1])
  return du >= dv ? { dir: 'h', end: [end[0], start[1]] } : { dir: 'v', end: [start[0], end[1]] }
}

/**
 * Four lines enclosing a rectangle, attached at their endpoints: each run end is a bare reference to the
 * position of the perpendicular line it meets, so moving one side keeps the loop closed.
 * Order is left, bottom, right, top; ids and handles are given in the same order.
 */
export function rectangleLines(ids: readonly [string, string, string, string], handles: readonly [string, string, string, string], u0: number, u1: number, v0: number, v1: number): SketchLine[] {
  const [left, bottom, right, top] = handles
  const uMin = Math.min(u0, u1) as Sixteenths
  const uMax = Math.max(u0, u1) as Sixteenths
  const vMin = Math.min(v0, v1) as Sixteenths
  const vMax = Math.max(v0, v1) as Sixteenths
  return [
    { id: ids[0], handle: left, dir: 'v', at: uMin, run: { min: `${bottom}.at`, max: `${top}.at` } },
    { id: ids[1], handle: bottom, dir: 'h', at: vMin, run: { min: `${left}.at`, max: `${right}.at` } },
    { id: ids[2], handle: right, dir: 'v', at: uMax, run: { min: `${bottom}.at`, max: `${top}.at` } },
    { id: ids[3], handle: top, dir: 'h', at: vMax, run: { min: `${left}.at`, max: `${right}.at` } },
  ]
}

/**
 * The line expression a rectangle property stands for, so references survive when the rectangle goes:
 * `r1.right` is `l3.at`, `r1.width` is `(l3.at - l1.at)`, and the middles are the near line plus half.
 */
export function rectPropAsLines(prop: string, handles: readonly [string, string, string, string]): string | undefined {
  const [left, bottom, right, top] = handles
  switch (prop) {
    case 'left':
      return `${left}.at`
    case 'right':
      return `${right}.at`
    case 'bottom':
      return `${bottom}.at`
    case 'top':
      return `${top}.at`
    case 'width':
      return `(${right}.at - ${left}.at)`
    case 'height':
      return `(${top}.at - ${bottom}.at)`
    case 'umid':
      return `(${left}.at + (${right}.at - ${left}.at) / 2)`
    case 'vmid':
      return `(${bottom}.at + (${top}.at - ${bottom}.at) / 2)`
    default:
      return undefined
  }
}

/** Rewrites every expression in the sketch that names `rect` to the equivalent over its member lines. */
export function rewriteRectRefs(sketch: SketchFeature, rect: SketchRect): SketchFeature {
  const handles = rect.lines.map((id) => sketch.lines.find((l) => l.id === id)?.handle ?? id) as [string, string, string, string]
  const fix = (v: SketchLine['at']) => (typeof v === 'string' ? rewriteNames(v, (path) => (path.length === 2 && path[0] === rect.handle ? rectPropAsLines(path[1]!, handles) : undefined)) : v)
  const lines = sketch.lines.map((l) => {
    const run = { ...l.run }
    for (const k of ['min', 'max', 'size'] as const) if (run[k] !== undefined) run[k] = fix(run[k]!)
    const at = fix(l.at)
    return at === l.at && run.min === l.run.min && run.max === l.run.max && run.size === l.run.size ? l : { ...l, at, run }
  })
  return lines.every((l, i) => l === sketch.lines[i]) ? sketch : { ...sketch, lines }
}

/** True when every driven slot is a plain number, so the line can be read without evaluation. */
export function isPlainLine(l: SketchLine): boolean {
  return [l.at, l.run.min, l.run.max, l.run.size].every((x) => x === undefined || typeof x === 'number')
}

/** Expression properties a line of this direction has, for error messages and validation. */
export function lineProperties(dir: LineDir): readonly string[] {
  return dir === 'h' ? ['left', 'right', 'mid', 'length', 'at'] : ['bottom', 'top', 'mid', 'length', 'at']
}
