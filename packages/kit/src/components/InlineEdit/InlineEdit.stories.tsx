import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { InlineEdit } from './InlineEdit'

const meta: Meta<typeof InlineEdit> = { title: 'Components/InlineEdit', component: InlineEdit }
export default meta
type Story = StoryObj<typeof meta>

function Example({ empty = false, validate = false }) {
  const [value, setValue] = useState(empty ? '' : 'Sample')
  return <div style={{ width: 200 }}><InlineEdit label="Name" value={value} onCommit={setValue}
    validate={validate ? (text) => text.length < 3 ? { ok: false, error: 'Use at least three characters' } : { ok: true, value: text } : undefined} /></div>
}

export const Default: Story = { render: () => <Example /> }
export const Empty: Story = { render: () => <Example empty /> }
export const Validation: Story = { render: () => <Example validate /> }
