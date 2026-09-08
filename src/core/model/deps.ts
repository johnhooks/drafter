import type { Document } from './types'

/** Direct dependents: features that reference `id` (sketch plane, extrude sketch, or extrude target body). */
export function directDependents(doc: Document, id: string): string[] {
  const out: string[] = []
  for (const f of doc.features) {
    if (f.kind === 'sketch' && f.plane.kind === 'face' && f.plane.featureId === id) out.push(f.id)
    if (f.kind === 'extrude' && (f.sketchId === id || f.targetBodyId === id)) out.push(f.id)
  }
  return out
}

/** Everything that would be removed with `id`, in document order, `id` first. */
export function dependentsOf(doc: Document, id: string): string[] {
  const seen = new Set<string>([id])
  const stack = [id]
  while (stack.length) {
    const cur = stack.pop()!
    for (const d of directDependents(doc, cur)) {
      if (!seen.has(d)) {
        seen.add(d)
        stack.push(d)
      }
    }
  }
  return doc.features.filter((f) => seen.has(f.id)).map((f) => f.id)
}
