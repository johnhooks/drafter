import type { State } from '../store/actions'
import { downloadText, safeName } from '../exportFile'
import { renderSheet } from '../../core/sheets/render'
import { calendarDate } from '../date'

export function sheetOutput(state: State, id: string): string | undefined {
  const result = state.sheets.get(id)
  if (!result) return
  return renderSheet(result.sheet, result.projection, state.doc, state.doc.sheets?.findIndex((sheet) => sheet.id === id) ?? 0, state.doc.sheets?.length ?? 0, state.doc.modifiedDate ?? calendarDate())
}

export function exportSheet(state: State) {
  const id = state.mode.kind === 'sheet' ? state.mode.sheetId : undefined
  const sheet = id ? state.sheets.get(id)?.sheet : undefined
  if (!sheet) return
  const svg = sheetOutput(state, sheet.id)
  if (svg) downloadText(`${safeName(state.doc.title)}-${safeName(sheet.name)}.svg`, svg, 'image/svg+xml')
}
