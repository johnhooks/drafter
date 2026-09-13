import { DockWorkspace, Panel, type DockLayout } from '@bitmachina/drafter-kit'
import { useEffect, useState, type ReactNode } from 'react'
import { loadDockLayout, saveDockLayout } from './persist'
import { Properties, SelectionPanel, SketchFields, SketchLists, type SketchList } from './Properties'
import { SheetList } from './sheets/SheetList'
import { SheetProperties } from './sheets/SheetProperties'
import { useStore } from './store/store'
import { Timeline } from './Timeline'

const DEFAULTS: DockLayout = {
  columns: { left: ['model', 'entities'], right: ['properties', 'selection'] },
  widths: { left: 240, right: 300 }, hidden: { left: false, right: false }, folded: {},
  weights: { model: 1, entities: 2, properties: 1, selection: 2 },
}

export function Workspace({ children }: { children: ReactNode }) {
  const mode = useStore(s => s.mode)
  const feature = useStore(s => s.doc.features.find(f => f.id === s.selection.featureId))
  const sketch = mode.kind !== 'sheet' && feature?.kind === 'sketch' ? feature : undefined
  const editingSketch = mode.kind === 'sketch' && !!sketch
  const [layout, setLayout] = useState(() => loadDockLayout(DEFAULTS))
  const [open, setOpen] = useState<SketchList | null>('regions')
  useEffect(() => saveDockLayout(layout), [layout])
  return <DockWorkspace layout={layout} defaults={DEFAULTS} onLayoutChange={setLayout} panels={[
    { id: 'model', title: mode.kind === 'sheet' ? 'Sheets' : 'Model', icon: 'grid', content: mode.kind === 'sheet' ? <SheetList /> : <Timeline /> },
    { id: 'entities', title: 'Sketch entities', icon: 'pencil', available: editingSketch, className: 'workspace-entities', content: sketch && <Panel className="props-lists"><SketchLists sketch={sketch} open={open} onOpen={setOpen} /></Panel> },
    { id: 'properties', title: sketch ? 'Sketch' : mode.kind === 'sheet' ? 'Sheet' : feature?.kind === 'extrude' ? 'Extrude' : 'Document', icon: 'tag', content: mode.kind === 'sheet' ? <SheetProperties /> : sketch ? <SketchFields sketch={sketch} /> : <Properties /> },
    { id: 'selection', title: 'Selection', icon: 'sizes', available: editingSketch, className: 'workspace-selection', content: <SelectionPanel /> },
  ]}>{children}</DockWorkspace>
}
