import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Button } from './Button'

describe('Button', () => {
  it('calls onPress on click and not when disabled', async () => {
    const onPress = vi.fn()
    const { rerender } = render(<Button onPress={onPress}>Go</Button>)
    await userEvent.click(screen.getByRole('button', { name: 'Go' }))
    expect(onPress).toHaveBeenCalledTimes(1)
    rerender(
      <Button onPress={onPress} isDisabled>
        Go
      </Button>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Go' }))
    expect(onPress).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('button')).toHaveAttribute('data-disabled')
  })
  it('carries variant and tone as data attributes', () => {
    render(
      <Button variant="primary" tone="danger">
        Delete
      </Button>,
    )
    const b = screen.getByRole('button')
    expect(b.dataset['variant']).toBe('primary')
    expect(b.dataset['tone']).toBe('danger')
  })
})
