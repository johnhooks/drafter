import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { ToastRegion, toast } from './Toast'

describe('Toast', () => {
  it('shows a queued toast and dismisses it', async () => {
    render(<ToastRegion />)
    act(() => {
      toast({ title: 'Saved', tone: 'neutral' })
    })
    expect(await screen.findByText('Saved')).toBeTruthy()
    await userEvent.click(screen.getByRole('button', { name: 'Dismiss' }))
    expect(screen.queryByText('Saved')).toBeNull()
  })
})
