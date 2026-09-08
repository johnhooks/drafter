import type { Meta, StoryObj } from '@storybook/react-vite'
import { ICON_NAMES, Icon } from './Icon'

const meta: Meta<typeof Icon> = { title: 'Foundations/Icon', component: Icon }
export default meta
type Story = StoryObj<typeof Icon>

export const All: Story = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 12 }}>
      {ICON_NAMES.map((n) => (
        <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 8, height: 24 }}>
          <Icon name={n} />
          <code style={{ fontFamily: 'var(--kit-font-mono)', fontSize: 'var(--kit-text-xs)' }}>{n}</code>
        </div>
      ))}
    </div>
  ),
}
export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <Icon name="close" size={12} />
      <Icon name="close" size={16} />
      <Icon name="pencil" size={14} />
      <Icon name="pencil" size={16} />
      <Icon name="trash" size={20} />
    </div>
  ),
}
