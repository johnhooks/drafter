import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { TextField } from './TextField'

const meta: Meta<typeof TextField> = { title: 'Controls/TextField', component: TextField }
export default meta
type Story = StoryObj<typeof TextField>

function Demo(props: Partial<React.ComponentProps<typeof TextField<number>>>) {
  const [value, setValue] = useState('24')
  return (
    <div style={{ width: 200 }}>
      <TextField<number>
        label="Width"
        value={value}
        validate={(t) => (/^\d+(\.\d+)?$/.test(t.trim()) ? { ok: true, value: Number(t) } : { ok: false, error: 'Enter a number' })}
        onCommit={(_v, text) => setValue(text.trim())}
        description="Enter or blur commits, Escape reverts"
        {...props}
      />
    </div>
  )
}

export const Default: Story = { render: () => <Demo /> }
export const WithError: Story = { render: () => <Demo error="Width must be greater than zero" /> }
export const Derived: Story = { render: () => <Demo derived /> }
export const Monospace: Story = { render: () => <Demo monospace description="Expressions read better in monospace" /> }
export const Disabled: Story = { render: () => <Demo isDisabled /> }
