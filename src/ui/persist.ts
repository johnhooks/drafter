import { parseDocument, serializeDocument } from '../core/model/document'
import type { DocumentFile } from '../core/model/types'
import { DEFAULT_DISPLAY, type Display } from './store/actions'

const KEY = 'drafter.document.v1'
/** The key the app used under its old name; read once so a stored model comes along, then written under the new key. */
const OLD_KEY = 'drawing.document.v1'

export type LoadResult = { kind: 'loaded'; file: DocumentFile } | { kind: 'empty' } | { kind: 'corrupt'; message: string }

export function loadSaved(): LoadResult {
  let text: string | null
  try {
    text = localStorage.getItem(KEY) ?? localStorage.getItem(OLD_KEY)
  } catch {
    return { kind: 'corrupt', message: 'Browser storage is not available; changes will not be saved.' }
  }
  if (!text) return { kind: 'empty' }
  const r = parseDocument(text)
  if (!r.ok) return { kind: 'corrupt', message: `The saved document could not be read (${r.errors[0]?.message ?? 'invalid'}). Starting a new one.` }
  // a model found only under the old key is written under the new one at once, before any edit would
  save(r.file)
  return { kind: 'loaded', file: r.file }
}

/** Returns false if saving failed, so the caller can show a notice once. */
export function save(file: DocumentFile): boolean {
  try {
    localStorage.setItem(KEY, serializeDocument(file))
    return true
  } catch {
    return false
  }
}

const THEME_KEY = 'drafter.theme'

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

const DISPLAY_KEY = 'drafter.display'

/** The sketch display toggles; anything missing or malformed falls back to the default. */
export function loadDisplay(): Display {
  try {
    const raw = JSON.parse(localStorage.getItem(DISPLAY_KEY) ?? '{}') as Record<string, unknown>
    const pick = (k: keyof Display) => (typeof raw[k] === 'boolean' ? (raw[k] as boolean) : DEFAULT_DISPLAY[k])
    return { grid: pick('grid'), dims: pick('dims'), handles: pick('handles'), sizes: pick('sizes') }
  } catch {
    return DEFAULT_DISPLAY
  }
}

export function saveDisplay(display: Display) {
  try {
    localStorage.setItem(DISPLAY_KEY, JSON.stringify(display))
  } catch {
    // storage may be unavailable; the choice then lasts for the session
  }
}
