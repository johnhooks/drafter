import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import { InlineEdit } from './InlineEdit'

it('opens with the keyboard, commits, and restores focus', async () => {
  const onCommit = vi.fn()
  render(<InlineEdit label="Name" value="First" onCommit={onCommit} />)
  await userEvent.tab()
  await userEvent.keyboard('{Enter}')
  const input = screen.getByRole('textbox', { name: 'Name' })
  expect(input).toHaveFocus()
  await userEvent.clear(input)
  await userEvent.type(input, 'Second{Enter}')
  expect(onCommit).toHaveBeenCalledWith('Second', 'Second')
  expect(screen.getByRole('button')).toHaveFocus()
})

it('cancels with Escape without submitting and leaves Tab navigation intact', async () => {
  const onCommit = vi.fn()
  render(<><InlineEdit label="Name" value="First" onCommit={onCommit} /><button>Next</button></>)
  await userEvent.click(screen.getByRole('button', { name: /Edit Name/ }))
  await userEvent.type(screen.getByRole('textbox'), 'x{Escape}')
  expect(onCommit).not.toHaveBeenCalled()
  expect(screen.getByRole('button', { name: /Edit Name/ })).toHaveFocus()
  await userEvent.keyboard(' ')
  await userEvent.clear(screen.getByRole('textbox'))
  await userEvent.type(screen.getByRole('textbox'), 'Third')
  await userEvent.tab()
  expect(onCommit).toHaveBeenCalledWith('Third', 'Third')
  expect(screen.getByRole('button', { name: 'Next' })).toHaveFocus()
})

it('keeps invalid input editable with an accessible error', async () => {
  render(<InlineEdit label="Name" value="First" validate={() => ({ ok: false, error: 'Already used' })} onCommit={() => {}} />)
  await userEvent.click(screen.getByRole('button'))
  const input = screen.getByRole('textbox')
  await userEvent.type(input, 'x{Enter}')
  expect(input).toHaveAttribute('aria-invalid', 'true')
  expect(input).toHaveAccessibleDescription('Already used')
  await userEvent.keyboard('{Escape}')
  expect(screen.getByRole('button')).toHaveTextContent('First')
})
