import type { Sheet } from './types'
import { pageLayout } from './layout'

export const VIEW_NAMES: Readonly<Record<Sheet['view'], string>> = { front: 'Front', top: 'Top', left: 'Left', right: 'Right', isometric: 'Isometric' }
export const escapeXml = (text: string) => text.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[character]!)

export function titleBlock(sheet: Sheet, title: string, index: number, total: number, date: string): string {
  const area = pageLayout(sheet.orientation).title
  const lines = [title, sheet.name, `${VIEW_NAMES[sheet.view]}   1:${sheet.scale}   ${date}`, `Sheet ${index + 1} of ${total}`]
  return `<svg x="${area.x}" y="${area.y}" width="${area.width}" height="${area.height}" viewBox="0 0 ${area.width} ${area.height}"><rect width="${area.width}" height="${area.height}" fill="white" stroke="black" stroke-width="0.01"/>${lines.map((line, row) => `<text x="0.12" y="${0.2 + row * 0.2}" font-size="0.13">${escapeXml(line)}</text>`).join('')}<path data-reference-bar="1" d="M 3.7 0.7 v 0.12 M 3.7 0.76 h 1 M 4.7 0.7 v 0.12" fill="none" stroke="black" stroke-width="0.01"/><text x="4.2" y="0.62" text-anchor="middle" font-size="0.12">1&quot;</text></svg>`
}
