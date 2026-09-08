import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Selection } from 'react-aria-components'
import { describe, expect, it, vi } from 'vitest'
import { Button } from '../Button/Button'
import { ListBox, ListBoxItem } from './ListBox'

function List(props: { onSelectionChange?: (k: Selection) => void; onRemove?: () => void }) {
  return (
    <ListBox aria-label="Timeline" selectionMode="single" onSelectionChange={props.onSelectionChange}>
      <ListBoxItem id="s1" detail="s1">
        Sketch 1
      </ListBoxItem>
      <ListBoxItem id="e1" actions={<Button aria-label="Delete" onPress={props.onRemove}>x</Button>}>
        Extrude 1
      </ListBoxItem>
    </ListBox>
  )
}

describe('ListBox', () => {
  it('selects with the mouse and the keyboard', async () => {
    const onChange = vi.fn()
    render(<List onSelectionChange={onChange} />)
    await userEvent.click(screen.getByRole('option', { name: /Extrude 1/ }))
    expect([...(onChange.mock.calls.at(-1)![0] as Set<string>)]).toEqual(['e1'])
    await userEvent.keyboard('{ArrowUp}{Enter}')
    expect([...(onChange.mock.calls.at(-1)![0] as Set<string>)]).toEqual(['s1'])
  })
  it('an action in a row does not select the row', async () => {
    const onChange = vi.fn()
    const onRemove = vi.fn()
    render(<List onSelectionChange={onChange} onRemove={onRemove} />)
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }))
    expect(onRemove).toHaveBeenCalledTimes(1)
    expect(onChange).not.toHaveBeenCalled()
  })
})
