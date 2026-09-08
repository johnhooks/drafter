import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Select, SelectItem } from './Select'

describe('Select', () => {
  it('opens with the keyboard and selects an option', async () => {
    const onChange = vi.fn()
    render(
      <Select label="Operation" defaultSelectedKey="new" onSelectionChange={onChange}>
        <SelectItem id="new">New body</SelectItem>
        <SelectItem id="join">Join</SelectItem>
        <SelectItem id="cut">Cut</SelectItem>
      </Select>,
    )
    await userEvent.tab()
    await userEvent.keyboard('{ArrowDown}')
    const options = await screen.findAllByRole('option')
    expect(options.map((o) => o.textContent)).toEqual(['New body', 'Join', 'Cut'])
    await userEvent.keyboard('{ArrowDown}{Enter}')
    expect(onChange).toHaveBeenLastCalledWith('join')
    expect(screen.getByRole('button', { name: /Operation/ })).toHaveTextContent('Join')
  })
})
