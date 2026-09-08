import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from '../Button/Button'
import { ListBox, ListBoxItem } from './ListBox'

const meta: Meta<typeof ListBox> = { title: 'Collections/ListBox', component: ListBox }
export default meta
type Story = StoryObj<typeof ListBox>

export const Timeline: Story = {
  render: () => (
    <div style={{ width: 240 }}>
      <ListBox aria-label="Timeline" selectionMode="single" defaultSelectedKeys={['e1']}>
        <ListBoxItem id="s1" detail="s1" actions={<><Button variant="quiet">Edit</Button><Button variant="quiet" tone="danger" aria-label="Delete">x</Button></>}>
          Sketch 1
        </ListBoxItem>
        <ListBoxItem id="e1" actions={<Button variant="quiet" tone="danger" aria-label="Delete">x</Button>}>
          Extrude 1
        </ListBoxItem>
        <ListBoxItem id="s2" detail="s2" tone="error" actions={<Button variant="quiet">Edit</Button>}>
          Sketch 2
        </ListBoxItem>
      </ListBox>
    </div>
  ),
}
export const Dense: Story = {
  render: () => (
    <div style={{ width: 280 }}>
      <ListBox aria-label="Rectangles" dense selectionMode="multiple">
        <ListBoxItem id="r1" detail={'24" x 24" at (0", 0")'}>r1</ListBoxItem>
        <ListBoxItem id="r2" detail={'4" x 4" at (10", -14")'}>r2</ListBoxItem>
        <ListBoxItem id="r3" tone="error" detail="Unknown name r9">r3</ListBoxItem>
      </ListBox>
    </div>
  ),
}
