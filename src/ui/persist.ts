import { parseDocument, serializeDocument } from '../core/model/document'
import type { Document } from '../core/model/types'

const KEY = 'drawing.document.v1'

export type LoadResult = { kind: 'loaded'; doc: Document } | { kind: 'empty' } | { kind: 'corrupt'; message: string }

export function loadSaved(): LoadResult {
  let text: string | null
  try {
    text = localStorage.getItem(KEY)
  } catch {
    return { kind: 'corrupt', message: 'Browser storage is not available; changes will not be saved.' }
  }
  if (!text) return { kind: 'empty' }
  const r = parseDocument(text)
  if (!r.ok) return { kind: 'corrupt', message: `The saved drawing could not be read (${r.errors[0]?.message ?? 'invalid'}). Starting a new one.` }
  return { kind: 'loaded', doc: r.doc }
}

/** Returns false if saving failed, so the caller can show a notice once. */
export function save(doc: Document): boolean {
  try {
    localStorage.setItem(KEY, serializeDocument(doc))
    return true
  } catch {
    return false
  }
}

const THEME_KEY = 'drawing.theme'

export function loadTheme(): 'light' | 'dark' {
  try {
    return localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

export function saveTheme(theme: 'light' | 'dark') {
  try {
    localStorage.setItem(THEME_KEY, theme)
  } catch {
    // storage may be unavailable; the choice then lasts for the session
  }
}
