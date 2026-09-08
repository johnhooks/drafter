import { type ReactNode, createContext, useContext, useMemo, useState } from 'react'

export type ThemeName = 'light' | 'dark'

interface ThemeContextValue {
  readonly theme: ThemeName
  readonly setTheme: (theme: ThemeName) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

interface Props {
  readonly theme?: ThemeName
  readonly defaultTheme?: ThemeName
  readonly onChange?: (theme: ThemeName) => void
  readonly children: ReactNode
  /** Renders as a block element carrying data-theme; pass 'contents' to leave layout untouched. */
  readonly display?: 'block' | 'contents'
}

/**
 * Sets data-theme on a subtree. A convenience: any element with data-theme themes its
 * descendants, provider or not.
 */
export function ThemeProvider({ theme, defaultTheme = 'light', onChange, children, display = 'block' }: Props) {
  const [own, setOwn] = useState<ThemeName>(defaultTheme)
  const current = theme ?? own
  const value = useMemo<ThemeContextValue>(
    () => ({
      theme: current,
      setTheme: (t) => {
        setOwn(t)
        onChange?.(t)
      },
    }),
    [current, onChange],
  )
  return (
    <ThemeContext.Provider value={value}>
      <div className="kit-root" data-theme={current} style={display === 'contents' ? { display: 'contents' } : undefined}>
        {children}
      </div>
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme needs a ThemeProvider above it')
  return ctx
}
