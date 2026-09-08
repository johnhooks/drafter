import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from '../Button/Button'
import { ToastRegion, toast } from './Toast'

function Demo() {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <ToastRegion />
      <Button onPress={() => toast('Saved')}>Plain</Button>
      <Button onPress={() => toast({ title: 'Those edges are not parallel', description: 'Pick a parallel edge to measure from', tone: 'warning' })}>Warning</Button>
      <Button onPress={() => toast({ title: 'Could not open file.json', description: 'features[0].sketchId references unknown sketch', tone: 'danger' })}>Danger</Button>
    </div>
  )
}

const meta: Meta<typeof Demo> = { title: 'Overlays/Toast', component: Demo }
export default meta
export const Toasts: StoryObj<typeof Demo> = {}
