import { dependentsOf } from '../core/model/deps'
import { useStore } from './store/store'

export function Timeline() {
  const doc = useStore((s) => s.doc)
  const ev = useStore((s) => s.eval)
  const selection = useStore((s) => s.selection)
  const mode = useStore((s) => s.mode)
  const dispatch = useStore((s) => s.dispatch)

  const remove = (id: string) => {
    const gone = dependentsOf(doc, id)
    const names = gone.map((g) => doc.features.find((f) => f.id === g)?.name ?? g)
    const msg = gone.length > 1 ? `Delete ${names.join(', ')}? The later ones depend on ${names[0]}.` : `Delete ${names[0]}?`
    if (window.confirm(msg)) dispatch('deleteFeature', id)
  }

  return (
    <div className="timeline">
      <h3>Timeline</h3>
      {doc.features.length === 0 && <div className="muted">No features yet. Start with New Sketch.</div>}
      {doc.features.map((f) => {
        const r = ev.results.get(f.id)
        const selected = selection.featureId === f.id
        const editing = mode.kind === 'sketch' && mode.sketchId === f.id
        return (
          <div key={f.id}>
            <div
              className={`item ${selected ? 'selected' : ''}`}
              onClick={() => {
                if (f.kind === 'extrude') {
                  const res = ev.results.get(f.id)
                  dispatch('select', { featureId: f.id, bodyId: res?.kind === 'extrude' ? res.bodyId : undefined })
                } else dispatch('select', { featureId: f.id })
              }}
            >
              <span className="kind">{f.kind === 'sketch' ? 'S' : 'E'}</span>
              <span className="name">
                {f.name}
                {r?.kind === 'error' && ' !'}
              </span>
              {f.kind === 'sketch' && !editing && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    dispatch('setMode', { kind: 'sketch', sketchId: f.id })
                  }}
                >
                  Edit
                </button>
              )}
              <button
                className="danger"
                onClick={(e) => {
                  e.stopPropagation()
                  remove(f.id)
                }}
              >
                x
              </button>
            </div>
            {r?.kind === 'error' && <div className="err">{r.message}</div>}
          </div>
        )
      })}
    </div>
  )
}
