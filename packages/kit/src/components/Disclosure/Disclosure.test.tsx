import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { Disclosure } from './Disclosure'

describe('Disclosure', () => {
  it('collapses and expands', async () => {
    render(<Disclosure title="Rectangles">r1</Disclosure>)
    const trigger = screen.getByRole('button', { name: /Rectangles/ })
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    await userEvent.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
  })
})
