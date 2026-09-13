import type { Document } from '../model/types'
import type { Projection } from '../projection/project'
import type { Sheet } from './types'
import { sheetLayout } from './layout'
import { escapeXml, titleBlock } from './titleBlock'
import { renderAnnotations } from './annotations'

export function renderSheet(sheet: Sheet, projection: Projection, doc: Pick<Document, 'title'>, index: number, total: number, date: string, image?: string): string {
  const layout = sheetLayout(sheet, projection.bounds)
  const { width, height, drawing, factor, originU, originV } = layout
  const clipId = `sheet-clip-${Array.from(sheet.id, (character) => character.codePointAt(0)!.toString(16)).join('-')}`
  const lines = sheet.view === 'isometric'
    ? image ? `<image x="${drawing.x - originU}" y="${drawing.y - originV}" width="${drawing.width}" height="${drawing.height}" href="${escapeXml(image)}"/>` : ''
    : projection.segments.map((segment) => {
    const horizontal = segment.dir === 'h'
    const firstU = (horizontal ? segment.min : segment.at) * factor
    const firstV = -(horizontal ? segment.at : segment.min) * factor
    const secondU = (horizontal ? segment.max : segment.at) * factor
    const secondV = -(horizontal ? segment.at : segment.max) * factor
    return `<line x1="${firstU}" y1="${firstV}" x2="${secondU}" y2="${secondV}"${segment.visible ? '' : ' stroke-dasharray="0.08 0.04"'}/>`
  }).join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}in" height="${height}in" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeXml(sheet.name)}" font-family="sans-serif" fill="black"><title>${escapeXml(doc.title)} - ${escapeXml(sheet.name)}</title><rect width="${width}" height="${height}" fill="white"/><rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" fill="none" stroke="black" stroke-width="0.01"/><defs><clipPath id="${clipId}"><rect x="${drawing.x}" y="${drawing.y}" width="${drawing.width}" height="${drawing.height}"/></clipPath></defs><g clip-path="url(#${clipId})"><g data-sheet-view="${sheet.view}" transform="translate(${originU} ${originV})" fill="none" stroke="black" stroke-width="0.01">${lines}</g></g>${renderAnnotations(sheet, projection)}${titleBlock(sheet, doc.title, index, total, date)}</svg>`
}
