import type { Meta, StoryObj } from '@storybook/react-vite'
import { IconButton } from './IconButton'

const meta: Meta<typeof IconButton> = { title: 'Controls/IconButton', component: IconButton, args: { icon: 'close', 'aria-label': 'Close' } }
export default meta
type Story = StoryObj<typeof IconButton>

export const Medium: Story = {}
export const Small: Story = { args: { size: 'sm' } }
export const Danger: Story = { args: { icon: 'trash', 'aria-label': 'Delete', tone: 'danger' } }
export const Disabled: Story = { args: { isDisabled: true } }
export const InARow: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
      <IconButton icon="pencil" aria-label="Edit" />
      <IconButton icon="ellipsis" aria-label="More" />
      <IconButton icon="trash" aria-label="Delete" tone="danger" />
      <span style={{ width: 12 }} />
      <IconButton icon="close" aria-label="Close" size="sm" />
      <IconButton icon="plus" aria-label="Add" size="sm" />
    </div>
  ),
}
