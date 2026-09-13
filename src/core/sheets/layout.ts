import type { Rect2 } from '../geom/rect2d'
import { type Orientation, type Sheet, SCALES } from './types'

export function pageLayout(orientation: Orientation) {
  const [width, height] = orientation === 'landscape' ? [11, 8.5] : [8.5, 11]
  return { width, height, drawing: { x: 0.5, y: 0.5, width: width - 1, height: height - 2 }, title: { x: width - 5.5, y: height - 1.5, width: 5, height: 1 } }
}

export function defaultScale(bounds: Rect2 | null, orientation: Orientation) {
  const { drawing } = pageLayout(orientation)
  return SCALES.find((scale) => !bounds || ((bounds.u1 - bounds.u0) / (16 * scale) <= drawing.width && (bounds.v1 - bounds.v0) / (16 * scale) <= drawing.height)) ?? 24
}

export function sheetLayout(sheet: Sheet, bounds: Rect2 | null) {
  const page = pageLayout(sheet.orientation)
  const factor = 1 / (16 * sheet.scale)
  const viewWidth = bounds ? (bounds.u1 - bounds.u0) * factor : 0
  const viewHeight = bounds ? (bounds.v1 - bounds.v0) * factor : 0
  const originU = page.drawing.x + page.drawing.width / 2 - (bounds ? (bounds.u0 + bounds.u1) * factor / 2 : 0)
  const originV = page.drawing.y + page.drawing.height / 2 + (bounds ? (bounds.v0 + bounds.v1) * factor / 2 : 0)
  const warnings = viewWidth > page.drawing.width || viewHeight > page.drawing.height ? ['The view exceeds the drawing area; choose a smaller scale.'] : []
  return { ...page, factor, viewWidth, viewHeight, originU, originV, warnings }
}
