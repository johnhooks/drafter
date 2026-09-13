import { useState } from 'react'
import { DockWorkspace } from './DockWorkspace'
import type { DockLayout } from './layout'
import { Checkbox } from '../Checkbox/Checkbox'
import { TextField } from '../TextField/TextField'
import { Fields } from '../Layout/Layout'

const defaults: DockLayout = { columns: { left: ['model', 'entities'], right: ['properties', 'selection'] }, widths: { left: 240, right: 300 }, hidden: { left: false, right: false }, folded: {}, weights: { model: 1, entities: 2, properties: 1, selection: 2 } }
function ExampleField({ label, initial }: { label: string; initial: string }) {
  const [value, setValue] = useState(initial)
  return <TextField label={label} value={value} onCommit={setValue} />
}
export function DockExample({ allFolded = false, oneDock = false, short = false }: { allFolded?: boolean; oneDock?: boolean; short?: boolean }) {
  const [layout, setLayout] = useState<DockLayout>((): DockLayout => ({ ...defaults, columns: oneDock ? { left: [...defaults.columns.left, ...defaults.columns.right], right: [] } : defaults.columns, folded: allFolded ? { model: true, entities: true, properties: true, selection: true } : {} }))
  const [long, setLong] = useState(false)
  const [compact, setCompact] = useState(short)
  return <>
    <Checkbox isSelected={compact} onChange={setCompact}>Short viewport</Checkbox>
    <Checkbox isSelected={long} onChange={setLong}>Long list</Checkbox>
    <div style={{ display: 'flex', height: compact ? 340 : 620, maxHeight: 'calc(100dvh - 120px)' }}>
      <DockWorkspace layout={layout} defaults={defaults} onLayoutChange={setLayout} panels={[
        { id: 'model', title: 'Model', icon: 'grid', content: <p>Model contents</p> },
        { id: 'entities', title: 'Sketch entities', icon: 'pencil', content: Array.from({ length: long ? 60 : 8 }, (_, i) => <p key={i}>Item {i + 1}</p>) },
        { id: 'properties', title: 'Document', icon: 'tag', content: <Fields><ExampleField label="Title" initial="Untitled" /></Fields> },
        { id: 'selection', title: 'Selection', icon: 'sizes', content: <Fields><ExampleField label="Name" initial="Selected item" />{Array.from({ length: 6 }, (_, i) => <ExampleField key={i} label={`Property ${i + 1}`} initial="Value" />)}</Fields> },
      ]}><div style={{ padding: 16, background: 'var(--kit-canvas-surface)' }}>Canvas</div></DockWorkspace>
    </div>
  </>
}
export default { title: 'Layout/DockWorkspace', component: DockExample, excludeStories: ['DockExample'], parameters: { layout: 'fullscreen' } }
export const Default = {}
export const ShortViewport = { args: { short: true } }
export const AllFolded = { args: { allFolded: true } }
export const AllInOneDock = { args: { oneDock: true } }
