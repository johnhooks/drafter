import { migrateV1, migrateV2, migrateV3, migrateV4 } from './migrate'
import type { Document, DocumentFile } from './types'
import { type ValidationError, validateFile } from './validate'

export function serializeDocument(file: DocumentFile): string {
  return JSON.stringify(file, null, 2)
}

export type ParseDocumentResult = { ok: true; file: DocumentFile } | { ok: false; errors: ValidationError[] }

/** Accepts versions 1 to 5; earlier versions are migrated on read and always saved as 5. */
export function parseDocument(text: string): ParseDocumentResult {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch (e) {
    return { ok: false, errors: [{ path: '', message: `Not valid JSON: ${(e as Error).message}` }] }
  }
  if (typeof raw === 'object' && raw !== null) {
    const r = raw as Record<string, unknown>
    if (r['version'] === 1) raw = migrateV3(migrateV2(migrateV1(r)))
    else if (r['version'] === 2) raw = migrateV3(migrateV2(r))
    else if (r['version'] === 3) raw = migrateV3(r)
    else if (r['version'] === 4) raw = migrateV4(r)
  }
  const errors = validateFile(raw)
  if (errors.length) return { ok: false, errors }
  return { ok: true, file: raw as DocumentFile }
}

/** The model alone, for tests and tools that do not care about the view. */
export function modelOf(file: DocumentFile): Document {
  return file.model
}
