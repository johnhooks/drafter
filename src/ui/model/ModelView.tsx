import { GizmoHelper, GizmoViewcube, OrbitControls, OrthographicCamera } from '@react-three/drei'
import { Canvas, type ThreeEvent } from '@react-three/fiber'
import { useEffect, useRef, useState } from 'react'
import { MOUSE, type OrthographicCamera as ThreeOrtho, Vector3 } from 'three'
import type { Face } from '../../core/geom/faces'
import { findFaceRef } from '../../core/eval/pick'
import { bodyBounds } from '../../core/geom/body'
import { toPlane } from '../../core/model/planes'
import type { Vec3 } from '../../core/model/planes'
import type { CameraState } from '../../core/model/types'
import { DEFAULT_CAMERA } from '../../core/model/types'
import { useStore } from '../store/store'
import { BodyMesh, planeOfFace } from './BodyMesh'
import { CANONICAL_VIEWS, type CanonicalView, clampElevation, lerpView, snapTarget, sphericalOf, viewFromDirection, wrapAzimuth } from './views'

const ORBIT_DISTANCE = 200
const EASE_MS = 150

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

const KEY_VIEWS: Record<string, CanonicalView['id']> = { '1': 'front', '2': 'back', '3': 'left', '4': 'right', '5': 'top', '6': 'bottom' }

export function ModelView() {
  const ev = useStore((s) => s.eval)
  const doc = useStore((s) => s.doc)
  const mode = useStore((s) => s.mode)
  const selection = useStore((s) => s.selection)
  const dispatch = useStore((s) => s.dispatch)
  const camera = useStore((s) => s.view.camera)
  const [space, setSpace] = useState(false)
  const [alt, setAlt] = useState(false)
  const container = useRef<HTMLDivElement>(null)
  const cameraRef = useRef<ThreeOrtho>(null)
  const controlsRef = useRef<{ target: Vector3; object: ThreeOrtho } | null>(null)
  const easing = useRef<number | null>(null)

  /** Animates azimuth and elevation to a view; zoom and centre are left alone. */
  const easeTo = (to: { azimuth: number; elevation: number }) => {
    if (easing.current) cancelAnimationFrame(easing.current)
    const from = useStore.getState().view.camera
    const start = performance.now()
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / EASE_MS)
      const k = 1 - (1 - t) * (1 - t)
      // land exactly on the target so canonical views are exact, not a rounding away
      dispatch('setCamera', t < 1 ? lerpView(from, to, k) : { azimuth: to.azimuth, elevation: to.elevation })
      if (t < 1) easing.current = requestAnimationFrame(step)
      else easing.current = null
    }
    easing.current = requestAnimationFrame(step)
  }
  const goTo = (id: CanonicalView['id']) => {
    const v = CANONICAL_VIEWS.find((x) => x.id === id)
    if (!v) return
    // a key or cube click is a decision: jump exactly rather than start another ease from a moving value
    if (easing.current) cancelAnimationFrame(easing.current)
    easing.current = null
    dispatch('setCamera', { azimuth: v.azimuth, elevation: v.elevation })
  }

  /** Centres and zooms so every body fits with a margin. */
  const fit = () => {
    const boxes = [...ev.bodies.values()].map(bodyBounds).filter((b): b is NonNullable<typeof b> => !!b)
    if (boxes.length === 0) return dispatch('setCamera', { center: [0, 0, 0], zoom: DEFAULT_CAMERA.zoom })
    const min = [Math.min(...boxes.map((b) => b.x0)), Math.min(...boxes.map((b) => b.y0)), Math.min(...boxes.map((b) => b.z0))]
    const max = [Math.max(...boxes.map((b) => b.x1)), Math.max(...boxes.map((b) => b.y1)), Math.max(...boxes.map((b) => b.z1))]
    const center: [number, number, number] = [Math.round((min[0]! + max[0]!) / 2), Math.round((min[1]! + max[1]!) / 2), Math.round((min[2]! + max[2]!) / 2)]
    // the diagonal bounds the projected extent from any angle; leave a margin
    const diagonalIn = Math.hypot(max[0]! - min[0]!, max[1]! - min[1]!, max[2]! - min[2]!) / 16
    const el = container.current
    const px = el ? Math.min(el.clientWidth, el.clientHeight) : 600
    dispatch('setCamera', { center, zoom: Math.max(0.5, (px * 0.8) / Math.max(diagonalIn, 1)) })
  }

  useEffect(() => {
    const isText = (t: EventTarget | null) => t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement || (t instanceof HTMLElement && t.isContentEditable)
    const down = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !isText(e.target)) setSpace(true)
      if (e.key === 'Alt') setAlt(true)
      if (e.key === 'Escape') {
        if (mode.kind === 'pickFace' || mode.kind === 'pickBody') dispatch('setMode', { kind: 'model' })
        else if (!isText(e.target)) dispatch('select', {})
      }
      if (isText(e.target) || e.metaKey || e.ctrlKey) return
      if (KEY_VIEWS[e.key]) goTo(KEY_VIEWS[e.key]!)
      else if (e.key === 'Home') goTo('iso-fl')
      else if (e.key === 'f' || e.key === 'F') fit()
    }
    const up = (e: KeyboardEvent) => {
      if (e.code === 'Space') setSpace(false)
      if (e.key === 'Alt') setAlt(false)
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode.kind, dispatch, ev])

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

  /** Reads the controls' camera back into the store after user input. */
  const syncFromControls = () => {
    const cam = cameraRef.current
    const ctl = controlsRef.current
    if (!cam || !ctl) return
    const t = ctl.target
    const sph = sphericalOf(cam.position.x - t.x, cam.position.y - t.y, cam.position.z - t.z)
    const center: [number, number, number] = [Math.round(t.x * 16), Math.round(t.y * 16), Math.round(t.z * 16)]
    const cur = useStore.getState().view.camera
    // angles are kept to a thousandth of a degree so reading the camera back never drifts a stored view
    const azimuth = Math.round(sph.azimuth * 1000) / 1000
    const elevation = Math.round(clampElevation(sph.elevation) * 1000) / 1000
    const zoom = Math.round(cam.zoom * 1000) / 1000
    const changed =
      zoom !== cur.zoom || center.some((c, i) => c !== cur.center[i]) || Math.abs(wrapAzimuth(azimuth - cur.azimuth)) > 1e-9 || Math.abs(elevation - cur.elevation) > 1e-9
    if (changed) dispatch('setCamera', { zoom, center, azimuth, elevation })
  }

  const bodies = [...ev.bodies.values()]
  return (
    <div className="view" ref={container} data-model-view>
      <Canvas orthographic gl={{ preserveDrawingBuffer: true, antialias: true }} onPointerMissed={() => !picking && !pickingBody && dispatch('select', {})}>
        <OrthographicCamera ref={cameraRef} makeDefault position={cameraPosition(camera)} up={[0, 0, 1]} zoom={camera.zoom} near={-2000} far={2000} />
        <OrbitControls
          ref={controlsRef as never}
          target={targetOf(camera)}
          enableRotate
          enableDamping={false}
          minPolarAngle={(1 * Math.PI) / 180}
          maxPolarAngle={(179 * Math.PI) / 180}
          mouseButtons={{
            LEFT: space ? MOUSE.PAN : alt ? MOUSE.ROTATE : (undefined as unknown as MOUSE),
            MIDDLE: MOUSE.PAN,
            RIGHT: MOUSE.ROTATE,
          }}
          onStart={() => {
            if (easing.current) cancelAnimationFrame(easing.current)
            easing.current = null
          }}
          onChange={syncFromControls}
          onEnd={() => {
            syncFromControls()
            const target = snapTarget(useStore.getState().view.camera)
            if (target) easeTo(target)
          }}
        />
        {/* light fixed to the camera so brightness follows the angle to the viewer from every side */}
        <ambientLight intensity={0.55} />
        <directionalLight position={cameraPosition({ ...camera, azimuth: camera.azimuth + 25, elevation: Math.min(80, camera.elevation + 20) })} intensity={1.1} />
        {/* the ground grid never writes depth, so from below it stays behind the bodies instead of hatching them */}
        <gridHelper args={[400, 400, '#d0d0cc', '#e8e8e5']} rotation={[Math.PI / 2, 0, 0]} renderOrder={-1}>
          <lineBasicMaterial attach="material" vertexColors depthWrite={false} transparent opacity={0.9} />
        </gridHelper>
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
        <GizmoHelper alignment="bottom-right" margin={[64, 64]} onUpdate={() => {}} onTarget={() => targetOf(useStore.getState().view.camera)}>
          <GizmoViewcube
            color="#d6d6d6"
            hoverColor="#f5a623"
            textColor="#1e1e1e"
            strokeColor="#7a7a7a"
            faces={['Right', 'Left', 'Back', 'Front', 'Top', 'Bottom']}
            onClick={(e: ThreeEvent<MouseEvent>) => {
              e.stopPropagation()
              // faces sit at the origin and carry their direction as the face normal; edge and corner strips
              // are offset along the diagonal they stand for, so their position is the direction. The camera
              // goes to that direction exactly, as a view cube does: faces, the twelve edges, the eight corners.
              const p = e.object.position
              const n = e.face?.normal
              const d: [number, number, number] = p.lengthSq() > 1e-6 ? [p.x, p.y, p.z] : n ? [n.x, n.y, n.z] : [0, 0, 1]
              easeTo(viewFromDirection(d))
              return null
            }}
          />
        </GizmoHelper>
      </Canvas>
      {picking && <div className="hint">Click a face to sketch on it. Esc to cancel.</div>}
      {pickingBody && <div className="hint">Click a body to use as the target. Esc to cancel.</div>}
      {!picking && !pickingBody && bodies.length === 0 && <div className="hint">No bodies yet. New Sketch, draw a rectangle, then Extrude.</div>}
    </div>
  )
}
