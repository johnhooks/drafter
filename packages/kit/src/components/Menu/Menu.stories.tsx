import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from '../Button/Button'
import { Menu, MenuItem, MenuSection, MenuSeparator, MenuTrigger } from './Menu'

const meta: Meta<typeof Menu> = { title: 'Collections/Menu', component: Menu }
export default meta
type Story = StoryObj<typeof Menu>

export const NewSketch: Story = {
  render: () => (
    <MenuTrigger>
      <Button>New sketch</Button>
      <Menu aria-label="New sketch">
        <MenuSection title="Principal plane">
          <MenuItem id="xz">XZ (front)</MenuItem>
          <MenuItem id="xy">XY (top)</MenuItem>
          <MenuItem id="yz">YZ (side)</MenuItem>
        </MenuSection>
        <MenuSeparator />
        <MenuItem id="face" shortcut="F">
          Pick a face
        </MenuItem>
      </Menu>
    </MenuTrigger>
  ),
}
export const WithDanger: Story = {
  render: () => (
    <MenuTrigger>
      <Button variant="quiet" aria-label="More">
        ...
      </Button>
      <Menu aria-label="Feature">
        <MenuItem id="rename">Rename</MenuItem>
        <MenuItem id="edit">Edit sketch</MenuItem>
        <MenuSeparator />
        <MenuItem id="delete" tone="danger" shortcut="Del">
          Delete
        </MenuItem>
      </Menu>
    </MenuTrigger>
  ),
}
