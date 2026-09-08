import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from '../Button/Button'
import { Tooltip, TooltipTrigger } from './Tooltip'

const meta: Meta<typeof Tooltip> = { title: 'Overlays/Tooltip', component: Tooltip }
export default meta
type Story = StoryObj<typeof Tooltip>

export const OnButton: Story = {
  render: () => (
    <TooltipTrigger>
      <Button>Pick face</Button>
      <Tooltip>Click a face in the 3D view to sketch on it</Tooltip>
    </TooltipTrigger>
  ),
}
