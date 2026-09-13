import { Button, Dialog } from '@bitmachina/drafter-kit'
import { useState } from 'react'
import { KeyBindings } from '../../../../src/ui/KeyBindings'
import { useStore } from '../../../../src/ui/store/store'

export default {
  title: 'Application/Keyboard shortcuts',
  component: KeyBindings,
  beforeEach: () => {
    const keys = useStore.getState().keys
    useStore.getState().dispatch('resetKeys')
    return () => useStore.getState().dispatch('setKeys', keys)
  },
}

function ShortcutsDialog() {
  const [open, setOpen] = useState(true)
  return <>
    <Button onPress={() => setOpen(true)}>Keyboard shortcuts</Button>
    <Dialog title="Keyboard shortcuts" isOpen={open} onOpenChange={setOpen}><KeyBindings /></Dialog>
  </>
}

export const Default = { render: () => <ShortcutsDialog /> }
export const Customized = {
  beforeEach: () => useStore.getState().dispatch('setKeys', { 'tool.select': 'V', 'tool.line': null }),
  render: () => <ShortcutsDialog />,
}
