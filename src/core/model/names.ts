import type { Document, Feature } from './types'

const LABEL: Record<Feature['kind'], string> = { sketch: 'Sketch', extrude: 'Extrude' }

/** Next auto name for a kind: one past the highest number already used by that kind. */
export function nextName(doc: Document, kind: Feature['kind']): string {
  const label = LABEL[kind]
  const re = new RegExp(`^${label} (\\d+)$`)
  let max = 0
  for (const f of doc.features) {
    if (f.kind !== kind) continue
    const m = re.exec(f.name)
    if (m) max = Math.max(max, Number(m[1]))
  }
  return `${label} ${max + 1}`
}

/** Next handle like r4 or s2: one past the highest number in use with that prefix. */
export function nextHandle(prefix: string, existing: Iterable<string>): string {
  const re = new RegExp(`^${prefix}(\\d+)$`)
  let max = 0
  for (const h of existing) {
    const m = re.exec(h)
    if (m) max = Math.max(max, Number(m[1]))
  }
  return `${prefix}${max + 1}`
}

let counter = 0
export function newId(prefix: string): string {
  counter += 1
  return `${prefix}_${Date.now().toString(36)}${counter.toString(36)}`
}
