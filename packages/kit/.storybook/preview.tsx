import type { Preview } from '@storybook/react-vite'
import { useEffect } from 'react'
import '../src/tokens.css'
import '../src/base.css'
import '../src/themes/light.css'
import '../src/themes/dark.css'

const preview: Preview = {
  globalTypes: {
    theme: {
      description: 'Kit theme',
      toolbar: { title: 'Theme', icon: 'paintbrush', items: ['light', 'dark'], dynamicTitle: true },
    },
  },
  initialGlobals: { theme: 'light' },
  decorators: [
    (Story, context) => {
      const theme = (context.globals['theme'] as string) ?? 'light'
      useEffect(() => {
        document.documentElement.dataset['theme'] = theme
        document.body.style.background = 'var(--kit-surface-panel)'
        document.body.style.color = 'var(--kit-text)'
      }, [theme])
      return (
        <div data-theme={theme} style={{ padding: 16, background: 'var(--kit-surface-panel)', color: 'var(--kit-text)', minHeight: '100%' }}>
          <Story />
        </div>
      )
    },
  ],
  parameters: {
    a11y: { test: 'error' },
    backgrounds: { disable: true },
  },
}

export default preview
