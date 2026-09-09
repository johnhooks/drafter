import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ToggleIconButton } from './ToggleIconButton'

describe('ToggleIconButton', () => {
  it('is named by its label and toggles with a click and with Space', async () => {
    const onChange = vi.fn()
    render(<ToggleIconButton icon="grid" aria-label="Grid" onChange={onChange} tooltip={false} />)
    const b = screen.getByRole('button', { name: 'Grid' })
    expect(b).toHaveAttribute('aria-pressed', 'false')
    await userEvent.click(b)
    expect(b).toHaveAttribute('aria-pressed', 'true')
    expect(onChange).toHaveBeenLastCalledWith(true)
    await userEvent.keyboard(' ')
    expect(b).toHaveAttribute('aria-pressed', 'false')
    expect(b.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
  })
  it('shows its label as a tooltip on focus', async () => {
    render(<ToggleIconButton icon="ruler" aria-label="Dimensions" defaultSelected />)
    await userEvent.tab()
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Dimensions')
  })
})
