import { rectangleLines } from '../../src/core/model/sketch'
import type { RegionRef, SketchLine } from '../../src/core/model/types'

/** Four attached lines for a rectangle with deterministic ids `${p}_l`, `${p}_b`, `${p}_r`, `${p}_t` and handles from `n`. */
export function rectLines(p: string, n: number, u0: number, u1: number, v0: number, v1: number): SketchLine[] {
  return rectangleLines([`${p}_l`, `${p}_b`, `${p}_r`, `${p}_t`], [`l${n}`, `l${n + 1}`, `l${n + 2}`, `l${n + 3}`], u0, u1, v0, v1)
}

/** The region at the lower-left corner of a rectangle made by `rectLines(p, ...)`. */
export const regionOf = (p: string): RegionRef => ({ vertical: `${p}_l`, horizontal: `${p}_b` })

/** A plain horizontal line. */
export const hline = (id: string, handle: string, at: number, min: number, max: number, construction = false): SketchLine => ({
  id,
  handle,
  dir: 'h',
  at,
  run: { min, max },
  ...(construction ? { construction } : {}),
})

/** A plain vertical line. */
export const vline = (id: string, handle: string, at: number, min: number, max: number, construction = false): SketchLine => ({
  id,
  handle,
  dir: 'v',
  at,
  run: { min, max },
  ...(construction ? { construction } : {}),
})
