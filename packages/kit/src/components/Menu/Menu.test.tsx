import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Button } from '../Button/Button'
import { Menu, MenuItem, MenuTrigger } from './Menu'

describe('Menu', () => {
  it('opens with the keyboard and chooses an item', async () => {
    const onAction = vi.fn()
    render(
      <MenuTrigger>
        <Button>New sketch</Button>
        <Menu aria-label="New sketch" onAction={onAction}>
          <MenuItem id="xz">XZ</MenuItem>
          <MenuItem id="xy">XY</MenuItem>
        </Menu>
      </MenuTrigger>,
    )
    await userEvent.tab()
    await userEvent.keyboard('{ArrowDown}')
    expect(await screen.findByRole('menu')).toBeTruthy()
    expect(screen.getByRole('menuitem', { name: 'XZ' })).toHaveFocus()
    await userEvent.keyboard('{ArrowDown}')
    expect(screen.getByRole('menuitem', { name: 'XY' })).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    expect(onAction.mock.calls[0]?.[0]).toBe('xy')
    expect(screen.queryByRole('menu')).toBeNull()
  })
})
