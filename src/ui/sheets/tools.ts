import type { SheetDimension, SheetNote } from '../../core/sheets/types'
import type { Segment } from '../../core/projection/hidden'
import { parseLength } from '../../core/units'
import { DRAG_THRESHOLD_PX, type ToolLifecycle } from '../sketch/tools'

export function parseSheetCoordinate(text: string): { ok: true; value: number } | { ok: false; error: string } {
  const trimmed = text.trim()
  const negative = trimmed.startsWith('-')
  const magnitude = /^[+-]/.test(trimmed) ? trimmed.slice(1).trim() : trimmed
  const length = parseLength(magnitude)
  if (!length.ok) return length
  const value = (negative ? -length.value : length.value) + 0
  return Number.isSafeInteger(value) ? { ok: true, value } : { ok: false, error: 'Coordinate exceeds the exact integer range' }
}

export function parsePaperCoordinate(text: string): { ok: true; value: number } | { ok: false; error: string } {
  const trimmed = text.trim().replace(/"$/, '')
  const number = Number(trimmed)
  if (trimmed && Number.isFinite(number)) return { ok: true, value: number }
  const length = parseSheetCoordinate(text)
  return length.ok ? { ok: true, value: length.value / 16 } : length
}

export type Point = readonly [number, number]

export function pickedSegments(segments: readonly Segment[], points: readonly Point[]): readonly Segment[] {
  return segments.filter((segment) => points.some((point) => {
    const along = segment.dir === 'h' ? 0 : 1
    return point[1 - along] === segment.at && point[along] >= segment.min && point[along] <= segment.max
  }))
}
export type SheetToolName = 'select' | 'dimension' | 'note'
export type SheetAnnotation = { kind: 'dimension'; value: SheetDimension } | { kind: 'note'; value: SheetNote }

export interface SheetPointer {
  readonly point: Point
  readonly raw: Point
  readonly paper: Point
  readonly px: Point
  readonly shift: boolean
  readonly hit?: string
}

export interface SheetToolHost {
  newId(): string
  changed(): void
  annotation(id: string): SheetAnnotation | undefined
  select(id?: string): void
  addDimension(dimension: SheetDimension): void
  addNote(note: SheetNote): void
  update(annotation: SheetAnnotation): void
}

export interface SheetTool extends ToolLifecycle<SheetPointer, SheetToolName> {
  pickedPoints(): readonly Point[]
  preview(): SheetAnnotation | null
  prompt(): SheetNote | null
  commitPrompt(text: string): void
  setText(text: string): void
  edit(note: SheetNote): void
}

abstract class BaseTool implements SheetTool {
  abstract readonly name: SheetToolName
  protected pending: { note: SheetNote; isNew: boolean } | null = null
  constructor(protected host: SheetToolHost) {}
  down(_pointer: SheetPointer) {}
  move(_pointer: SheetPointer) {}
  up(_pointer: SheetPointer) {}
  pickedPoints(): readonly Point[] {
    return []
  }
  key(key: string) {
    if (key === 'Escape' && this.pending) {
      this.cancel()
      return true
    }
    return false
  }
  cancel() {
    this.pending = null
    this.host.changed()
  }
  preview(): SheetAnnotation | null {
    return this.pending ? { kind: 'note', value: this.pending.note } : null
  }
  prompt() {
    return this.pending?.note ?? null
  }
  setText(text: string) {
    if (!this.pending) return
    this.pending = { ...this.pending, note: { ...this.pending.note, text } }
    this.host.changed()
  }
  commitPrompt(text: string) {
    if (!this.pending) return
    const { note, isNew } = this.pending
    this.pending = null
    if (text.trim()) {
      if (isNew) this.host.addNote({ ...note, text })
      else this.host.update({ kind: 'note', value: { ...note, text } })
    }
    this.host.changed()
  }
  edit(note: SheetNote) {
    this.cancel()
    this.pending = { note, isNew: false }
    this.host.select(note.id)
    this.host.changed()
  }
  hint() {
    return 'Enter to save text, Shift+Enter for a new line, Escape to cancel'
  }
}

function dimensionAt(id: string, first: Point, second: Point, point: Point): SheetDimension {
  const outsideU = Math.max(Math.min(first[0], second[0]) - point[0], point[0] - Math.max(first[0], second[0]), 0)
  const outsideV = Math.max(Math.min(first[1], second[1]) - point[1], point[1] - Math.max(first[1], second[1]), 0)
  const horizontal = first[1] === second[1] || (first[0] !== second[0] && (outsideU || outsideV
    ? outsideV >= outsideU
    : Math.abs(point[1] - (first[1] + second[1]) / 2) >= Math.abs(point[0] - (first[0] + second[0]) / 2)))
  return { id, first, second, orientation: horizontal ? 'horizontal' : 'vertical', position: Math.round(point[horizontal ? 1 : 0]) }
}

class DimensionTool extends BaseTool {
  readonly name = 'dimension'
  private first: Point | null = null
  private second: Point | null = null
  private current: Point | null = null
  private id = ''
  private pressed = false
  private skipUp = false
  override pickedPoints(): readonly Point[] {
    return this.first ? this.second ? [this.first, this.second] : [this.first] : []
  }
  override down() {
    this.pressed = true
    this.skipUp = false
  }
  override up(pointer: SheetPointer) {
    this.pressed = false
    if (this.skipUp) {
      this.skipUp = false
      return
    }
    if (!this.first) {
      this.first = pointer.point
      this.id = this.host.newId()
    } else if (!this.second) {
      if (this.first[0] === pointer.point[0] && this.first[1] === pointer.point[1]) return
      this.second = pointer.point
    } else {
      this.host.addDimension(dimensionAt(this.id, this.first, this.second, pointer.point))
      this.cancel()
      return
    }
    this.current = pointer.point
    this.host.changed()
  }
  override move(pointer: SheetPointer) {
    if (!this.first) return
    this.current = pointer.point
    this.host.changed()
  }
  override preview(): SheetAnnotation | null {
    if (!this.first || !this.current) return null
    const second = this.second ?? this.current
    if (this.first[0] === second[0] && this.first[1] === second[1]) return null
    return { kind: 'dimension', value: dimensionAt(this.id, this.first, second, this.current) }
  }
  override key(key: string) {
    if (key !== 'Escape' || (!this.first && !this.pressed)) return false
    this.cancel()
    return true
  }
  override cancel() {
    this.skipUp = this.pressed
    this.pressed = false
    this.first = null
    this.second = null
    this.current = null
    super.cancel()
  }
  override hint() {
    return !this.first ? 'Click the first dimension point' : !this.second ? 'Click the second dimension point; Escape to cancel' : 'Click to place the dimension line; Escape to cancel'
  }
}

class NoteTool extends BaseTool {
  readonly name = 'note'
  private start: SheetPointer | null = null
  private draft: SheetNote | null = null
  override down(pointer: SheetPointer) {
    if (this.pending && !pointer.shift) return
    this.start = pointer
    this.draft = this.pending?.note ?? { id: this.host.newId(), text: '', position: pointer.paper }
  }
  override move(pointer: SheetPointer) {
    if (!this.start?.shift || !this.draft) return
    this.draft = { ...this.draft, leader: pointer.point }
    if (this.pending) this.pending = { ...this.pending, note: this.draft }
    this.host.changed()
  }
  override up(pointer: SheetPointer) {
    if (!this.start || !this.draft) return
    this.move(pointer)
    this.pending = { note: this.draft, isNew: this.pending?.isNew ?? true }
    this.start = null
    this.draft = null
    this.host.changed()
  }
  override preview(): SheetAnnotation | null {
    return this.draft ? { kind: 'note', value: this.draft } : super.preview()
  }
  override key(key: string) {
    if (key === 'Escape' && this.start) {
      this.cancel()
      return true
    }
    return super.key(key)
  }
  override cancel() {
    this.start = null
    this.draft = null
    super.cancel()
  }
  override hint() {
    return this.pending ? super.hint() : 'Click to place a note; Shift-drag from its text position to add a leader'
  }
}

class SelectTool extends BaseTool {
  readonly name = 'select'
  private candidate: { start: SheetPointer; annotation: SheetAnnotation } | null = null
  private latest: SheetAnnotation | null = null
  override down(pointer: SheetPointer) {
    const annotation = pointer.hit ? this.host.annotation(pointer.hit) : undefined
    if (this.pending) return
    this.host.select(annotation?.value.id)
    this.candidate = annotation ? { start: pointer, annotation } : null
    this.latest = null
  }
  override move(pointer: SheetPointer) {
    if (!this.candidate) return
    const { start, annotation } = this.candidate
    if (!this.latest && Math.hypot(pointer.px[0] - start.px[0], pointer.px[1] - start.px[1]) < DRAG_THRESHOLD_PX) return
    if (annotation.kind === 'dimension') {
      const axis = annotation.value.orientation === 'horizontal' ? 1 : 0
      this.latest = { kind: 'dimension', value: { ...annotation.value, position: Math.round(annotation.value.position + pointer.raw[axis] - start.raw[axis]) } }
    } else {
      this.latest = { kind: 'note', value: start.shift
        ? { ...annotation.value, leader: pointer.point }
        : { ...annotation.value, position: [annotation.value.position[0] + pointer.paper[0] - start.paper[0], annotation.value.position[1] + pointer.paper[1] - start.paper[1]] } }
    }
    this.host.changed()
  }
  override up(pointer: SheetPointer) {
    this.move(pointer)
    const latest = this.latest
    this.candidate = null
    this.latest = null
    if (latest) this.host.update(latest)
    this.host.changed()
  }
  override preview() {
    return this.latest ?? super.preview()
  }
  override key(key: string) {
    if (key === 'Escape' && this.candidate) {
      this.cancel()
      return true
    }
    return super.key(key)
  }
  override cancel() {
    this.candidate = null
    this.latest = null
    super.cancel()
  }
  override hint() {
    return this.pending ? super.hint() : 'Click to select; drag to move; Shift-drag a note to add a leader; double-click a note to edit'
  }
}

export function makeSheetTool(name: SheetToolName, host: SheetToolHost): SheetTool {
  if (name === 'dimension') return new DimensionTool(host)
  if (name === 'note') return new NoteTool(host)
  return new SelectTool(host)
}
