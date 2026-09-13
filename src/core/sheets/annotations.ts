import type { Projection } from '../projection/project'
import { formatLength, sx } from '../units'
import { sheetLayout } from './layout'
import { escapeXml } from './titleBlock'
import type { Sheet, SheetDimension } from './types'
import { EXTENSION_GAP, EXTENSION_OVERRUN, THIN_STROKE_WIDTH } from './style'

export type { SheetDimension, SheetNote } from './types'

export const DETACHED_COLOR = 'orange'
const TEXT_HEIGHT = 3 / 32
const GAP = 1 / 16
const TICK = 1 / 32

export interface AnnotationRenderOptions {
  readonly selectedId?: string
}

export function dimensionValue(dimension: SheetDimension): number {
  const axis = dimension.orientation === 'horizontal' ? 0 : 1
  return Math.abs(dimension.second[axis] - dimension.first[axis])
}

export function dimensionDetached(dimension: SheetDimension, projection: Projection): boolean {
  return [dimension.first, dimension.second].some((point) => !projection.vertices.some((vertex) => vertex[0] === point[0] && vertex[1] === point[1]) && !projection.segments.some((segment) => {
    const axis = segment.dir === 'h' ? 0 : 1
    return point[1 - axis] === segment.at && point[axis] >= segment.min && point[axis] <= segment.max
  }))
}

function line(firstX: number, firstY: number, secondX: number, secondY: number): string {
  return `<line x1="${firstX}" y1="${firstY}" x2="${secondX}" y2="${secondY}"/>`
}

export function renderAnnotations(sheet: Sheet, projection: Projection, options: AnnotationRenderOptions = {}): string {
  const { originU, originV, factor } = sheetLayout(sheet, projection.bounds)
  const paper = (point: readonly [number, number]): readonly [number, number] => [originU + point[0] * factor, originV - point[1] * factor]
  const group = (id: string, kind: 'dimension' | 'note', content: string, detached = false) => `<g data-annotation-id="${escapeXml(id)}" data-annotation-kind="${kind}" pointer-events="visiblePainted"${options.selectedId === id ? ' data-selected="true"' : ''}${detached ? ' data-detached="true"' : ''} fill="${detached ? DETACHED_COLOR : 'black'}" stroke="${detached ? DETACHED_COLOR : 'black'}" stroke-width="${THIN_STROKE_WIDTH}" font-size="${TEXT_HEIGHT}">${content}</g>`
  const dimensions = (sheet.dimensions ?? []).map((dimension) => {
    const horizontal = dimension.orientation === 'horizontal'
    const first = paper(dimension.first)
    const second = paper(dimension.second)
    const position = horizontal ? originV - dimension.position * factor : originU + dimension.position * factor
    const firstEnd = horizontal ? [first[0], position] as const : [position, first[1]] as const
    const secondEnd = horizontal ? [second[0], position] as const : [position, second[1]] as const
    const extension = (measured: readonly [number, number]) => {
      const distance = dimension.position - measured[horizontal ? 1 : 0]
      if (Math.abs(distance) <= EXTENSION_GAP * 16 * sheet.scale) return ''
      const point = paper(measured)
      const start = point[horizontal ? 1 : 0]
      const direction = Math.sign(distance) * (horizontal ? -1 : 1)
      const from = start + direction * EXTENSION_GAP
      const to = position + direction * EXTENSION_OVERRUN
      return horizontal ? line(point[0], from, point[0], to) : line(from, point[1], to, point[1])
    }
    const tick = (point: readonly [number, number]) => line(point[0] - TICK, point[1] + TICK, point[0] + TICK, point[1] - TICK)
    const label = formatLength(sx(dimensionValue(dimension)))
    const axis = horizontal ? 0 : 1
    const outside = Math.abs(secondEnd[axis] - firstEnd[axis]) < label.length * TEXT_HEIGHT * 0.6 + GAP * 2
    const along = outside
      ? horizontal ? Math.max(firstEnd[0], secondEnd[0]) + GAP : Math.min(firstEnd[1], secondEnd[1]) - GAP
      : (firstEnd[axis] + secondEnd[axis]) / 2
    const textX = horizontal ? along : position - GAP
    const textY = horizontal ? position - GAP : along
    const text = `<text x="${textX}" y="${textY}" text-anchor="${outside ? 'start' : 'middle'}" stroke="none"${horizontal ? '' : ` transform="rotate(-90 ${textX} ${textY})"`}>${escapeXml(label)}</text>`
    return group(dimension.id, 'dimension', extension(dimension.first) + extension(dimension.second) + line(...firstEnd, ...secondEnd) + tick(firstEnd) + tick(secondEnd) + text, dimensionDetached(dimension, projection))
  }).join('')
  const notes = (sheet.notes ?? []).map((note) => {
    const [textX, textY] = note.position
    let leader = ''
    if (note.leader) {
      const [endX, endY] = sheet.view === 'isometric' ? note.leader : paper(note.leader)
      const distance = Math.hypot(textX - endX, textY - endY)
      const directionX = distance ? (textX - endX) / distance : 1
      const directionY = distance ? (textY - endY) / distance : 0
      const baseX = endX + directionX * GAP
      const baseY = endY + directionY * GAP
      leader = line(textX, textY, endX, endY) + `<polygon points="${endX},${endY} ${baseX - directionY * TICK},${baseY + directionX * TICK} ${baseX + directionY * TICK},${baseY - directionX * TICK}" stroke="none"/>`
    }
    const text = `<text x="${textX}" y="${textY}" stroke="none">${note.text.split(/\r\n|\r|\n/).map((row, index) => `<tspan x="${textX}" y="${textY + index * TEXT_HEIGHT * 1.2}">${escapeXml(row)}</tspan>`).join('')}</text>`
    return group(note.id, 'note', leader + text)
  }).join('')
  return dimensions + notes
}
