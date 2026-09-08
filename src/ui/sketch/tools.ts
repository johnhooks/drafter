import { newId } from '../../core/model/names'
import type { SketchRect } from '../../core/model/types'
import type { Snapped } from '../../core/snap'
import type { Sixteenths } from '../../core/units'

export interface PreviewRect {
  readonly u0: number
  readonly u1: number
  readonly v0: number
  readonly v1: number
}

export interface PointerInfo {
  readonly snapped: Snapped
  readonly shift: boolean
  /** Rect id under the pointer, if any. */
  readonly hit?: string
}

export interface ToolHost {
  addRect(rect: SketchRect): void
  toggleRect(id: string, additive: boolean): void
  clearSelection(): void
  deleteSelection(): void
  changed(): void
}

/**
 * A tool is a small state machine. `preview()` is rendered through the same code as
 * committed rectangles so what you see while dragging is exactly what gets committed.
 */
export interface Tool {
  readonly name: 'select' | 'rect'
  down(p: PointerInfo): void
  move(p: PointerInfo): void
  up(p: PointerInfo): void
  /** Returns true if the key was handled. */
  key(key: string): boolean
  cancel(): void
  preview(): PreviewRect[]
}

export class RectTool implements Tool {
  readonly name = 'rect'
  private start: Snapped | null = null
  private current: Snapped | null = null
  constructor(private host: ToolHost) {}
  down(p: PointerInfo) {
    this.start = p.snapped
    this.current = p.snapped
    this.host.changed()
  }
  move(p: PointerInfo) {
    if (!this.start) return
    this.current = p.snapped
    this.host.changed()
  }
  up(p: PointerInfo) {
    if (!this.start) return
    const s = this.start
    const e = p.snapped
    this.start = null
    this.current = null
    if (s.u !== e.u && s.v !== e.v) {
      this.host.addRect({ id: newId('r'), u1: s.u, v1: s.v, u2: e.u, v2: e.v })
    }
    this.host.changed()
  }
  key(key: string) {
    if (key === 'Escape' && this.start) {
      this.cancel()
      return true
    }
    return false
  }
  cancel() {
    this.start = null
    this.current = null
    this.host.changed()
  }
  preview(): PreviewRect[] {
    if (!this.start || !this.current) return []
    return [{ u0: this.start.u, u1: this.current.u, v0: this.start.v, v1: this.current.v }]
  }
}

export class SelectTool implements Tool {
  readonly name = 'select'
  constructor(private host: ToolHost) {}
  down(p: PointerInfo) {
    if (p.hit) this.host.toggleRect(p.hit, p.shift)
    else if (!p.shift) this.host.clearSelection()
  }
  move() {}
  up() {}
  key(key: string) {
    if (key === 'Delete' || key === 'Backspace') {
      this.host.deleteSelection()
      return true
    }
    return false
  }
  cancel() {}
  preview(): PreviewRect[] {
    return []
  }
}

export function makeTool(name: Tool['name'], host: ToolHost): Tool {
  return name === 'rect' ? new RectTool(host) : new SelectTool(host)
}

export const DEFAULT_EXTRUDE: Sixteenths = 16 as Sixteenths
