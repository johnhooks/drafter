import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { bodyBounds, bodyVolume } from './core/geom/body'
import { App } from './ui/App'
import { useStore } from './ui/store/store'
import '@drawing/kit/tokens.css'
import '@drawing/kit/base.css'
import '@drawing/kit/themes/light.css'
import '@drawing/kit/themes/dark.css'
import './ui/styles.css'

if (import.meta.env.DEV) {
  // read-only view of the store for headless walkthroughs
  ;(window as unknown as { __debug: () => unknown }).__debug = () => {
    const s = useStore.getState()
    return {
      mode: s.mode,
      tool: s.tool,
      selection: s.selection,
      features: s.doc.features,
      errors: s.eval.errors,
      bodies: [...s.eval.bodies.values()].map((b) => ({ id: b.id, volume: bodyVolume(b) / 4096, bounds: bodyBounds(b) })),
      notices: s.notices.map((n) => n.text),
      theme: s.theme,
      params: s.doc.params,
      history: { past: s.history.past.length, future: s.history.future.length },
    }
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
