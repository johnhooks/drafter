import type { ViewKind } from '../projection/frame'

export interface SheetDimension {
  readonly id: string
  readonly first: readonly [number, number]
  readonly second: readonly [number, number]
  readonly orientation: 'horizontal' | 'vertical'
  readonly position: number
}

export interface SheetNote {
  readonly id: string
  readonly text: string
  readonly position: readonly [number, number]
  readonly leader?: readonly [number, number]
}

export const SCALES = [1, 2, 4, 8, 12, 16, 24] as const
export type SheetScale = typeof SCALES[number]
export type Orientation = 'portrait' | 'landscape'

export interface Sheet {
  readonly id: string
  readonly name: string
  readonly orientation: Orientation
  readonly view: ViewKind | 'isometric'
  readonly camera?: { readonly azimuth: number; readonly elevation: number }
  readonly targetBodyId?: string
  readonly scale: SheetScale
  readonly dimensions?: readonly SheetDimension[]
  readonly notes?: readonly SheetNote[]
}

export function nextSheetNumber(sheets: readonly Sheet[], counter = 1): number {
  return sheets.reduce((next, sheet) => {
    const match = /^Sheet (\d+)$/.exec(sheet.name)
    return match ? Math.max(next, Number(match[1]) + 1) : next
  }, counter)
}
