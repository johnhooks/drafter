import {
  Button,
  Checkbox,
  ConfirmDialog,
  Dialog,
  IconButton,
  Menu,
  MenuItem,
  MenuSection,
  MenuSeparator,
  MenuTrigger,
  Panel,
  Select,
  SelectItem,
  TextField,
  ToastRegion,
  ToggleButton,
  ToggleButtonGroup,
  ToggleIconButton,
  Toolbar,
  ToolbarSeparator,
  ToolbarSpacer,
  toast,
  toastQueue,
} from '@drawing/kit'
import { useEffect, useRef, useState } from 'react'
import { parseDocument, serializeDocument } from '../core/model/document'
import type { PlaneKind, SketchFeature } from '../core/model/types'
import { newDocument } from '../core/model/types'
import type { Sixteenths } from '../core/units'
import { downloadText, downloadUrl, readFile, safeName } from './exportFile'
import { parseLen } from './LenField'
import { ModelView } from './model/ModelView'
import { loadDisplay, loadSaved, loadTheme, save, saveDisplay, saveTheme } from './persist'
import { Properties } from './Properties'
import { SketchEditor, sketchSvgForExport } from './sketch/SketchEditor'
import { DEFAULT_EXTRUDE } from './sketch/tools'
import { type Tool, canRedo, canUndo, fileOf } from './store/actions'
import { useStore } from './store/store'
import { Timeline } from './Timeline'

export function App() {
  const dispatch = useStore((s) => s.dispatch)
  const mode = useStore((s) => s.mode)
  const doc = useStore((s) => s.doc)
  const theme = useStore((s) => s.theme)
  const errors = useStore((s) => s.eval.errors)
  const centre = useRef<HTMLDivElement>(null)

  // load once, then autosave on every document change
  const loaded = useRef(false)
  useEffect(() => {
    // StrictMode re-runs effects in dev; the ref survives that, so the load stays single
    if (!loaded.current) {
      loaded.current = true
      dispatch('setTheme', loadTheme())
      dispatch('setDisplay', loadDisplay())
      const r = loadSaved()
      if (r.kind === 'loaded') dispatch('loadFile', r.file)
      else if (r.kind === 'corrupt') dispatch('notify', r.message, 'danger')
    }
    let warned = false
    let timer: ReturnType<typeof setTimeout> | null = null
    const write = () => {
      timer = null
      if (!save(fileOf(useStore.getState())) && !warned) {
        warned = true
        dispatch('notify', 'Could not save to browser storage. Download the JSON to keep your work.', 'danger')
      }
    }
    const unsub = useStore.subscribe((s, prev) => {
      if (s.doc !== prev.doc) return write()
      // camera drags fire every frame; the view is saved at most a few times a second
      if ((s.view !== prev.view || s.mode !== prev.mode) && !timer) timer = setTimeout(write, 250)
    })
    return () => {
      unsub()
      if (timer) clearTimeout(timer)
    }
  }, [dispatch])

  // the theme attribute lives on the root so portalled popovers and dialogs are themed too
  useEffect(() => {
    document.documentElement.dataset['theme'] = theme
    saveTheme(theme)
  }, [theme])
  const display = useStore((s) => s.display)
  useEffect(() => saveDisplay(display), [display])

  // new store notices become toasts; closing a toast releases the notice so it can appear again later
  const shown = useRef(new Set<string>())
  useEffect(() => {
    const forward = (notices: ReturnType<typeof useStore.getState>['notices']) => {
      for (const n of notices) {
        if (shown.current.has(n.text)) continue
        shown.current.add(n.text)
        toast({ title: n.text, tone: n.tone === 'info' ? 'neutral' : n.tone }, {
          timeout: n.tone === 'info' ? 5000 : undefined,
          onClose: () => {
            shown.current.delete(n.text)
            dispatch('dismissNotice', n.text)
          },
        })
      }
    }
    forward(useStore.getState().notices)
    return useStore.subscribe((s, prev) => {
      if (s.notices !== prev.notices) forward(s.notices)
    })
  }, [dispatch])

  // Cmd or Ctrl plus Z undoes, with Shift redoes; text fields keep the browser's own text undo
  useEffect(() => {
    const isMac = /Mac|iPhone|iPad/.test(navigator.platform)
    const onKey = (e: KeyboardEvent) => {
      const mod = isMac ? e.metaKey : e.ctrlKey
      if (!mod || e.key.toLowerCase() !== 'z') return
      const t = e.target as HTMLElement | null
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return
      e.preventDefault()
      dispatch(e.shiftKey ? 'redo' : 'undo')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [dispatch])

  const sketch = mode.kind === 'sketch' ? doc.features.find((f): f is SketchFeature => f.kind === 'sketch' && f.id === mode.sketchId) : undefined

  return (
    <div className="app">
      <AppToolbar centre={centre} sketch={sketch} />
      <Panel edge="right" className="side">
        <Timeline />
      </Panel>
      <div className="centre" ref={centre}>
        {sketch ? <SketchEditor key={sketch.id} sketch={sketch} /> : <ModelView />}
        {errors.length > 0 && (
          <div className="errors">
            {errors.map((e) => (
              <div className="error" key={`${e.featureId}:${e.message}`}>
                {doc.features.find((f) => f.id === e.featureId)?.name ?? e.featureId}: {e.message}
              </div>
            ))}
          </div>
        )}
      </div>
      <Panel edge="left" className="side">
        <Properties />
      </Panel>
      <ToastRegion />
    </div>
  )
}

function AppToolbar({ centre, sketch }: { centre: React.RefObject<HTMLDivElement | null>; sketch?: SketchFeature }) {
  const dispatch = useStore((s) => s.dispatch)
  const doc = useStore((s) => s.doc)
  const mode = useStore((s) => s.mode)
  const tool = useStore((s) => s.tool)
  const selection = useStore((s) => s.selection)
  const display = useStore((s) => s.display)
  const theme = useStore((s) => s.theme)
  const undoable = useStore(canUndo)
  const redoable = useStore(canRedo)
  const regionCount = useStore((s) => {
    const r = sketch ? s.eval.results.get(sketch.id) : undefined
    return r?.kind === 'sketch' ? r.regions.length : 0
  })
  const fileInput = useRef<HTMLInputElement>(null)
  const [newSketchOpen, setNewSketchOpen] = useState(false)
  const [confirmNew, setConfirmNew] = useState(false)
  const isMac = /Mac|iPhone|iPad/.test(navigator.platform)
  const modKey = isMac ? 'Cmd' : 'Ctrl'

  const exportSvg = () => {
    if (!centre.current || !sketch) return
    const svg = sketchSvgForExport(centre.current, `${doc.title} - ${sketch.name}`)
    if (svg) downloadText(`${safeName(doc.title)}-${safeName(sketch.name)}.svg`, svg, 'image/svg+xml')
  }
  const exportPng = () => {
    const canvas = centre.current?.querySelector('canvas')
    if (!canvas) return
    downloadUrl(`${safeName(doc.title)}.png`, canvas.toDataURL('image/png'))
  }
  const upload = async (file: File) => {
    const r = parseDocument(await readFile(file))
    if (!r.ok) {
      dispatch('notify', `Could not open ${file.name}: ${r.errors.map((e) => `${e.path} ${e.message}`).join('; ')}`, 'danger')
      return
    }
    dispatch('loadFile', r.file)
    toastQueue.clear()
  }
  const onMenu = (key: React.Key) => {
    switch (key) {
      case 'export-svg':
        return exportSvg()
      case 'export-png':
        return exportPng()
      case 'download':
        return downloadText(`${safeName(doc.title)}.json`, serializeDocument(fileOf(useStore.getState())), 'application/json')
      case 'open':
        return fileInput.current?.click()
      case 'new':
        return setConfirmNew(true)
      case 'theme-light':
        return dispatch('setTheme', 'light')
      case 'theme-dark':
        return dispatch('setTheme', 'dark')
    }
  }

  return (
    <Toolbar aria-label="Main" className="topbar">
      <span className="kit-toolbar-title">{doc.title}</span>
      <IconButton icon="undo" aria-label="Undo" isDisabled={!undoable} onPress={() => dispatch('undo')} />
      <IconButton icon="redo" aria-label="Redo" isDisabled={!redoable} onPress={() => dispatch('redo')} />
      <ToolbarSeparator />
      {sketch ? (
        <>
          <ToggleButtonGroup aria-label="Tool" selectedKeys={[tool]} onSelectionChange={(keys) => dispatch('setTool', [...keys][0] as Tool)}>
            <ToggleButton id="select">Select</ToggleButton>
            <ToggleButton id="line">Line</ToggleButton>
            <ToggleButton id="rect">Rectangle</ToggleButton>
            <ToggleButton id="link">Link</ToggleButton>
          </ToggleButtonGroup>
          <ToolbarSeparator />
          <Button
            variant="primary"
            isDisabled={regionCount === 0}
            onPress={() => {
              dispatch('addExtrude', sketch.id, selection.regions, DEFAULT_EXTRUDE)
              dispatch('setMode', { kind: 'model' })
              const id = useStore.getState().doc.features.at(-1)?.id
              const res = id ? useStore.getState().eval.results.get(id) : undefined
              if (id) dispatch('select', { featureId: id, bodyId: res?.kind === 'extrude' ? res.bodyId : undefined })
            }}
          >
            Extrude {selection.regions.length ? `(${selection.regions.length})` : '(all)'}
          </Button>
          <Button onPress={() => dispatch('setMode', { kind: 'model' })}>Finish</Button>
          <ToolbarSpacer />
          <ToggleIconButton icon="grid" aria-label="Grid" isSelected={display.grid} onChange={(on) => dispatch('setDisplay', { grid: on })} />
          <ToggleIconButton icon="ruler" aria-label="Dimensions" isSelected={display.dims} onChange={(on) => dispatch('setDisplay', { dims: on })} />
          <ToggleIconButton icon="tag" aria-label="Handles" isSelected={display.handles} onChange={(on) => dispatch('setDisplay', { handles: on })} />
          <ToggleIconButton icon="sizes" aria-label="Sizes" isSelected={display.sizes} onChange={(on) => dispatch('setDisplay', { sizes: on })} />
          <ToolbarSeparator />
        </>
      ) : (
        <>
          <Button onPress={() => setNewSketchOpen(true)}>New sketch</Button>
          <ToggleButton isSelected={mode.kind === 'pickFace'} onChange={(on) => dispatch('setMode', on ? { kind: 'pickFace' } : { kind: 'model' })}>
            Pick face
          </ToggleButton>
        </>
      )}
      {!sketch && <ToolbarSpacer />}
      <MenuTrigger>
        <IconButton icon="ellipsis" aria-label="More" tooltip={false} />
        <Menu aria-label="More" placement="bottom end" onAction={onMenu}>
          <MenuSection title="Export">
            {sketch ? <MenuItem id="export-svg">Export sketch as SVG</MenuItem> : <MenuItem id="export-png">Export view as PNG</MenuItem>}
            <MenuItem id="download">Download JSON</MenuItem>
          </MenuSection>
          <MenuSeparator />
          <MenuItem id="open">Open JSON</MenuItem>
          <MenuItem id="new">New document</MenuItem>
          <MenuSeparator />
          <MenuSection title="Theme">
            <MenuItem id="theme-light">{theme === 'light' ? 'Light (current)' : 'Light'}</MenuItem>
            <MenuItem id="theme-dark">{theme === 'dark' ? 'Dark (current)' : 'Dark'}</MenuItem>
          </MenuSection>
          <MenuSeparator />
          <MenuItem id="undo-hint" isDisabled>
            Undo {modKey}+Z, redo {modKey}+Shift+Z
          </MenuItem>
        </Menu>
      </MenuTrigger>
      <input
        ref={fileInput}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) void upload(f)
          e.target.value = ''
        }}
      />
      <NewSketchDialog isOpen={newSketchOpen} onClose={() => setNewSketchOpen(false)} />
      <ConfirmDialog
        title="Start a new document?"
        isOpen={confirmNew}
        confirmLabel="New document"
        tone="danger"
        onConfirm={() => {
          setConfirmNew(false)
          dispatch('loadDocument', newDocument())
          toastQueue.clear()
        }}
        onCancel={() => setConfirmNew(false)}
      >
        The current document is replaced. Download it first if you want to keep it.
      </ConfirmDialog>
    </Toolbar>
  )
}

const DEFAULT_NORMAL: Record<PlaneKind, 1 | -1> = { XZ: -1, XY: 1, YZ: 1 }
const NORMAL_AXIS: Record<PlaneKind, string> = { XZ: 'Y', XY: 'Z', YZ: 'X' }

function NewSketchDialog({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const dispatch = useStore((s) => s.dispatch)
  const [plane, setPlane] = useState<PlaneKind>('XZ')
  const [offsetText, setOffsetText] = useState('0')
  const [flip, setFlip] = useState(false)
  const parsed = parseLen(offsetText.replace(/^-/, ''))
  const negative = offsetText.trim().startsWith('-')
  const create = () => {
    if (!parsed.ok) return
    const offset = typeof parsed.value === 'number' ? (((negative ? -1 : 1) * parsed.value) as Sixteenths) : negative ? `-(${parsed.value})` : parsed.value
    const normal = (flip ? -DEFAULT_NORMAL[plane] : DEFAULT_NORMAL[plane]) as 1 | -1
    dispatch('addSketch', { kind: 'principal', plane, offset, normal })
    onClose()
  }
  return (
    <Dialog title="New sketch" isOpen={isOpen} onOpenChange={(open) => !open && onClose()}>
      <div className="kit-fields">
        <Select label="Plane" selectedKey={plane} onSelectionChange={(k) => setPlane(k as PlaneKind)}>
          <SelectItem id="XZ">XZ (front)</SelectItem>
          <SelectItem id="XY">XY (top)</SelectItem>
          <SelectItem id="YZ">YZ (side)</SelectItem>
        </Select>
        <TextField
          label={`Offset along ${NORMAL_AXIS[plane]}`}
          value={offsetText}
          validate={(t) => {
            const r = parseLen(t.replace(/^-/, ''))
            return r.ok ? { ok: true, value: t } : r
          }}
          onCommit={(_v, t) => setOffsetText(t)}
          description={`Default normal ${DEFAULT_NORMAL[plane] > 0 ? '+' : '-'}${NORMAL_AXIS[plane]}`}
        />
        <Checkbox isSelected={flip} onChange={setFlip}>
          Flip normal (sketch from the other side)
        </Checkbox>
        <div className="kit-dialog-actions">
          <Button
            onPress={() => {
              dispatch('setMode', { kind: 'pickFace' })
              onClose()
            }}
          >
            Pick a face instead
          </Button>
          <Button variant="primary" isDisabled={!parsed.ok} onPress={create}>
            Create
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
