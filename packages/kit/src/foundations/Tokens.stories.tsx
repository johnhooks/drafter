import type { Meta, StoryObj } from '@storybook/react-vite'

const COLOURS = ['surface-frame', 'surface-panel', 'surface-control', 'surface-raised', 'line', 'line-strong', 'text', 'text-muted', 'accent', 'on-accent', 'danger', 'warning', 'focus']
const TYPE = [
  ['text-xs', 'Section label, 10 px, tracked, upper case'],
  ['text-sm', 'Interface text, 11 px'],
  ['text-md', 'Field values, 12 px'],
  ['text-lg', 'Headings, 14 px'],
]
const SPACE = ['space', 'space-2', 'space-3', 'space-4']
const mono = { fontFamily: 'var(--kit-font-mono)', fontSize: 'var(--kit-text-xs)' } as const

function Foundations() {
  return (
    <div style={{ display: 'grid', gap: 24, maxWidth: 720 }}>
      <section>
        <h2 style={{ fontSize: 'var(--kit-text-lg)', margin: '0 0 8px' }}>Colour</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8 }}>
          {COLOURS.map((c) => (
            <div key={c} style={{ display: 'grid', gap: 4 }}>
              <div style={{ height: 40, background: `var(--kit-${c})`, border: '1px solid var(--kit-line)', borderRadius: 'var(--kit-radius)' }} />
              <code style={mono}>--kit-{c}</code>
            </div>
          ))}
        </div>
      </section>
      <section>
        <h2 style={{ fontSize: 'var(--kit-text-lg)', margin: '0 0 8px' }}>Type</h2>
        {TYPE.map(([t, label]) => (
          <div key={t} style={{ display: 'flex', gap: 16, alignItems: 'baseline', padding: '4px 0', borderBottom: '1px solid var(--kit-line)' }}>
            <code style={{ ...mono, width: 120 }}>--kit-{t}</code>
            <span style={{ fontSize: `var(--kit-${t})`, ...(t === 'text-xs' ? { letterSpacing: 'var(--kit-tracking-label)', textTransform: 'uppercase' as const } : {}) }}>{label}</span>
          </div>
        ))}
      </section>
      <section>
        <h2 style={{ fontSize: 'var(--kit-text-lg)', margin: '0 0 8px' }}>Spacing and sizes</h2>
        {SPACE.map((s) => (
          <div key={s} style={{ display: 'flex', gap: 16, alignItems: 'center', padding: '4px 0' }}>
            <code style={{ ...mono, width: 120 }}>--kit-{s}</code>
            <div style={{ width: `var(--kit-${s})`, height: 12, background: 'var(--kit-accent)' }} />
          </div>
        ))}
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', padding: '4px 0' }}>
          <code style={{ ...mono, width: 120 }}>--kit-control-h</code>
          <div style={{ height: 'var(--kit-control-h)', width: 80, background: 'var(--kit-surface-control)', border: '1px solid var(--kit-line)', borderRadius: 'var(--kit-radius)' }} />
          <code style={{ ...mono, width: 120 }}>--kit-row-h</code>
          <div style={{ height: 'var(--kit-row-h)', width: 80, background: 'var(--kit-surface-raised)' }} />
        </div>
      </section>
    </div>
  )
}

const meta: Meta<typeof Foundations> = { title: 'Foundations/Tokens', component: Foundations }
export default meta
export const Tokens: StoryObj<typeof Foundations> = {}
