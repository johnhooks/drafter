import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { Tab, TabList, TabPanel, Tabs } from 'react-aria-components'
import { Button, Checkbox, Field, Fields, Hint, IconButton, ListBox, ListBoxItem, Panel, Row, Select, SelectItem, TextField, ToggleIconButton } from '@bitmachina/drafter-kit'
import './PanelExploration.css'

type Selection = 'none' | 'line' | 'rectangle' | 'constraint' | 'multiple'
const labels: Record<Selection, string> = { none: 'Nothing selected', line: 'Line l1', rectangle: 'Rectangle r1', constraint: 'Constraint l1.length', multiple: '3 lines selected' }

function Length({ label, value }: { label: string; value: string }) {
  return <TextField label={label} defaultValue={value} onCommit={() => {}} />
}

function Inspector({ selection, select }: { selection: Selection; select: (s: Selection) => void }) {
  return <Fields key={selection}>
    <strong>{labels[selection]}</strong>
    {selection === 'none' ? <Hint>Select geometry in the canvas or browser to inspect it.</Hint>
      : selection === 'constraint' ? <>
        <Field label="Target">Line l1 · Length</Field>
        <Length label="Expression" value="r1.width / 2" />
        <Field label="Evaluated value">12"</Field>
        <Button onPress={() => select('line')}>Inspect line l1</Button>
      </> : selection === 'multiple' ? <>
        <Field label="Selection">l1, l2, l3</Field>
        <Checkbox>Construction</Checkbox>
        <Hint>Common properties appear here. Individual lengths differ.</Hint>
      </> : selection === 'rectangle' ? <>
        <Row><Length label="Left" value={'0"'} /><Length label="Bottom" value={'0"'} /></Row>
        <Row><Length label="Width" value={'24"'} /><Length label="Height" value={'16"'} /></Row>
        <Field label="Members">l1, l2, l3, l4</Field>
      </> : <>
        <Field label="Direction">Horizontal</Field>
        <Length label="Position" value={'0"'} />
        <Row><Length label="Left" value={'0"'} /><Length label="Right" value={'24"'} /></Row>
        <Length label="Length" value={'24"'} />
        <Checkbox>Construction</Checkbox>
        <Field label="Belongs to"><Button onPress={() => select('rectangle')}>Rectangle r1</Button></Field>
        <Hint>Inspect the rectangle to edit its other sides.</Hint>
      </>}
  </Fields>
}

function BrowserContent({ long, selection, select }: { long: boolean; selection: Selection; select: (s: Selection) => void }) {
  return <Tabs className="pe-tabs" aria-label="Browser sections" defaultSelectedKey="sketch">
    <TabList aria-label="Browser sections"><Tab id="model">Model</Tab><Tab id="sketch">Sketch</Tab></TabList>
    <TabPanel id="model"><ListBox aria-label="Timeline" selectionMode="single" defaultSelectedKeys={['sketch']}>
      <ListBoxItem id="sketch">Sketch 1</ListBoxItem><ListBoxItem id="extrude">Extrude 1</ListBoxItem>
    </ListBox></TabPanel>
    <TabPanel id="sketch">
      <div className="pe-context">Sketch 1 · XY plane</div>
      <ListBox aria-label="Sketch entities" selectionMode="single" selectedKeys={selection === 'none' || selection === 'multiple' ? [] : [selection]} onSelectionChange={keys => {
        if (keys !== 'all') { const key = [...keys][0]; if (key) select(String(key).startsWith('extra') ? 'line' : key as Selection) }
      }}>
        <ListBoxItem id="rectangle" detail="4 sides">Rectangle r1</ListBoxItem>
        <ListBoxItem id="line" detail={'24"'}>Line l1</ListBoxItem>
        <ListBoxItem id="constraint" detail={'12"'}>l1.length = r1.width / 2</ListBoxItem>
        {Array.from({ length: long ? 60 : 4 }, (_, i) => <ListBoxItem id={`extra-${i}`} key={i} detail={'16"'}>Line l{i + 2}</ListBoxItem>)}
      </ListBox>
    </TabPanel>
  </Tabs>
}

function Workspace({ dock = false }: { dock?: boolean }) {
  const [selection, select] = useState<Selection>('line')
  const [browser, setBrowser] = useState(true)
  const [inspector, setInspector] = useState(true)
  const [short, setShort] = useState(false)
  const [long, setLong] = useState(false)
  const [width, setWidth] = useState(288)
  const [group, setGroup] = useState('selection')
  const browserPanel = <Panel className="pe-panel pe-browser" title="Browser" actions={<IconButton icon="minus" aria-label="Collapse browser" onPress={() => setBrowser(false)} />}>
    <BrowserContent long={long} selection={selection} select={select} />
  </Panel>
  const selectionPanel = <Panel className="pe-panel pe-inspector" title="Selection" actions={<IconButton icon="minus" aria-label="Collapse selection" onPress={() => setInspector(false)} />}>
    <Inspector selection={selection} select={select} />
  </Panel>
  return <div className="pe-sample">
    <div className="pe-controls">
      <Select label="Selection scenario" selectedKey={selection} onSelectionChange={key => select(key as Selection)}>
        {(Object.keys(labels) as Selection[]).map(key => <SelectItem id={key} key={key}>{labels[key]}</SelectItem>)}
      </Select>
      <Checkbox isSelected={short} onChange={setShort}>Short viewport</Checkbox>
      <Checkbox isSelected={long} onChange={setLong}>Long list</Checkbox>
      <label className="pe-width">Inspector width <input aria-label="Inspector width" type="range" min="240" max="360" value={width} onChange={e => setWidth(Number(e.target.value))} /></label>
    </div>
    <Hint>Exploration only. Fields edit local sample values. Select the rectangle or line in the canvas, or use the scenario control.</Hint>
    <div className="pe-workspace" style={{ height: short ? 340 : 620 }}>
      <div className="pe-toolbar"><strong>Drafter</strong><span>Sketch 1</span><div className="pe-view-controls">
        <ToggleIconButton icon="grid" aria-label="Show browser" isSelected={browser} onChange={setBrowser} />
        <ToggleIconButton icon="sizes" aria-label="Show selection" isSelected={inspector} onChange={setInspector} />
      </div></div>
      <div className="pe-body">
        {!dock && browser && <div className="pe-left">{browserPanel}</div>}
        <div className="pe-canvas">
          <div className="pe-canvas-label">Top · XY</div>
          <button className="pe-rectangle" data-selected={selection === 'rectangle' || undefined} aria-label="Select rectangle r1" onClick={() => select('rectangle')}>r1 · 24" × 16"</button>
          <button className="pe-line" data-selected={selection === 'line' || undefined} aria-label="Select line l1" onClick={() => select('line')}>l1 · 24"</button>
          <div className="pe-canvas-footer"><Button onPress={() => select('none')}>Deselect</Button><span>{labels[selection]}</span></div>
        </div>
        {dock ? <>
          <div className="pe-rail">
            <ToggleIconButton icon="sizes" aria-label="Selection dock" isSelected={inspector} onChange={setInspector} />
            <ToggleIconButton icon="grid" aria-label="Browser dock" isSelected={browser} onChange={setBrowser} />
          </div>
          {(browser || inspector) && <div className="pe-dock" style={{ width }}>
            {inspector && <div className="pe-dock-selection">{selectionPanel}</div>}
            {browser && <Panel className="pe-panel pe-dock-browser" title="Workspace" actions={<IconButton icon="minus" aria-label="Collapse browser" onPress={() => setBrowser(false)} />}>
              <Tabs className="pe-tabs" selectedKey={group} onSelectionChange={key => setGroup(String(key))}>
                <TabList aria-label="Workspace panels"><Tab id="selection">Browser</Tab><Tab id="document">Document</Tab></TabList>
                <TabPanel id="selection"><BrowserContent long={long} selection={selection} select={select} /></TabPanel>
                <TabPanel id="document"><Fields><Field label="Document">Untitled</Field><Field label="Units">Inches · 1/16"</Field><Field label="Features">2</Field></Fields></TabPanel>
              </Tabs>
            </Panel>}
          </div>}
        </> : inspector && <div className="pe-right" style={{ width }}>{selectionPanel}</div>}
      </div>
    </div>
  </div>
}

const meta = { title: 'Exploration/Panels', component: Workspace, parameters: { layout: 'fullscreen' } } satisfies Meta<typeof Workspace>
export default meta
type Story = StoryObj<typeof meta>
export const FixedRegions: Story = { args: { dock: false } }
export const AdobeDock: Story = { args: { dock: true } }
