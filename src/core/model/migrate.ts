/** Version 1 stored rectangles as two corners and had no parameters or handles. */
export function migrateV1(raw: Record<string, unknown>): Record<string, unknown> {
  const features = Array.isArray(raw['features']) ? (raw['features'] as Array<Record<string, unknown>>) : []
  let sketchN = 0
  const out = features.map((f) => {
    if (f['kind'] !== 'sketch') return f
    sketchN += 1
    const rects = Array.isArray(f['rects']) ? (f['rects'] as Array<Record<string, unknown>>) : []
    return {
      ...f,
      handle: `s${sketchN}`,
      rects: rects.map((r, i) => ({
        id: r['id'],
        handle: `r${i + 1}`,
        u: { min: Math.min(num(r['u1']), num(r['u2'])), max: Math.max(num(r['u1']), num(r['u2'])) },
        v: { min: Math.min(num(r['v1']), num(r['v2'])), max: Math.max(num(r['v1']), num(r['v2'])) },
      })),
    }
  })
  return { ...raw, version: 2, params: [], features: out }
}

function num(v: unknown): number {
  return typeof v === 'number' ? v : Number.NaN
}
