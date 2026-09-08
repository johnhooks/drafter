import { ConfirmDialog, Hint, IconButton, ListBox, ListBoxItem } from '@drawing/kit'
import { useState } from 'react'
import { dependentsOf } from '../core/model/deps'
import { useStore } from './store/store'

export function Timeline() {
  const doc = useStore((s) => s.doc)
  const ev = useStore((s) => s.eval)
  const selection = useStore((s) => s.selection)
  const mode = useStore((s) => s.mode)
  const dispatch = useStore((s) => s.dispatch)
  const [pending, setPending] = useState<string | null>(null)

  const gone = pending ? dependentsOf(doc, pending) : []
  const names = gone.map((g) => doc.features.find((f) => f.id === g)?.name ?? g)

  return (
    <div className="timeline">
      <h3 className="section-title">Timeline</h3>
      {doc.features.length === 0 && <Hint>No features yet. Start with New sketch.</Hint>}
      <ListBox
        aria-label="Timeline"
        selectionMode="single"
        actionSlots={2}
        selectedKeys={selection.featureId ? [selection.featureId] : []}
        onSelectionChange={(keys) => {
          const id = keys === 'all' ? undefined : ([...keys][0] as string | undefined)
          if (!id) return dispatch('select', {})
          const f = doc.features.find((x) => x.id === id)
          if (f?.kind === 'extrude') {
            const res = ev.results.get(f.id)
            dispatch('select', { featureId: f.id, bodyId: res?.kind === 'extrude' ? res.bodyId : undefined })
          } else dispatch('select', { featureId: id })
        }}
      >
        {doc.features.map((f) => {
          const r = ev.results.get(f.id)
          const failed = r?.kind === 'error'
          const editing = mode.kind === 'sketch' && mode.sketchId === f.id
          return (
            <ListBoxItem
              key={f.id}
              id={f.id}
              textValue={f.name}
              tone={failed ? 'error' : 'neutral'}
              detail={failed ? r.message : f.kind === 'sketch' ? f.handle : undefined}
              actions={
                <>
                  {f.kind === 'sketch' && !editing && (
                    <IconButton icon="pencil" size="sm" aria-label="Edit" onPress={() => dispatch('setMode', { kind: 'sketch', sketchId: f.id })} />
                  )}
                  <IconButton icon="trash" size="sm" tone="danger" aria-label="Delete" onPress={() => setPending(f.id)} />
                </>
              }
            >
              {f.name}
            </ListBoxItem>
          )
        })}
      </ListBox>
      <ConfirmDialog
        title={`Delete ${names[0] ?? ''}?`}
        isOpen={pending !== null}
        confirmLabel="Delete"
        tone="danger"
        onConfirm={() => {
          if (pending) dispatch('deleteFeature', pending)
          setPending(null)
        }}
        onCancel={() => setPending(null)}
      >
        {names.length > 1 ? (
          <>
            These depend on it and will be deleted too:
            <ul className="dependents">
              {names.slice(1).map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          </>
        ) : (
          'Nothing else depends on it.'
        )}
      </ConfirmDialog>
    </div>
  )
}
