import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { Button } from '../Button/Button'
import { IconButton } from '../IconButton/IconButton'
import { ToggleButton } from '../ToggleButton/ToggleButton'
import { ToggleButtonGroup } from '../ToggleButtonGroup/ToggleButtonGroup'
import { Toolbar, ToolbarSeparator, ToolbarSpacer } from '../Toolbar/Toolbar'
import { ToggleIconButton } from './ToggleIconButton'

const meta: Meta<typeof ToggleIconButton> = { title: 'Controls/ToggleIconButton', component: ToggleIconButton, args: { icon: 'grid', 'aria-label': 'Grid' } }
export default meta
type Story = StoryObj<typeof ToggleIconButton>

export const Off: Story = {}
export const On: Story = { args: { defaultSelected: true } }
export const Disabled: Story = { args: { isDisabled: true, defaultSelected: true } }

/** The four sketch display toggles as a cluster: grid and dimensions on, handles and sizes off. */
export const DisplayCluster: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
      <ToggleIconButton icon="grid" aria-label="Grid" defaultSelected />
      <ToggleIconButton icon="ruler" aria-label="Dimensions" defaultSelected />
      <ToggleIconButton icon="tag" aria-label="Handles" />
      <ToggleIconButton icon="sizes" aria-label="Sizes" />
    </div>
  ),
}

/** Where the cluster sits: at the right end of the sketch toolbar, before the More menu. */
export const InTheSketchToolbar: Story = {
  render: () => {
    const [display, setDisplay] = useState({ grid: true, dims: true, handles: false, sizes: false })
    const toggle = (k: keyof typeof display) => (on: boolean) => setDisplay((d) => ({ ...d, [k]: on }))
    return (
      <Toolbar aria-label="Sketch">
        <span className="kit-toolbar-title">Untitled</span>
        <IconButton icon="undo" aria-label="Undo" />
        <IconButton icon="redo" aria-label="Redo" isDisabled />
        <ToolbarSeparator />
        <ToggleButtonGroup defaultSelectedKeys={['line']} aria-label="Tool">
          <ToggleButton id="select">Select</ToggleButton>
          <ToggleButton id="line">Line</ToggleButton>
          <ToggleButton id="rect">Rectangle</ToggleButton>
          <ToggleButton id="link">Link</ToggleButton>
        </ToggleButtonGroup>
        <ToolbarSeparator />
        <Button variant="primary">Extrude (all)</Button>
        <Button>Finish</Button>
        <ToolbarSpacer />
        <ToggleIconButton icon="grid" aria-label="Grid" isSelected={display.grid} onChange={toggle('grid')} />
        <ToggleIconButton icon="ruler" aria-label="Dimensions" isSelected={display.dims} onChange={toggle('dims')} />
        <ToggleIconButton icon="tag" aria-label="Handles" isSelected={display.handles} onChange={toggle('handles')} />
        <ToggleIconButton icon="sizes" aria-label="Sizes" isSelected={display.sizes} onChange={toggle('sizes')} />
        <ToolbarSeparator />
        <IconButton icon="ellipsis" aria-label="More" />
      </Toolbar>
    )
  },
}
