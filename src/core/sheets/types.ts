import type { ViewKind } from '../projection/frame'

export const SCALES = [1, 2, 4, 8, 12, 16, 24] as const
export type SheetScale = typeof SCALES[number]
export type Orientation = 'portrait' | 'landscape'

export interface Sheet {
  readonly id: string
  readonly name: string
  readonly orientation: Orientation
  readonly view: ViewKind
  readonly targetBodyId?: string
  readonly scale: SheetScale
}

export function nextSheetNumber(sheets: readonly Sheet[], counter = 1): number {
  return sheets.reduce((next, sheet) => {
    const match = /^Sheet (\d+)$/.exec(sheet.name)
    return match ? Math.max(next, Number(match[1]) + 1) : next
  }, counter)
}
