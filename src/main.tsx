import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { bodyBounds, bodyVolume } from './core/geom/body'
import { App } from './ui/App'
import { useStore } from './ui/store/store'
import '@bitmachina/drafter-kit/tokens.css'
import '@bitmachina/drafter-kit/base.css'
import '@bitmachina/drafter-kit/themes/light.css'
import '@bitmachina/drafter-kit/themes/dark.css'
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
      regions: Object.fromEntries(
        [...s.eval.results.entries()].flatMap(([id, r]) => (r.kind === 'sketch' ? [[id, r.regions.map((x) => ({ ref: x.ref, bounds: x.bounds, area: x.area }))]] : [])),
      ),
      errors: s.eval.errors,
      bodies: [...s.eval.bodies.values()].map((b) => ({ id: b.id, volume: bodyVolume(b) / 4096, bounds: bodyBounds(b) })),
      notices: s.notices.map((n) => n.text),
      theme: s.theme,
      view: s.view,
      display: s.display,
      exprFocus: s.exprFocus,
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
