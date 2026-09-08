import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { TextField } from './TextField'

const validate = (t: string) => (/^\d+$/.test(t) ? { ok: true as const, value: Number(t) } : { ok: false as const, error: 'Digits only' })

describe('TextField', () => {
  it('commits on Enter when valid and changed', async () => {
    const onCommit = vi.fn()
    render(<TextField<number> label="W" value="24" validate={validate} onCommit={onCommit} />)
    const input = screen.getByRole('textbox', { name: 'W' })
    await userEvent.clear(input)
    await userEvent.type(input, '30{Enter}')
    expect(onCommit).toHaveBeenCalledWith(30, '30')
  })
  it('does not commit an unchanged draft on blur', async () => {
    const onCommit = vi.fn()
    render(<TextField label="W" value="24" onCommit={onCommit} />)
    await userEvent.click(screen.getByRole('textbox'))
    await userEvent.tab()
    expect(onCommit).not.toHaveBeenCalled()
  })
  it('keeps invalid text with its message and does not commit', async () => {
    const onCommit = vi.fn()
    render(<TextField<number> label="W" value="24" validate={validate} onCommit={onCommit} />)
    const input = screen.getByRole('textbox')
    await userEvent.clear(input)
    await userEvent.type(input, 'abc{Enter}')
    expect(onCommit).not.toHaveBeenCalled()
    expect(input).toHaveValue('abc')
    expect(screen.getByText('Digits only')).toBeTruthy()
    expect(input.closest('.kit-textfield')).toHaveAttribute('data-invalid')
  })
  it('Escape reverts to the committed value', async () => {
    const onCommit = vi.fn()
    render(<TextField label="W" value="24" onCommit={onCommit} />)
    const input = screen.getByRole('textbox')
    await userEvent.clear(input)
    await userEvent.type(input, '99{Escape}')
    expect(input).toHaveValue('24')
    expect(onCommit).not.toHaveBeenCalled()
  })
  it('shows an outside error only while the draft is clean', async () => {
    render(<TextField label="W" value="24" onCommit={() => {}} error="Too wide" />)
    expect(screen.getByText('Too wide')).toBeTruthy()
    await userEvent.type(screen.getByRole('textbox'), '5')
    expect(screen.queryByText('Too wide')).toBeNull()
  })
})
