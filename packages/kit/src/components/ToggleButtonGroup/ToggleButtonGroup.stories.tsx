import type { Meta, StoryObj } from '@storybook/react-vite'
import { ToggleButton } from '../ToggleButton/ToggleButton'
import { ToggleButtonGroup } from './ToggleButtonGroup'

const meta: Meta<typeof ToggleButtonGroup> = { title: 'Controls/ToggleButtonGroup', component: ToggleButtonGroup }
export default meta
type Story = StoryObj<typeof ToggleButtonGroup>

export const Tools: Story = {
  render: () => (
    <ToggleButtonGroup defaultSelectedKeys={['rect']} aria-label="Tool">
      <ToggleButton id="select">Select</ToggleButton>
      <ToggleButton id="rect">Rectangle</ToggleButton>
      <ToggleButton id="link">Link</ToggleButton>
    </ToggleButtonGroup>
  ),
}
export const Multiple: Story = {
  render: () => (
    <ToggleButtonGroup selectionMode="multiple" disallowEmptySelection={false} defaultSelectedKeys={['dims']} aria-label="Overlays">
      <ToggleButton id="dims">Dims</ToggleButton>
      <ToggleButton id="grid">Grid</ToggleButton>
    </ToggleButtonGroup>
  ),
}
