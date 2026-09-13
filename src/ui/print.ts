import type { State } from './store/actions'
import { sheetOutput } from './sheets/output'
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
    page.innerHTML = sheetOutput(state, sheet.id) ?? ''
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

export function listenForPrint(getState: () => State) {
  const beforePrint = () => {
    if (!cleanPrint) prepareSheets(getState(), false)
  }
  window.addEventListener('beforeprint', beforePrint)
  return () => {
    window.removeEventListener('beforeprint', beforePrint)
    cleanPrint?.()
  }
}

export function printSheets(state: State, all: boolean) {
  const cleanup = prepareSheets(state, all)
  if (!cleanup) return
  try {
    window.print()
  } catch (error) {
    cleanup()
    throw error
  }
}
