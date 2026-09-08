import type { Meta, StoryObj } from '@storybook/react-vite'
import { Disclosure } from './Disclosure'

const meta: Meta<typeof Disclosure> = { title: 'Layout/Disclosure', component: Disclosure }
export default meta
type Story = StoryObj<typeof Disclosure>

export const Sections: Story = {
  render: () => (
    <div style={{ width: 260, background: 'var(--kit-surface-panel)' }}>
      <Disclosure title="Rectangles" trailing="3">
        r1, r2, r3
      </Disclosure>
      <Disclosure title="Constraints" trailing="2" defaultExpanded={false}>
        r1.left = face.left + 2
      </Disclosure>
    </div>
  ),
}
