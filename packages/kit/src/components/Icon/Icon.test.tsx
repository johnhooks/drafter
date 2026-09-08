import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ICON_NAMES, Icon } from './Icon'

describe('Icon', () => {
  it('renders every name as an svg, hidden unless labelled', () => {
    const { container } = render(
      <>
        {ICON_NAMES.map((n) => (
          <Icon key={n} name={n} />
        ))}
      </>,
    )
    expect(container.querySelectorAll('svg')).toHaveLength(ICON_NAMES.length)
    for (const svg of container.querySelectorAll('svg')) expect(svg).toHaveAttribute('aria-hidden', 'true')
  })
  it('a labelled icon is an image', () => {
    render(<Icon name="close" label="Close" />)
    expect(screen.getByRole('img', { name: 'Close' })).toBeTruthy()
  })
})
