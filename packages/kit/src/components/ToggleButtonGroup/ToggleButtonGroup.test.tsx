import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ToggleButton } from '../ToggleButton/ToggleButton'
import { ToggleButtonGroup } from './ToggleButtonGroup'

function Tools(props: { onSelectionChange?: (keys: Set<React.Key>) => void }) {
  return (
    <ToggleButtonGroup defaultSelectedKeys={['select']} aria-label="Tool" onSelectionChange={props.onSelectionChange}>
      <ToggleButton id="select">Select</ToggleButton>
      <ToggleButton id="rect">Rectangle</ToggleButton>
      <ToggleButton id="link">Link</ToggleButton>
    </ToggleButtonGroup>
  )
}

describe('ToggleButtonGroup', () => {
  // in single selection mode React Aria exposes the buttons as radios
  it('single selection: clicking one deselects the other and cannot empty', async () => {
    const onChange = vi.fn()
    render(<Tools onSelectionChange={onChange} />)
    await userEvent.click(screen.getByRole('radio', { name: 'Rectangle' }))
    expect(screen.getByRole('radio', { name: 'Rectangle' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('radio', { name: 'Select' })).toHaveAttribute('aria-checked', 'false')
    await userEvent.click(screen.getByRole('radio', { name: 'Rectangle' }))
    expect(screen.getByRole('radio', { name: 'Rectangle' })).toHaveAttribute('aria-checked', 'true')
    expect([...onChange.mock.calls.at(-1)![0]]).toEqual(['rect'])
  })
  it('arrow keys move focus between buttons', async () => {
    render(<Tools />)
    await userEvent.tab()
    expect(screen.getByRole('radio', { name: 'Select' })).toHaveFocus()
    await userEvent.keyboard('{ArrowRight}')
    expect(screen.getByRole('radio', { name: 'Rectangle' })).toHaveFocus()
    await userEvent.keyboard('{ArrowRight}')
    expect(screen.getByRole('radio', { name: 'Link' })).toHaveFocus()
    await userEvent.keyboard('{ArrowLeft}{ArrowLeft}')
    expect(screen.getByRole('radio', { name: 'Select' })).toHaveFocus()
  })
})
