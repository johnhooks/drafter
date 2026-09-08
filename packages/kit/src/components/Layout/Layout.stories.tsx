import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { Button } from '../Button/Button'
import { Disclosure } from '../Disclosure/Disclosure'
import { ListBox, ListBoxItem } from '../ListBox/ListBox'
import { Select, SelectItem } from '../Select/Select'
import { TextField } from '../TextField/TextField'
import { Field, Fields, Hint, Panel, Row } from './Layout'

const meta: Meta<typeof Panel> = { title: 'Layout/Panel', component: Panel }
export default meta
type Story = StoryObj<typeof Panel>

function Len({ label, initial, derived }: { label: string; initial: string; derived?: boolean }) {
  const [v, setV] = useState(initial)
  return <TextField label={label} value={v} onCommit={(_x, t) => setV(t)} derived={derived} monospace={/[a-z]/.test(v)} />
}

/** Mirrors the application's rectangle properties: two driven slots per axis, the third derived. */
export const RectangleProperties: Story = {
  render: () => (
    <div style={{ width: 300, height: 520, display: 'flex' }}>
      <Panel title="Rectangle r1" edge="left" actions={<Button variant="quiet" tone="danger" aria-label="Delete rectangle">x</Button>}>
        <Fields>
          <Hint>Two values per axis drive it; the third is derived. Expressions may use r1.right, face.left, ply and + - * /.</Hint>
          <Row>
            <Len label="Left" initial="face.left + 2" />
            <Len label="Right" initial="face.right - 2" />
            <Len label="Width" initial={'20"'} derived />
          </Row>
          <Row>
            <Len label="Bottom" initial={'-20"'} />
            <Len label="Top" initial={'-4"'} />
            <Len label="Height" initial={'16"'} derived />
          </Row>
          <Field label="Plane">vMax face of Extrude 1 (XY at 24")</Field>
          <Select label="Operation" defaultSelectedKey="cut">
            <SelectItem id="new">New body</SelectItem>
            <SelectItem id="join">Join</SelectItem>
            <SelectItem id="cut">Cut</SelectItem>
          </Select>
        </Fields>
        <Disclosure title="Constraints" trailing="2">
          <ListBox aria-label="Constraints" dense selectionMode="single">
            <ListBoxItem id="a" detail={'2"'} actions={<Button variant="quiet" tone="danger" aria-label="Remove">x</Button>}>
              r1.left = face.left + 2
            </ListBoxItem>
            <ListBoxItem id="b" detail={'22"'} actions={<Button variant="quiet" tone="danger" aria-label="Remove">x</Button>}>
              r1.right = face.right - 2
            </ListBoxItem>
          </ListBox>
        </Disclosure>
      </Panel>
    </div>
  ),
}
