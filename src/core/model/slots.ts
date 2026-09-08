import type { AxisSlots, Len, Slot } from './types'
import { SLOTS, isExpr } from './types'

export interface ResolvedAxis {
  readonly min: number
  readonly max: number
  readonly size: number
}

export function drivenSlots(a: AxisSlots): Slot[] {
  return SLOTS.filter((s) => a[s] !== undefined)
}

export function derivedSlot(a: AxisSlots): Slot | null {
  const d = SLOTS.filter((s) => a[s] === undefined)
  return d.length === 1 ? d[0]! : null
}

export type SetSlotResult = { ok: true; slots: AxisSlots } | { ok: false; error: string }

/**
 * The slot-edit rule: the edited slot is kept, then one more in the order min, size, max.
 * Expressions are never dropped; if both other slots are expressions the edit is refused.
 * `resolved` supplies the current value for a kept slot that was derived.
 */
export function setSlot(a: AxisSlots, slot: Slot, value: Len, resolved: ResolvedAxis): SetSlotResult {
  const others = SLOTS.filter((s) => s !== slot)
  const exprs = others.filter((s) => a[s] !== undefined && isExpr(a[s] as Len))
  if (exprs.length === 2) {
    return { ok: false, error: `${slot} is fixed by ${exprs[0]} (${a[exprs[0]!]}) and ${exprs[1]} (${a[exprs[1]!]})` }
  }
  const keepOrder: Slot[] = ['min', 'size', 'max']
  const kept = exprs.length === 1 ? exprs[0]! : keepOrder.find((s) => s !== slot)!
  const out: Record<Slot, Len | undefined> = { min: undefined, max: undefined, size: undefined }
  out[slot] = value
  out[kept] = a[kept] !== undefined ? a[kept] : (resolved[kept] as Len)
  return { ok: true, slots: out }
}

/** Replaces a driven slot's value in place, keeping which slots are driven. */
export function replaceSlot(a: AxisSlots, slot: Slot, value: Len): AxisSlots {
  return { ...a, [slot]: value }
}

export function deriveAxis(min: number | undefined, max: number | undefined, size: number | undefined): ResolvedAxis {
  if (min !== undefined && max !== undefined) return { min, max, size: max - min }
  if (min !== undefined && size !== undefined) return { min, max: min + size, size }
  if (max !== undefined && size !== undefined) return { min: max - size, max, size }
  throw new Error('An axis needs two driven slots')
}
