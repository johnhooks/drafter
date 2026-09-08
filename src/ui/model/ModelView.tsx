import { OrbitControls, OrthographicCamera } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { useEffect, useRef, useState } from 'react'
import { MOUSE } from 'three'
import type { Face } from '../../core/geom/faces'
import { findFaceRef } from '../../core/eval/pick'
import { toPlane } from '../../core/model/planes'
import type { Vec3 } from '../../core/model/planes'
import { useStore } from '../store/store'
import { BodyMesh, planeOfFace } from './BodyMesh'

export function ModelView() {
  const ev = useStore((s) => s.eval)
  const doc = useStore((s) => s.doc)
  const mode = useStore((s) => s.mode)
  const selection = useStore((s) => s.selection)
  const dispatch = useStore((s) => s.dispatch)
  const [space, setSpace] = useState(false)
  const container = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !(e.target instanceof HTMLInputElement)) setSpace(true)
      if (e.key === 'Escape' && mode.kind === 'pickFace') dispatch('setMode', { kind: 'model' })
    }
    const up = (e: KeyboardEvent) => e.code === 'Space' && setSpace(false)
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [mode.kind, dispatch])

  const picking = mode.kind === 'pickFace'
  const onFace = (face: Face, point: [number, number, number]) => {
    const plane = planeOfFace(face)
    const p = { x: Math.round(point[0]), y: Math.round(point[1]), z: Math.round(point[2]) } as unknown as Vec3
    const { u, v } = toPlane(plane, p)
    const ref = findFaceRef(ev, plane, u, v)
    if (!ref) return dispatch('notify', 'That face does not belong to an extrude; pick another face.')
    dispatch('addSketch', ref)
  }

  const bodies = [...ev.bodies.values()]
  return (
    <div className="view" ref={container} data-model-view>
      <Canvas orthographic gl={{ preserveDrawingBuffer: true, antialias: true }} onPointerMissed={() => !picking && dispatch('select', {})}>
        <OrthographicCamera makeDefault position={[200, -200, 200]} up={[0, 0, 1]} zoom={6} near={-2000} far={2000} />
        <OrbitControls
          enableRotate={false}
          enableDamping={false}
          mouseButtons={{ LEFT: space ? MOUSE.PAN : (undefined as unknown as MOUSE), MIDDLE: MOUSE.PAN, RIGHT: MOUSE.PAN }}
        />
        <gridHelper args={[400, 400, '#d0d0cc', '#e8e8e5']} rotation={[Math.PI / 2, 0, 0]} />
        <axesHelper args={[12]} />
        {bodies.map((b) => (
          <BodyMesh
            key={b.id}
            body={b}
            selected={selection.bodyId === b.id}
            pickable={picking}
            onFace={onFace}
            onBody={() => {
              const creator = doc.features.find((f) => f.kind === 'extrude' && f.id === b.id)
              dispatch('select', { bodyId: b.id, featureId: creator?.id })
            }}
          />
        ))}
      </Canvas>
      {picking && <div className="hint">Click a face to sketch on it. Esc to cancel.</div>}
      {!picking && bodies.length === 0 && <div className="hint">No bodies yet. New Sketch, draw a rectangle, then Extrude.</div>}
    </div>
  )
}
