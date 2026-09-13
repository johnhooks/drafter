import type { ValidationError } from '../model/validate'
import { VIEW_FRAMES } from '../projection/frame'
import { SCALES } from './types'

export function validateSheets(value: unknown, counter: unknown, date: unknown): ValidationError[] {
  const errors: ValidationError[] = []
  const err = (path: string, message: string) => errors.push({ path, message })
  if (counter !== undefined && (typeof counter !== 'number' || !Number.isSafeInteger(counter) || counter < 1)) err('nextSheetNumber', 'Must be a positive safe integer')
  if (date !== undefined && (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)))) err('modifiedDate', 'Must be a date in YYYY-MM-DD form')
  if (value === undefined) return errors
  if (!Array.isArray(value)) return [...errors, { path: 'sheets', message: 'Sheets must be a list' }]
  const ids = new Set<string>()
  value.forEach((raw: unknown, index) => {
    const path = `sheets[${index}]`
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return err(path, 'Sheet must be an object')
    const sheet = raw as Record<string, unknown>
    if (typeof sheet['id'] !== 'string' || !sheet['id']) err(`${path}.id`, 'Sheet needs an id')
    else {
      if (ids.has(sheet['id'])) err(`${path}.id`, 'Duplicate sheet id')
      ids.add(sheet['id'])
    }
    if (typeof sheet['name'] !== 'string') err(`${path}.name`, 'Sheet needs a name')
    if (sheet['orientation'] !== 'portrait' && sheet['orientation'] !== 'landscape') err(`${path}.orientation`, 'Must be portrait or landscape')
    if (typeof sheet['view'] !== 'string' || !Object.hasOwn(VIEW_FRAMES, sheet['view'])) err(`${path}.view`, 'Must be front, top, left, or right')
    if (!SCALES.some((scale) => scale === sheet['scale'])) err(`${path}.scale`, 'Unsupported scale')
    if (sheet['targetBodyId'] !== undefined && (typeof sheet['targetBodyId'] !== 'string' || !sheet['targetBodyId'])) err(`${path}.targetBodyId`, 'Must be a body id')
    const annotationIds = new Set<string>()
    for (const kind of ['dimensions', 'notes'] as const) {
      const annotations = sheet[kind]
      if (annotations === undefined) continue
      if (!Array.isArray(annotations)) {
        err(`${path}.${kind}`, 'Annotations must be a list')
        continue
      }
      annotations.forEach((rawAnnotation: unknown, annotationIndex) => {
        const annotationPath = `${path}.${kind}[${annotationIndex}]`
        if (!rawAnnotation || typeof rawAnnotation !== 'object' || Array.isArray(rawAnnotation)) return err(annotationPath, 'Annotation must be an object')
        const annotation = rawAnnotation as Record<string, unknown>
        const id = annotation['id']
        if (typeof id !== 'string' || !id) err(`${annotationPath}.id`, 'Annotation needs an id')
        else {
          if (annotationIds.has(id)) err(`${annotationPath}.id`, 'Duplicate annotation id')
          annotationIds.add(id)
        }
        const point = (field: string, integral: boolean) => {
          const value = annotation[field]
          if (!Array.isArray(value) || value.length !== 2 || ![value[0], value[1]].every((coordinate: unknown) => typeof coordinate === 'number' && (integral ? Number.isSafeInteger(coordinate) : Number.isFinite(coordinate)))) err(`${annotationPath}.${field}`, integral ? 'Must be two safe integer view coordinates' : 'Must be two finite paper coordinates')
        }
        if (kind === 'dimensions') {
          point('first', true)
          point('second', true)
          if (annotation['orientation'] !== 'horizontal' && annotation['orientation'] !== 'vertical') err(`${annotationPath}.orientation`, 'Must be horizontal or vertical')
          if (typeof annotation['position'] !== 'number' || !Number.isSafeInteger(annotation['position'])) err(`${annotationPath}.position`, 'Must be a safe integer view coordinate')
        } else {
          if (typeof annotation['text'] !== 'string') err(`${annotationPath}.text`, 'Note needs text')
          point('position', false)
          if (annotation['leader'] !== undefined) point('leader', true)
        }
      })
    }
  })
  return errors
}
