import { useEffect, useState } from 'react'

/** The colours the sketch canvas draws with, each a `--kit-canvas-<role>` token the kit themes. */
export const CANVAS_ROLES = [
  'surface',
  'grid-axis',
  'grid-major',
  'grid-minor',
  'line',
  'construction',
  'handle',
  'select',
  'hover',
  'region',
  'region-hover',
  'region-select',
  'constraint',
  'anchor',
  'link',
  'error',
  'reference',
  'reference-fill',
  'outline',
] as const

export type CanvasRole = (typeof CANVAS_ROLES)[number]
export type Palette = Readonly<Record<CanvasRole, string>>

/** Resolves every canvas token from the root's computed style, where the themes assign them. */
export function readPalette(): Palette {
  const style = getComputedStyle(document.documentElement)
  return Object.fromEntries(CANVAS_ROLES.map((role) => [role, style.getPropertyValue(`--kit-canvas-${role}`).trim()])) as Palette
}

/**
 * The canvas palette for the current theme, as literal values. The sketch writes them into SVG attributes,
 * so the exported file carries real colours rather than `var()` references to a stylesheet it does not have.
 */
export function usePalette(): Palette {
  const [palette, setPalette] = useState(readPalette)
  // the app stamps data-theme on the root in an effect that runs after this component's, so a store
  // subscription would read the outgoing theme; the attribute itself is the moment the colours change
  useEffect(() => {
    const observer = new MutationObserver(() => setPalette(readPalette()))
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => observer.disconnect()
  }, [])
  return palette
}
