import type { Meta, StoryObj } from '@storybook/react-vite'
import { Checkbox } from './Checkbox'

const meta: Meta<typeof Checkbox> = { title: 'Controls/Checkbox', component: Checkbox, args: { children: 'Flip normal' } }
export default meta
type Story = StoryObj<typeof Checkbox>

export const Off: Story = {}
export const On: Story = { args: { defaultSelected: true } }
export const Indeterminate: Story = { args: { isIndeterminate: true } }
export const Disabled: Story = { args: { isDisabled: true } }
