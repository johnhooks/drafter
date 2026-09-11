import type { CanonicalView } from './model/views'
import { type State, type Tool, canRedo, canUndo } from './store/actions'
import type { Store } from './store/store'

/** The distance a new extrude starts with: 1". */
export const DEFAULT_EXTRUDE = 16

export type CommandView = 'model' | 'sketch' | 'any'

/**
 * Callbacks the views own and the store does not: camera moves ease through frames in ModelView,
 * and a tool's drag or chain lives in SketchEditor. Each view registers its callbacks while mounted.
 */
export interface ViewHooks {
  goTo?: (view: CanonicalView['id']) => void
  fit?: () => void
  /** Ends whatever the active tool has in progress without committing it. */
  cancelTool?: () => void
  /** Escape or Enter while the active tool has something in progress; true when the tool took it. */
  toolConsumes?: (key: string) => boolean
  /** Selects the feature just appended and its body, so the extrude's properties open. */
  selectLatest?: () => void
  openNewSketch?: () => void
  menu?: (action: string) => void
}

export interface CommandContext {
  readonly state: State
  readonly dispatch: Store['dispatch']
  readonly hooks: ViewHooks
}

/**
 * Everything the user can trigger from a key, a button, or a menu item. Controls read their label,
 * enabled state, and tooltip from here, and the one key handler resolves chords against `key`.
 */
export interface Command {
  readonly id: string
  readonly label: string
  readonly view: CommandView
  /** Default chord in the `Mod+Shift+Z` form; absent means unbound by default. */
  readonly key?: string
  /** A fixed alias that always works alongside the bound chord, such as Backspace for Delete. */
  readonly alias?: string
  readonly when?: (s: State) => boolean
  readonly run: (ctx: CommandContext) => void
}

const inSketch = (s: State) => s.mode.kind === 'sketch'
const sketchId = (s: State) => (s.mode.kind === 'sketch' ? s.mode.sketchId : undefined)

const toolCommand = (tool: Tool, label: string, key: string): Command => ({
  id: `tool.${tool}`,
  label,
  view: 'sketch',
  key,
  when: (s) => inSketch(s) && s.tool !== tool,
  run: ({ dispatch, hooks }) => {
    // a chain or drag in the old tool must not survive into the new one
    hooks.cancelTool?.()
    dispatch('setTool', tool)
  },
})

const viewCommand = (id: CanonicalView['id'], label: string, key: string): Command => ({
  id: `view.${id}`,
  label,
  view: 'model',
  key,
  run: ({ hooks }) => hooks.goTo?.(id),
})

export const COMMANDS: readonly Command[] = [
  toolCommand('select', 'Select', 'A'),
  toolCommand('line', 'Line', 'L'),
  toolCommand('rect', 'Rectangle', 'R'),
  toolCommand('link', 'Link', 'D'),
  {
    id: 'sketch.construction',
    label: 'Toggle construction',
    view: 'sketch',
    key: 'X',
    when: (s) => inSketch(s) && s.selection.lineIds.length > 0,
    run: ({ state, dispatch }) => dispatch('toggleConstruction', sketchId(state)!, state.selection.lineIds),
  },
  {
    id: 'sketch.delete',
    label: 'Delete selection',
    view: 'sketch',
    key: 'Delete',
    alias: 'Backspace',
    when: (s) => inSketch(s) && (s.selection.lineIds.length > 0 || s.selection.regions.length > 0 || !!s.selection.constraint),
    run: ({ state, dispatch }) => dispatch('deleteSelection', sketchId(state)!),
  },
  {
    id: 'sketch.extrude',
    label: 'Extrude',
    view: 'sketch',
    when: (s) => {
      const id = sketchId(s)
      const r = id ? s.eval.results.get(id) : undefined
      return r?.kind === 'sketch' && r.regions.length > 0
    },
    run: ({ state, dispatch, hooks }) => {
      dispatch('addExtrude', sketchId(state)!, state.selection.regions, DEFAULT_EXTRUDE)
      dispatch('setMode', { kind: 'model' })
      hooks.selectLatest?.()
    },
  },
  {
    id: 'sketch.finish',
    label: 'Finish',
    view: 'sketch',
    when: inSketch,
    run: ({ dispatch }) => dispatch('setMode', { kind: 'model' }),
  },
  {
    id: 'model.newSketch',
    label: 'New sketch',
    view: 'model',
    run: ({ hooks }) => hooks.openNewSketch?.(),
  },
  {
    id: 'model.pickFace',
    label: 'Pick face',
    view: 'model',
    run: ({ state, dispatch }) => dispatch('setMode', state.mode.kind === 'pickFace' ? { kind: 'model' } : { kind: 'pickFace' }),
  },
  viewCommand('front', 'Front view', '1'),
  viewCommand('back', 'Back view', '2'),
  viewCommand('left', 'Left view', '3'),
  viewCommand('right', 'Right view', '4'),
  viewCommand('top', 'Top view', '5'),
  viewCommand('bottom', 'Bottom view', '6'),
  viewCommand('iso-fl', 'Default view', 'Home'),
  { id: 'view.fit', label: 'Fit', view: 'model', key: 'F', run: ({ hooks }) => hooks.fit?.() },
  { id: 'edit.undo', label: 'Undo', view: 'any', key: 'Mod+Z', when: canUndo, run: ({ dispatch }) => dispatch('undo') },
  { id: 'edit.redo', label: 'Redo', view: 'any', key: 'Mod+Shift+Z', when: canRedo, run: ({ dispatch }) => dispatch('redo') },
  {
    id: 'edit.cancel',
    label: 'Cancel',
    view: 'any',
    key: 'Escape',
    run: ({ state, dispatch, hooks }) => {
      if (state.mode.kind === 'pickFace' || state.mode.kind === 'pickBody') return dispatch('setMode', { kind: 'model' })
      hooks.cancelTool?.()
      dispatch('select', state.mode.kind === 'sketch' ? { featureId: state.mode.sketchId } : {})
    },
  },
  { id: 'file.exportSvg', label: 'Export sketch as SVG', view: 'sketch', run: ({ hooks }) => hooks.menu?.('export-svg') },
  { id: 'file.exportPng', label: 'Export view as PNG', view: 'model', run: ({ hooks }) => hooks.menu?.('export-png') },
  { id: 'file.download', label: 'Download JSON', view: 'any', run: ({ hooks }) => hooks.menu?.('download') },
  { id: 'file.open', label: 'Open JSON', view: 'any', run: ({ hooks }) => hooks.menu?.('open') },
  { id: 'file.new', label: 'New document', view: 'any', run: ({ hooks }) => hooks.menu?.('new') },
]

export const commandById = (id: string): Command | undefined => COMMANDS.find((c) => c.id === id)

/** Commands that apply in the current mode: sketch commands in a sketch, model commands elsewhere, `any` always. */
export function commandsFor(mode: State['mode']): readonly Command[] {
  const view: CommandView = mode.kind === 'sketch' ? 'sketch' : 'model'
  return COMMANDS.filter((c) => c.view === 'any' || c.view === view)
}

/** Two commands can share a chord only when their views never coincide. */
export const viewsOverlap = (a: CommandView, b: CommandView) => a === 'any' || b === 'any' || a === b
