import { OrbitControls, OrthographicCamera } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { useEffect, useRef, useState } from 'react'
import { MOUSE, type OrthographicCamera as ThreeOrtho, Vector3 } from 'three'
import type { CameraState } from '../../core/model/types'
import type { Face } from '../../core/geom/faces'
import { findFaceRef } from '../../core/eval/pick'
import { toPlane } from '../../core/model/planes'
import type { Vec3 } from '../../core/model/planes'
import { useStore } from '../store/store'
import { BodyMesh, planeOfFace } from './BodyMesh'

const ORBIT_DISTANCE = 200

/** Camera position in world inches from the stored spherical state. */
export function cameraPosition(c: CameraState): [number, number, number] {
  const az = (c.azimuth * Math.PI) / 180
  const el = (c.elevation * Math.PI) / 180
  const [cx, cy, cz] = c.center.map((v) => v / 16)
  return [cx! + ORBIT_DISTANCE * Math.cos(el) * Math.cos(az), cy! + ORBIT_DISTANCE * Math.cos(el) * Math.sin(az), cz! + ORBIT_DISTANCE * Math.sin(el)]
}

function targetOf(c: CameraState): Vector3 {
  return new Vector3(c.center[0] / 16, c.center[1] / 16, c.center[2] / 16)
}

export function ModelView() {
  const ev = useStore((s) => s.eval)
  const doc = useStore((s) => s.doc)
  const mode = useStore((s) => s.mode)
  const selection = useStore((s) => s.selection)
  const dispatch = useStore((s) => s.dispatch)
  const [space, setSpace] = useState(false)
  const container = useRef<HTMLDivElement>(null)
  const camera = useStore((s) => s.view.camera)
  const cameraRef = useRef<ThreeOrtho>(null)
  const controlsRef = useRef<{ target: Vector3 } | null>(null)

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !(e.target instanceof HTMLInputElement)) setSpace(true)
      if (e.key === 'Escape' && (mode.kind === 'pickFace' || mode.kind === 'pickBody')) dispatch('setMode', { kind: 'model' })
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
  const pickingBody = mode.kind === 'pickBody'
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
      <Canvas orthographic gl={{ preserveDrawingBuffer: true, antialias: true }} onPointerMissed={() => !picking && !pickingBody && dispatch('select', {})}>
        <OrthographicCamera ref={cameraRef} makeDefault position={cameraPosition(camera)} up={[0, 0, 1]} zoom={camera.zoom} near={-2000} far={2000} />
        <OrbitControls
          ref={controlsRef as never}
          target={targetOf(camera)}
          enableRotate={false}
          enableDamping={false}
          mouseButtons={{ LEFT: space ? MOUSE.PAN : (undefined as unknown as MOUSE), MIDDLE: MOUSE.PAN, RIGHT: MOUSE.PAN }}
          onChange={() => {
            // zoom and pan are display state, written back so they persist; the camera itself is driven from the store
            const cam = cameraRef.current
            const ctl = controlsRef.current
            if (!cam || !ctl) return
            const t = ctl.target
            const center: [number, number, number] = [Math.round(t.x * 16), Math.round(t.y * 16), Math.round(t.z * 16)]
            const cur = useStore.getState().view.camera
            if (cam.zoom !== cur.zoom || center.some((c, i) => c !== cur.center[i])) dispatch('setCamera', { zoom: cam.zoom, center })
          }}
        />
        <gridHelper args={[400, 400, '#d0d0cc', '#e8e8e5']} rotation={[Math.PI / 2, 0, 0]} />
        <axesHelper args={[12]} />
        {bodies.map((b) => (
          <BodyMesh
            key={b.id}
            body={b}
            selected={selection.bodyId === b.id}
            pickable={picking || pickingBody}
            onFace={(face, point) => {
              if (mode.kind === 'pickBody') {
                // the body a face belongs to becomes the target; only bodies created before the extrude qualify
                const idx = doc.features.findIndex((f) => f.id === mode.extrudeId)
                const creator = doc.features.slice(0, idx).find((f) => f.kind === 'extrude' && f.id === b.id)
                if (!creator) return dispatch('notify', 'That body is created after this extrude; pick one made earlier in the timeline.')
                dispatch('updateExtrude', mode.extrudeId, { targetBodyId: b.id })
                dispatch('setMode', { kind: 'model' })
                dispatch('select', { featureId: mode.extrudeId, bodyId: b.id })
                return
              }
              onFace(face, point)
            }}
            onBody={() => {
              const creator = doc.features.find((f) => f.kind === 'extrude' && f.id === b.id)
              dispatch('select', { bodyId: b.id, featureId: creator?.id })
            }}
          />
        ))}
      </Canvas>
      {picking && <div className="hint">Click a face to sketch on it. Esc to cancel.</div>}
      {pickingBody && <div className="hint">Click a body to use as the target. Esc to cancel.</div>}
      {!picking && bodies.length === 0 && <div className="hint">No bodies yet. New Sketch, draw a rectangle, then Extrude.</div>}
    </div>
  )
}
