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
  })
  return errors
}
