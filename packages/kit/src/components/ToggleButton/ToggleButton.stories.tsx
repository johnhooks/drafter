import type { Meta, StoryObj } from '@storybook/react-vite'
import { ToggleButton } from './ToggleButton'

const meta: Meta<typeof ToggleButton> = { title: 'Controls/ToggleButton', component: ToggleButton, args: { children: 'Dims' } }
export default meta
type Story = StoryObj<typeof ToggleButton>

export const Off: Story = {}
export const On: Story = { args: { defaultSelected: true } }
export const Disabled: Story = { args: { isDisabled: true } }
