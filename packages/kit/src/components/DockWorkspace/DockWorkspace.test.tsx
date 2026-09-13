import { useState } from 'react'
import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { DockWorkspace } from './DockWorkspace'
import type { DockLayout } from './layout'
const defaults: DockLayout = { columns: { left: ['a'], right: ['b', 'c'] }, widths: { left: 240, right: 300 }, hidden: { left: false, right: false }, folded: { b: true }, weights: { a: 1, b: 1, c: 1 } }
function Example({ initial = defaults }: { initial?: DockLayout }) {
  const [layout, setLayout] = useState(initial)
  return <DockWorkspace layout={layout} defaults={defaults} onLayoutChange={setLayout} panels={['a', 'b', 'c'].map(id => ({ id, title: id.toUpperCase(), icon: 'grid', content: <input aria-label={`field ${id}`} defaultValue="draft" /> }))}>Canvas</DockWorkspace>
}
describe('DockWorkspace', () => {
  it('keeps focus on a visible control when reopening an empty dock', async () => {
    render(<Example initial={{ ...defaults, columns: { left: ['a', 'b', 'c'], right: [] } }} />)
    await userEvent.click(screen.getByRole('button', { name: 'Collapse right dock' }))
    await userEvent.click(screen.getByRole('button', { name: 'Expand right dock' }))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Collapse right dock' })).toHaveFocus())
  })
  it('opens a folded panel from its rail and restores without a duplicate control', async () => {
    render(<Example />)
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Collapse right dock' }))
    await user.click(screen.getByRole('button', { name: 'Open B' }))
    expect(screen.getByRole('textbox', { name: 'field b' })).toBeVisible()
    expect(screen.queryByRole('textbox', { name: 'field c' })).toBeNull()
    expect(screen.getAllByRole('button', { name: /Restore/ })).toHaveLength(1)
    await user.click(screen.getByRole('button', { name: 'Restore B layout' }))
    expect(screen.queryByRole('textbox', { name: 'field b' })).toBeNull()
    expect(screen.getByRole('textbox', { name: 'field c' })).toBeVisible()
    await waitFor(() => expect(screen.getByRole('button', { name: 'Move B' })).toHaveFocus())
  })
  it('resizes with the keyboard and restores focus after collapsing the dock', async () => {
    render(<Example />)
    const divider = screen.getByRole('separator', { name: 'Resize left dock' })
    divider.focus()
    await userEvent.keyboard('{ArrowRight}')
    expect(divider).toHaveAttribute('aria-valuenow', '256')
    await userEvent.click(screen.getByRole('button', { name: 'Collapse left dock' }))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Expand left dock' })).toHaveFocus())
  })
  it('moves a panel through React Aria keyboard drag and drop', async () => {
    render(<Example />)
    const user = userEvent.setup()
    screen.getByRole('button', { name: 'Move C' }).focus()
    await user.keyboard('{Enter}')
    await act(() => new Promise<void>(resolve => requestAnimationFrame(() => resolve())))
    const target = screen.getByRole('button', { name: 'Move panel before A in left dock' })
    for (let i = 0; i < 8 && document.activeElement !== target; i++) await user.tab()
    expect(target).toHaveFocus()
    await user.keyboard('{Enter}')
    await waitFor(() => expect(within(screen.getByRole('complementary', { name: 'left dock' })).getByRole('button', { name: 'Move C' })).toBeVisible())
  })
})
