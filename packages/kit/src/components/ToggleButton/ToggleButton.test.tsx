import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { ToggleButton } from './ToggleButton'

describe('ToggleButton', () => {
  it('toggles pressed state', async () => {
    render(<ToggleButton>Dims</ToggleButton>)
    const b = screen.getByRole('button', { name: 'Dims' })
    expect(b).toHaveAttribute('aria-pressed', 'false')
    await userEvent.click(b)
    expect(b).toHaveAttribute('aria-pressed', 'true')
    expect(b).toHaveAttribute('data-selected')
  })
})
