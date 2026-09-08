import { useEffect, useRef, useState } from 'react'
import { parseDocument, serializeDocument } from '../core/model/document'
import type { PlaneKind, SketchFeature } from '../core/model/types'
import { newDocument } from '../core/model/types'
import { type Sixteenths, formatLength, parseLength } from '../core/units'
import { downloadText, downloadUrl, readFile, safeName } from './exportFile'
import { ModelView } from './model/ModelView'
import { Notices } from './Notices'
import { loadSaved, save } from './persist'
import { Properties } from './Properties'
import { SketchEditor, sketchSvgForExport } from './sketch/SketchEditor'
import { DEFAULT_EXTRUDE } from './sketch/tools'
import { useStore } from './store/store'
import { Timeline } from './Timeline'

export function App() {
  const dispatch = useStore((s) => s.dispatch)
  const mode = useStore((s) => s.mode)
  const doc = useStore((s) => s.doc)
  const errors = useStore((s) => s.eval.errors)
  const centre = useRef<HTMLDivElement>(null)

  // load once, then autosave on every document change
  const loaded = useRef(false)
  useEffect(() => {
    // StrictMode re-runs effects in dev; the ref survives that, so the load stays single
    if (!loaded.current) {
      loaded.current = true
      const r = loadSaved()
      if (r.kind === 'loaded') dispatch('loadDocument', r.doc)
      else if (r.kind === 'corrupt') dispatch('notify', r.message)
    }
    let warned = false
    const unsub = useStore.subscribe((s, prev) => {
      if (s.doc === prev.doc) return
      if (!save(s.doc) && !warned) {
        warned = true
        dispatch('notify', 'Could not save to browser storage. Download the JSON to keep your work.')
      }
    })
    return unsub
  }, [dispatch])

  const sketch = mode.kind === 'sketch' ? doc.features.find((f): f is SketchFeature => f.kind === 'sketch' && f.id === mode.sketchId) : undefined

  return (
    <div className="app">
      <Toolbar centre={centre} sketch={sketch} />
      <div className="panel left">
        <Timeline />
      </div>
      <div className="centre" ref={centre}>
        <Notices />
        {sketch ? <SketchEditor key={sketch.id} sketch={sketch} /> : <ModelView />}
        {errors.length > 0 && (
          <div className="errors">
            {errors.map((e) => (
              <div className="error" key={e.featureId}>
                {doc.features.find((f) => f.id === e.featureId)?.name ?? e.featureId}: {e.message}
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="panel right">
        <Properties />
      </div>
    </div>
  )
}

function Toolbar({ centre, sketch }: { centre: React.RefObject<HTMLDivElement | null>; sketch?: SketchFeature }) {
  const dispatch = useStore((s) => s.dispatch)
  const doc = useStore((s) => s.doc)
  const mode = useStore((s) => s.mode)
  const tool = useStore((s) => s.tool)
  const selection = useStore((s) => s.selection)
  const showDims = useStore((s) => s.showDims)
  const fileInput = useRef<HTMLInputElement>(null)

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
      dispatch('notify', `Could not open ${file.name}: ${r.errors.map((e) => `${e.path} ${e.message}`).join('; ')}`)
      return
    }
    dispatch('loadDocument', r.doc)
  }

  return (
    <div className="toolbar">
      <span className="title">{doc.title}</span>
      {sketch ? (
        <>
          <button className={tool === 'select' ? 'active' : ''} onClick={() => dispatch('setTool', 'select')}>
            Select
          </button>
          <button className={tool === 'rect' ? 'active' : ''} onClick={() => dispatch('setTool', 'rect')}>
            Rectangle
          </button>
          <button className={tool === 'link' ? 'active' : ''} onClick={() => dispatch('setTool', 'link')}>
            Link
          </button>
          <button className={showDims ? 'active' : ''} onClick={() => dispatch('toggleDims')} title="Show or hide driving dimensions">
            Dims
          </button>
          <button
            disabled={sketch.rects.length === 0}
            onClick={() => {
              dispatch('addExtrude', sketch.id, selection.rectIds, DEFAULT_EXTRUDE)
              dispatch('setMode', { kind: 'model' })
              const id = useStore.getState().doc.features.at(-1)?.id
              const res = id ? useStore.getState().eval.results.get(id) : undefined
              if (id) dispatch('select', { featureId: id, bodyId: res?.kind === 'extrude' ? res.bodyId : undefined })
            }}
          >
            Extrude {selection.rectIds.length ? `(${selection.rectIds.length})` : '(all)'}
          </button>
          <button onClick={() => dispatch('setMode', { kind: 'model' })}>Finish</button>
          <span className="spacer" />
          <button onClick={exportSvg}>Export SVG</button>
        </>
      ) : (
        <>
          <NewSketchMenu />
          <button className={mode.kind === 'pickFace' ? 'active' : ''} onClick={() => dispatch('setMode', mode.kind === 'pickFace' ? { kind: 'model' } : { kind: 'pickFace' })}>
            Pick face
          </button>
          <span className="spacer" />
          <button onClick={exportPng}>Export PNG</button>
        </>
      )}
      <button onClick={() => downloadText(`${safeName(doc.title)}.json`, serializeDocument(doc), 'application/json')}>Download JSON</button>
      <button onClick={() => fileInput.current?.click()}>Open JSON</button>
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
      <button
        onClick={() => {
          if (window.confirm('Start a new document? The current one is replaced.')) dispatch('loadDocument', newDocument())
        }}
      >
        New document
      </button>
    </div>
  )
}

function NewSketchMenu() {
  const dispatch = useStore((s) => s.dispatch)
  const [open, setOpen] = useState(false)
  const [plane, setPlane] = useState<PlaneKind>('XZ')
  const [offsetText, setOffsetText] = useState('0')
  const [flip, setFlip] = useState(false)
  const parsed = parseLength(offsetText.replace(/^-/, ''))
  const negative = offsetText.trim().startsWith('-')
  const defaultNormal: Record<PlaneKind, 1 | -1> = { XZ: -1, XY: 1, YZ: 1 }
  return (
    <div className="menu">
      <button className={open ? 'active' : ''} onClick={() => setOpen(!open)}>
        New sketch
      </button>
      {open && (
        <div className="dropdown">
          <label className="field">
            <span>Plane</span>
            <select value={plane} onChange={(e) => setPlane(e.target.value as PlaneKind)}>
              <option value="XZ">XZ (front)</option>
              <option value="XY">XY (top)</option>
              <option value="YZ">YZ (side)</option>
            </select>
          </label>
          <label className="field">
            <span>Offset along the normal axis</span>
            <input className={parsed.ok ? '' : 'invalid'} value={offsetText} onChange={(e) => setOffsetText(e.target.value)} />
            {!parsed.ok && <div className="error">{parsed.error}</div>}
          </label>
          <label className="field row">
            <input type="checkbox" style={{ width: 'auto' }} checked={flip} onChange={(e) => setFlip(e.target.checked)} />
            <span style={{ margin: 0 }}>Flip normal (sketch from the other side)</span>
          </label>
          <div className="row">
            <button
              disabled={!parsed.ok}
              onClick={() => {
                if (!parsed.ok) return
                const offset = ((negative ? -1 : 1) * parsed.value) as Sixteenths
                const normal = (flip ? -defaultNormal[plane] : defaultNormal[plane]) as 1 | -1
                dispatch('addSketch', { kind: 'principal', plane, offset, normal })
                setOpen(false)
              }}
            >
              Create
            </button>
            <button
              onClick={() => {
                dispatch('setMode', { kind: 'pickFace' })
                setOpen(false)
              }}
            >
              Pick a face instead
            </button>
          </div>
          <div className="muted" style={{ marginTop: 6 }}>
            Default {formatLength(0 as Sixteenths)} offset, normal {defaultNormal[plane] > 0 ? '+' : '-'}
            {plane === 'XZ' ? 'Y' : plane === 'XY' ? 'Z' : 'X'}
          </div>
        </div>
      )}
    </div>
  )
}
