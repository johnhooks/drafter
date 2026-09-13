import type { EvalResult } from '../eval/evaluate'
import { type Projection, project } from '../projection/project'
import type { Sheet } from './types'
import { sheetLayout } from './layout'

export interface SheetResult {
  readonly sheet: Sheet
  readonly projection: Projection
  readonly warnings: readonly string[]
}

export function evaluateSheets(sheets: readonly Sheet[], model: EvalResult, previous?: ReadonlyMap<string, SheetResult>): ReadonlyMap<string, SheetResult> {
  return new Map(sheets.map((sheet) => {
    const cached = previous?.get(sheet.id)
    const target = sheet.targetBodyId ? model.bodies.get(sheet.targetBodyId) : undefined
    const projection = cached && cached.sheet.view === sheet.view && cached.sheet.targetBodyId === sheet.targetBodyId
      ? cached.projection : project(sheet.targetBodyId ? (target ? [target] : []) : [...model.bodies.values()], sheet.view)
    const warnings = [...sheetLayout(sheet, projection.bounds).warnings]
    if (sheet.targetBodyId && !target) warnings.push(`Body ${sheet.targetBodyId} no longer exists.`)
    return [sheet.id, { sheet, projection, warnings }]
  }))
}
