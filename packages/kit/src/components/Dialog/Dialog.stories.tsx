import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { Button } from '../Button/Button'
import { ConfirmDialog, Dialog, DialogTrigger } from './Dialog'

const meta: Meta<typeof Dialog> = { title: 'Overlays/Dialog', component: Dialog }
export default meta
type Story = StoryObj<typeof Dialog>

export const Confirm: Story = {
  render: () => {
    const [open, setOpen] = useState(false)
    return (
      <>
        <Button tone="danger" onPress={() => setOpen(true)}>
          Delete Extrude 1
        </Button>
        <ConfirmDialog title="Delete Extrude 1?" tone="danger" confirmLabel="Delete" isOpen={open} onConfirm={() => setOpen(false)} onCancel={() => setOpen(false)}>
          Sketch 2 and Extrude 2 depend on it and will be deleted too.
        </ConfirmDialog>
      </>
    )
  },
}
export const Triggered: Story = {
  render: () => (
    <DialogTrigger>
      <Button>About</Button>
      <Dialog title="Drafter">{(close) => <div>A small parametric modeller. <Button onPress={close}>Close</Button></div>}</Dialog>
    </DialogTrigger>
  ),
}
