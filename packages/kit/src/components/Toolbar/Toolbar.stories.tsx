import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from '../Button/Button'
import { IconButton } from '../IconButton/IconButton'
import { ToggleButton } from '../ToggleButton/ToggleButton'
import { ToggleButtonGroup } from '../ToggleButtonGroup/ToggleButtonGroup'
import { Toolbar, ToolbarSeparator, ToolbarSpacer } from './Toolbar'

const meta: Meta<typeof Toolbar> = { title: 'Controls/Toolbar', component: Toolbar }
export default meta
type Story = StoryObj<typeof Toolbar>

export const SketchToolbar: Story = {
  render: () => (
    <Toolbar aria-label="Sketch">
      <span className="kit-toolbar-title">Untitled</span>
      <ToggleButtonGroup defaultSelectedKeys={['rect']} aria-label="Tool">
        <ToggleButton id="select">Select</ToggleButton>
        <ToggleButton id="rect">Rectangle</ToggleButton>
        <ToggleButton id="link">Link</ToggleButton>
      </ToggleButtonGroup>
      <ToggleButton defaultSelected>Dims</ToggleButton>
      <ToolbarSeparator />
      <Button variant="primary">Extrude</Button>
      <Button>Finish</Button>
      <ToolbarSpacer />
      <Button variant="quiet">Export SVG</Button>
      <IconButton icon="ellipsis" aria-label="More" />
    </Toolbar>
  ),
}
