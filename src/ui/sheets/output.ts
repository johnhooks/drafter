import type { State } from '../store/actions'
import { downloadText, safeName } from '../exportFile'
import { renderSheet } from '../../core/sheets/render'
import { calendarDate } from '../date'
import { cachedIsometric, renderIsometric } from './isoRender'

export function sheetOutput(state: State, id: string, image?: string): string | undefined {
  const result = state.sheets.get(id)
  if (!result) return
  return renderSheet(result.sheet, result.projection, state.doc, state.doc.sheets?.findIndex((sheet) => sheet.id === id) ?? 0, state.doc.sheets?.length ?? 0, state.doc.modifiedDate ?? calendarDate(), image ?? (result.sheet.view === 'isometric' ? cachedIsometric(result.sheet, state.eval) : undefined))
}

export async function exportSheet(state: State) {
  const id = state.mode.kind === 'sheet' ? state.mode.sheetId : undefined
  const sheet = id ? state.sheets.get(id)?.sheet : undefined
  if (!sheet) return
  const image = sheet.view === 'isometric' ? await renderIsometric(sheet, state.eval) : undefined
  const svg = sheetOutput(state, sheet.id, image)
  if (svg) downloadText(`${safeName(state.doc.title)}-${safeName(sheet.name)}.svg`, svg, 'image/svg+xml')
}
