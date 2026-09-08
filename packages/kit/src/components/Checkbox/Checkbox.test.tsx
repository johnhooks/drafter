import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { Checkbox } from './Checkbox'

describe('Checkbox', () => {
  it('toggles with click and space', async () => {
    render(<Checkbox>Flip</Checkbox>)
    const box = screen.getByRole('checkbox', { name: 'Flip' })
    expect(box).not.toBeChecked()
    await userEvent.click(box)
    expect(box).toBeChecked()
    await userEvent.keyboard(' ')
    expect(box).not.toBeChecked()
  })
})
