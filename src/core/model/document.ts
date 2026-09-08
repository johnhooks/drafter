import type { Document } from './types'
import { type ValidationError, validateDocument } from './validate'

export function serializeDocument(doc: Document): string {
  return JSON.stringify(doc, null, 2)
}

export type ParseDocumentResult = { ok: true; doc: Document } | { ok: false; errors: ValidationError[] }

export function parseDocument(text: string): ParseDocumentResult {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch (e) {
    return { ok: false, errors: [{ path: '', message: `Not valid JSON: ${(e as Error).message}` }] }
  }
  const errors = validateDocument(raw)
  if (errors.length) return { ok: false, errors }
  return { ok: true, doc: raw as Document }
}
