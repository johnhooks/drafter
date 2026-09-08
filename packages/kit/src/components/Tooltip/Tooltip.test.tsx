import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { Button } from '../Button/Button'
import { Tooltip, TooltipTrigger } from './Tooltip'

describe('Tooltip', () => {
  it('shows on keyboard focus', async () => {
    render(
      <TooltipTrigger delay={0}>
        <Button>Pick face</Button>
        <Tooltip>Click a face</Tooltip>
      </TooltipTrigger>,
    )
    await userEvent.tab()
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Click a face')
  })
})
