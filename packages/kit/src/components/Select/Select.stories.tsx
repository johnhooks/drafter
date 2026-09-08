import type { Meta, StoryObj } from '@storybook/react-vite'
import { Select, SelectItem } from './Select'

const meta: Meta<typeof Select> = { title: 'Controls/Select', component: Select }
export default meta
type Story = StoryObj<typeof Select>

export const Operation: Story = {
  render: () => (
    <div style={{ width: 200 }}>
      <Select label="Operation" defaultSelectedKey="join">
        <SelectItem id="new">New body</SelectItem>
        <SelectItem id="join">Join</SelectItem>
        <SelectItem id="cut">Cut</SelectItem>
      </Select>
    </div>
  ),
}
export const Placeholder: Story = {
  render: () => (
    <div style={{ width: 200 }}>
      <Select label="Target body" placeholder="Choose a body" error="Join and cut need a target">
        <SelectItem id="e1">Extrude 1</SelectItem>
        <SelectItem id="e3">Extrude 3</SelectItem>
      </Select>
    </div>
  ),
}
