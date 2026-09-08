import { migrateV1 } from './migrate'
import type { Document } from './types'
import { type ValidationError, validateDocument } from './validate'

export function serializeDocument(doc: Document): string {
  return JSON.stringify(doc, null, 2)
}

export type ParseDocumentResult = { ok: true; doc: Document } | { ok: false; errors: ValidationError[] }

/** Accepts version 1 and 2 files; version 1 is migrated on read and always saved as 2. */
export function parseDocument(text: string): ParseDocumentResult {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch (e) {
    return { ok: false, errors: [{ path: '', message: `Not valid JSON: ${(e as Error).message}` }] }
  }
  if (typeof raw === 'object' && raw !== null && (raw as Record<string, unknown>)['version'] === 1) {
    raw = migrateV1(raw as Record<string, unknown>)
  }
  const errors = validateDocument(raw)
  if (errors.length) return { ok: false, errors }
  return { ok: true, doc: raw as Document }
}
