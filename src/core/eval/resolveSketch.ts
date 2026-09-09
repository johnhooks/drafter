import { type LineProps, type Scope, type Value, evaluateExpr, lineRunProps, position, rectProps } from '../expr/evaluate'
import { parse, references } from '../expr/parser'
import type { Axis } from '../geom/box'
import type { Rect2 } from '../geom/rect2d'
import { FRAMES } from '../model/planes'
import { type ResolvedAxis, deriveAxis } from '../model/slots'
import type { AxisSlots, Len, LineDir, LineSlot, ResolvedPlane, SketchFeature, SketchLine, Slot } from '../model/types'
import { isExpr } from '../model/types'

export interface ResolvedLine {
  readonly id: string
  readonly handle: string
  readonly dir: LineDir
  /** Position on the axis the line crosses. */
  readonly at: number
  /** Extent along the axis the line runs on. */
  readonly min: number
  readonly max: number
  readonly size: number
  readonly construction: boolean
}

export interface SketchResolution {
  readonly lines: Map<string, ResolvedLine>
  readonly errors: Map<string, string>
  /** Per line and slot, the evaluated value of each driven slot, for display beside expressions. */
  readonly slotValues: Map<string, Partial<Record<LineSlot, number>>>
}

export interface SketchScopeInput {
  readonly params: ReadonlyMap<string, Value>
  readonly face?: Rect2
  readonly noFaceReason?: string
}

type NodeKind = 'at' | 'run'
const nodeKey = (id: string, kind: NodeKind) => `${id}:${kind}`

/** Axis a line's position lies on, and the axis it runs along, in model terms. */
export function lineAxes(dir: LineDir, plane: ResolvedPlane): { at: Axis; run: Axis } {
  const frame = FRAMES[plane.plane]
  return dir === 'h' ? { at: frame.v, run: frame.u } : { at: frame.u, run: frame.v }
}

/**
 * Resolves every line's position and run in dependency order between slots. A line's position and
 * its run are separate nodes, so a rectangle whose sides attach to each other's positions is not a cycle.
 */
export function resolveSketch(sketch: SketchFeature, plane: ResolvedPlane, input: SketchScopeInput): SketchResolution {
  const frame = FRAMES[plane.plane]
  const lines = new Map<string, ResolvedLine>()
  const errors = new Map<string, string>()
  const slotValues: SketchResolution['slotValues'] = new Map()
  const byHandle = new Map(sketch.lines.map((l) => [l.handle, l]))
  const scopeLines = new Map<string, LineProps>()
  const faceProps = input.face ? rectProps(input.face, frame.u, frame.v) : undefined
  const scope: Scope = { params: input.params, lines: scopeLines, face: faceProps, noFaceReason: input.noFaceReason }

  // dependency graph between nodes: an at-node, and a run-node, per line
  const deps = new Map<string, Set<string>>()
  const parseErrors = new Map<string, string>()
  const addDeps = (node: string, exprs: string[]) => {
    const d = new Set<string>()
    for (const v of exprs) {
      try {
        for (const ref of references(parse(v))) {
          if (ref.length !== 2) continue
          const other = byHandle.get(ref[0]!)
          if (!other) continue
          d.add(nodeKey(other.id, ref[1] === 'at' ? 'at' : 'run'))
        }
      } catch (e) {
        parseErrors.set(node, `Bad expression "${v}": ${(e as Error).message}`)
      }
    }
    deps.set(node, d)
  }
  for (const l of sketch.lines) {
    addDeps(nodeKey(l.id, 'at'), isExpr(l.at) ? [l.at] : [])
    addDeps(nodeKey(l.id, 'run'), slotExprs(l.run))
  }

  // Kahn's algorithm over nodes; whatever never reaches zero in-degree is on or behind a cycle
  const remaining = new Map<string, Set<string>>([...deps].map(([h, d]) => [h, new Set(d)]))
  const order: string[] = []
  let progress = true
  while (progress) {
    progress = false
    for (const [n, d] of remaining) {
      if (d.size === 0) {
        order.push(n)
        remaining.delete(n)
        for (const other of remaining.values()) other.delete(n)
        progress = true
      }
    }
  }
  const nodeErrors = new Map<string, string>()
  const cyclic = [...remaining.keys()]
  if (cyclic.length) {
    const handles = [...new Set(cyclic.map((n) => sketch.lines.find((l) => l.id === n.split(':')[0])!.handle))]
    for (const n of cyclic) nodeErrors.set(n, `Circular reference between ${handles.join(', ')}`)
  }

  const nodeValues = new Map<string, number | ResolvedAxis>()
  const values = new Map<string, Partial<Record<LineSlot, number>>>()
  for (const l of sketch.lines) values.set(l.id, {})

  for (const node of order) {
    const [id, kind] = node.split(':') as [string, NodeKind]
    const l = sketch.lines.find((x) => x.id === id)!
    const pe = parseErrors.get(node)
    if (pe) {
      nodeErrors.set(node, pe)
      continue
    }
    const failedDep = [...deps.get(node)!].find((d) => nodeErrors.has(d))
    if (failedDep) {
      const dl = sketch.lines.find((x) => x.id === failedDep.split(':')[0])!
      nodeErrors.set(node, `${dl.handle} failed`)
      continue
    }
    const axes = lineAxes(l.dir, plane)
    try {
      if (kind === 'at') {
        const v = evalSlot(l.at, axes.at, scope, `${l.handle} position`)
        values.get(l.id)!['at'] = v
        nodeValues.set(node, v)
        const props = scopeLines.get(l.handle) ?? { dir: l.dir, values: {} }
        props.values['at'] = position(v, axes.at)
        scopeLines.set(l.handle, props)
      } else {
        const out = resolveAxis(l.run, axes.run, scope, l.handle)
        if (out.axis.size <= 0) throw new Error(`Length must be greater than zero (got ${out.axis.size / 16}")`)
        Object.assign(values.get(l.id)!, out.values)
        nodeValues.set(node, out.axis)
        const props = scopeLines.get(l.handle) ?? { dir: l.dir, values: {} }
        Object.assign(props.values, lineRunProps(l.dir, out.axis.min, out.axis.max, axes.run))
        scopeLines.set(l.handle, props)
      }
    } catch (e) {
      nodeErrors.set(node, e instanceof Error ? e.message : String(e))
    }
  }

  for (const l of sketch.lines) {
    const atErr = nodeErrors.get(nodeKey(l.id, 'at'))
    const runErr = nodeErrors.get(nodeKey(l.id, 'run'))
    slotValues.set(l.id, values.get(l.id)!)
    if (atErr || runErr) {
      errors.set(l.id, atErr ?? runErr!)
      continue
    }
    const at = nodeValues.get(nodeKey(l.id, 'at')) as number
    const run = nodeValues.get(nodeKey(l.id, 'run')) as ResolvedAxis
    lines.set(l.id, { id: l.id, handle: l.handle, dir: l.dir, at, min: run.min, max: run.max, size: run.size, construction: !!l.construction })
  }
  return { lines, errors, slotValues }
}

function slotExprs(a: AxisSlots): string[] {
  return [a.min, a.max, a.size].filter((x): x is string => typeof x === 'string')
}

/** A position slot: a number, or an expression giving a length or a position on this axis. */
function evalSlot(v: Len, axis: Axis, scope: Scope, label: string): number {
  if (!isExpr(v)) return v
  const out = evaluateExpr(v, scope)
  if (out.kind === 'position' && out.axis !== axis) throw new Error(`${label} "${v}" is a ${out.axis.toUpperCase()} position, but this slot is on the ${axis.toUpperCase()} axis`)
  return out.value
}

function resolveAxis(a: AxisSlots, axis: Axis, scope: Scope, handle: string) {
  const values: Partial<Record<Slot, number>> = {}
  const get = (slot: Slot): number | undefined => {
    const v: Len | undefined = a[slot]
    if (v === undefined) return undefined
    if (!isExpr(v)) {
      values[slot] = v
      return v
    }
    const out = evaluateExpr(v, scope)
    if (slot === 'size') {
      if (out.kind !== 'length') throw new Error(`${handle} size "${v}" is a position; a size must be a length`)
    } else if (out.kind === 'position' && out.axis !== axis) {
      throw new Error(`${handle} ${slot} "${v}" is a ${out.axis.toUpperCase()} position, but this slot is on the ${axis.toUpperCase()} axis`)
    }
    values[slot] = out.value
    return out.value
  }
  return { axis: deriveAxis(get('min'), get('max'), get('size')), values }
}

/** Endpoints of a resolved line in plane coordinates: [u0, v0, u1, v1]. */
export function lineEnds(l: ResolvedLine): [number, number, number, number] {
  return l.dir === 'h' ? [l.min, l.at, l.max, l.at] : [l.at, l.min, l.at, l.max]
}

export type { SketchLine }
