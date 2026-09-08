import type { Meta, StoryObj } from '@storybook/react-vite'
import { NumberField } from './NumberField'

const meta: Meta<typeof NumberField> = { title: 'Controls/NumberField', component: NumberField, args: { label: 'Zoom', defaultValue: 100, minValue: 10, maxValue: 400, step: 10 } }
export default meta
type Story = StoryObj<typeof NumberField>

export const Default: Story = { render: (args) => <div style={{ width: 160 }}><NumberField {...args} /></div> }
export const Percent: Story = { render: (args) => <div style={{ width: 160 }}><NumberField {...args} formatOptions={{ style: 'percent' }} defaultValue={1} step={0.1} minValue={0.1} maxValue={4} /></div> }
export const WithError: Story = { render: (args) => <div style={{ width: 160 }}><NumberField {...args} error="Out of range" /></div> }
