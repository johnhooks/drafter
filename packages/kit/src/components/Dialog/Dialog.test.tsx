import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ConfirmDialog } from './Dialog'

describe('ConfirmDialog', () => {
  it('confirms with the focused button and cancels with Escape', async () => {
    const onConfirm = vi.fn()
    const onCancel = vi.fn()
    render(
      <ConfirmDialog title="Delete?" isOpen onConfirm={onConfirm} onCancel={onCancel} confirmLabel="Delete">
        Gone for good.
      </ConfirmDialog>,
    )
    expect(screen.getByRole('alertdialog', { name: 'Delete?' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Delete' })).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    expect(onConfirm).toHaveBeenCalledTimes(1)
    await userEvent.keyboard('{Escape}')
    expect(onCancel).toHaveBeenCalledTimes(1)
  })
})
