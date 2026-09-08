import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { IconButton } from './IconButton'

describe('IconButton', () => {
  it('is named by its label and presses', async () => {
    const onPress = vi.fn()
    render(<IconButton icon="close" aria-label="Close" onPress={onPress} tooltip={false} />)
    const b = screen.getByRole('button', { name: 'Close' })
    await userEvent.click(b)
    expect(onPress).toHaveBeenCalledTimes(1)
    expect(b.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
  })
  it('shows its label as a tooltip on focus', async () => {
    render(<IconButton icon="close" aria-label="Close" />)
    await userEvent.tab()
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Close')
  })
})
