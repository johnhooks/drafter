import type { Meta, StoryObj } from '@storybook/react-vite'
import { IconButton } from '../IconButton/IconButton'
import { Button } from './Button'

const meta: Meta<typeof Button> = { title: 'Controls/Button', component: Button, args: { children: 'Extrude' } }
export default meta
type Story = StoryObj<typeof Button>

export const Default: Story = {}
export const Primary: Story = { args: { variant: 'primary' } }
export const Quiet: Story = { args: { variant: 'quiet' } }
export const Danger: Story = { args: { tone: 'danger', children: 'Delete' } }
export const DangerPrimary: Story = { args: { tone: 'danger', variant: 'primary', children: 'Delete' } }
export const Disabled: Story = { args: { isDisabled: true } }
export const Row: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 8 }}>
      <Button variant="primary">Create</Button>
      <Button>Cancel</Button>
      <Button variant="quiet">More</Button>
      <IconButton icon="trash" aria-label="Remove" tone="danger" />
    </div>
  ),
}
