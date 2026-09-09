import { Ellipsis, Eye, EyeOff, Grid2x2, type LucideIcon, MoveHorizontal, Pencil, Redo2, Ruler, Search, Tag, Trash2, Undo2 } from 'lucide-react'
import type { SVGProps } from 'react'
import './Icon.css'

/**
 * Micro glyphs drawn on a 12 px grid for the smallest cells (row actions, steppers, chevrons),
 * where a 24-grid icon would go muddy. Everything else comes from Lucide.
 */
const MICRO: Record<string, string> = {
  close: 'M2.5 2.5 L9.5 9.5 M9.5 2.5 L2.5 9.5',
  plus: 'M6 2 V10 M2 6 H10',
  minus: 'M2 6 H10',
  check: 'M2 6.2 L4.8 9 L10 3.2',
  'chevron-down': 'M2.5 4.5 L6 8 L9.5 4.5',
  'chevron-right': 'M4.5 2.5 L8 6 L4.5 9.5',
  'chevron-up': 'M2.5 7.5 L6 4 L9.5 7.5',
}

const LUCIDE: Record<string, LucideIcon> = {
  pencil: Pencil,
  trash: Trash2,
  ellipsis: Ellipsis,
  eye: Eye,
  'eye-off': EyeOff,
  search: Search,
  undo: Undo2,
  redo: Redo2,
  grid: Grid2x2,
  ruler: Ruler,
  tag: Tag,
  sizes: MoveHorizontal,
}

export type IconName = keyof typeof MICRO | keyof typeof LUCIDE

export const ICON_NAMES: IconName[] = [...Object.keys(MICRO), ...Object.keys(LUCIDE)]

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  readonly name: IconName
  /** Pixel size; micro glyphs default to 12, Lucide icons to 14. */
  readonly size?: number
  readonly label?: string
}

/** One inline SVG icon in currentColor. Decorative unless given a label. */
export function Icon({ name, size, label, className, ...props }: IconProps) {
  const micro = MICRO[name]
  const cls = ['kit-icon', className ?? ''].join(' ').trim()
  const a11y = label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true }
  if (micro) {
    const s = size ?? 12
    return (
      <svg {...a11y} {...props} className={cls} width={s} height={s} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.25} strokeLinecap="round" strokeLinejoin="round">
        <path d={micro} />
      </svg>
    )
  }
  const L = LUCIDE[name]
  if (!L) return null
  return <L {...a11y} {...(props as object)} className={cls} size={size ?? 14} strokeWidth={1.5} absoluteStrokeWidth />
}
