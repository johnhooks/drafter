import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { NumberField } from './NumberField'

describe('NumberField', () => {
  it('steps with the buttons and clamps to the range', async () => {
    const onChange = vi.fn()
    render(<NumberField label="Zoom" defaultValue={100} step={10} maxValue={110} onChange={onChange} />)
    await userEvent.click(screen.getByRole('button', { name: /Increase/ }))
    expect(onChange).toHaveBeenLastCalledWith(110)
    await userEvent.click(screen.getByRole('button', { name: /Increase/ }))
    expect(onChange).toHaveBeenCalledTimes(1)
    await userEvent.click(screen.getByRole('button', { name: /Decrease/ }))
    expect(onChange).toHaveBeenLastCalledWith(100)
  })
})
