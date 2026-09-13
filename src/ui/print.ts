import type { State } from './store/actions'
import { sheetOutput } from './sheets/output'
import { renderIsometric, renderIsometricSync } from './sheets/isoRender'
import './print.css'

let cleanPrint: (() => void) | undefined

function prepareSheets(state: State, all: boolean) {
  const selected = state.mode.kind === 'sheet' ? state.mode.sheetId : undefined
  const sheets = (state.doc.sheets ?? []).filter((sheet) => all || sheet.id === selected)
  if (!sheets.length) return
  cleanPrint?.()
  const container = document.createElement('div')
  container.id = 'sheet-print'
  for (const sheet of sheets) {
    const page = document.createElement('section')
    page.className = `print-${sheet.orientation}`
    const image = sheet.view === 'isometric' ? renderIsometricSync(sheet, state.eval) : undefined
    page.innerHTML = sheetOutput(state, sheet.id, image) ?? ''
    container.append(page)
  }
  const cleanup = () => {
    container.remove()
    window.removeEventListener('afterprint', cleanup)
    if (cleanPrint === cleanup) cleanPrint = undefined
  }
  cleanPrint = cleanup
  window.addEventListener('afterprint', cleanup)
  document.body.append(container)
  return cleanup
}

export function listenForPrint(getState: () => State, onError: (error: unknown) => void) {
  const beforePrint = () => {
    try {
      if (!cleanPrint) prepareSheets(getState(), false)
    } catch (error) {
      onError(error)
    }
  }
  window.addEventListener('beforeprint', beforePrint)
  return () => {
    window.removeEventListener('beforeprint', beforePrint)
    cleanPrint?.()
  }
}

export async function printSheets(state: State, all: boolean) {
  const selected = state.mode.kind === 'sheet' ? state.mode.sheetId : undefined
  const sheets = (state.doc.sheets ?? []).filter((sheet) => (all || sheet.id === selected) && sheet.view === 'isometric')
  await Promise.all(sheets.map(async (sheet) => {
    const image = new Image()
    image.src = await renderIsometric(sheet, state.eval)
    await image.decode()
  }))
  const cleanup = prepareSheets(state, all)
  if (!cleanup) return
  try {
    window.print()
  } catch (error) {
    cleanup()
    throw error
  }
}
