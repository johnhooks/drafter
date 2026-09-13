import { afterEach, expect, it, vi } from 'vitest'
import { useKeyHandler, useViewHooks } from '../../src/ui/useCommands'
import { useStore } from '../../src/ui/store/store'
import * as actions from '../../src/ui/store/actions'

const effects = vi.hoisted(() => ({ cleanups: [] as Array<() => void> }))
vi.mock('react', async (importOriginal) => ({
  ...await importOriginal<typeof import('react')>(),
  useEffect: (effect: () => (() => void) | void) => {
    const cleanup = effect()
    if (cleanup) effects.cleanups.push(cleanup)
  },
}))

afterEach(() => {
  effects.cleanups.splice(0).reverse().forEach((cleanup) => cleanup())
  vi.unstubAllGlobals()
  useStore.setState(actions.initialState())
})

function setup(consumes: boolean) {
  const target = new EventTarget()
  vi.stubGlobal('window', target)
  vi.stubGlobal('HTMLElement', class {})
  vi.stubGlobal('HTMLInputElement', class {})
  vi.stubGlobal('HTMLTextAreaElement', class {})
  useStore.setState(actions.addSheet(actions.initialState(), 'sheet'))
  const toolConsumes = vi.fn(() => consumes)
  useViewHooks({ toolConsumes })
  useKeyHandler()
  return { target, toolConsumes }
}

function keyEvent(key: string): Event {
  return Object.assign(new Event('keydown', { cancelable: true }), { key, metaKey: false, ctrlKey: false, shiftKey: false, altKey: false })
}

it.each(['Escape', 'Enter'])('lets an active sheet tool consume %s before commands', (key) => {
  const { target, toolConsumes } = setup(true)
  const event = keyEvent(key)
  target.dispatchEvent(event)
  expect(toolConsumes).toHaveBeenCalledWith(key)
  expect(event.defaultPrevented).toBe(true)
  expect(useStore.getState().mode).toEqual({ kind: 'sheet', sheetId: 'sheet' })
})

it('falls through to clearing the sheet when the tool does not consume Escape', () => {
  const { target, toolConsumes } = setup(false)
  target.dispatchEvent(keyEvent('Escape'))
  expect(toolConsumes).toHaveBeenCalledWith('Escape')
  expect(useStore.getState().mode).toEqual({ kind: 'sheet' })
})
