import { useStore } from './store/store'

export function Notices() {
  const notices = useStore((s) => s.notices)
  const dispatch = useStore((s) => s.dispatch)
  if (notices.length === 0) return null
  return (
    <div className="notices">
      {notices.map((n, i) => (
        <div className="notice" key={`${i}-${n}`}>
          <span>{n}</span>
          <button onClick={() => dispatch('dismissNotice', i)}>Dismiss</button>
        </div>
      ))}
    </div>
  )
}
