import { useMemo, useState } from 'react'
import { BufferAttribute, BufferGeometry } from 'three'
import type { ThreeEvent } from '@react-three/fiber'
import type { Body } from '../../core/geom/body'
import { type Face, faces } from '../../core/geom/faces'
import { FRAMES, PLANE_BY_NORMAL } from '../../core/model/planes'
import type { ResolvedPlane } from '../../core/model/types'

const IN = 1 / 16

/** Base tone; the camera-fixed light in the view supplies the per-face shading. */
const BASE = '#d9d9d6'
const SELECTED = '#a9bfe0'
const HOVER = '#7fb2ee'

function toXYZ(f: Face, u: number, v: number): [number, number, number] {
  const p = { x: 0, y: 0, z: 0 }
  const frame = FRAMES[PLANE_BY_NORMAL[f.axis]]
  p[frame.u] = u
  p[frame.v] = v
  p[frame.n] = f.coord
  return [p.x * IN, p.y * IN, p.z * IN]
}

export function faceGeometry(f: Face): BufferGeometry {
  const pos: number[] = []
  for (const r of f.rects) {
    const a = toXYZ(f, r.u0, r.v0)
    const b = toXYZ(f, r.u1, r.v0)
    const c = toXYZ(f, r.u1, r.v1)
    const d = toXYZ(f, r.u0, r.v1)
    pos.push(...a, ...b, ...c, ...a, ...c, ...d)
  }
  const g = new BufferGeometry()
  g.setAttribute('position', new BufferAttribute(new Float32Array(pos), 3))
  g.computeVertexNormals()
  return g
}

export function faceEdges(f: Face): Float32Array {
  const pos: number[] = []
  for (const loop of f.loops) {
    for (let i = 0; i < loop.length; i++) {
      const a = loop[i]!
      const b = loop[(i + 1) % loop.length]!
      pos.push(...toXYZ(f, a[0], a[1]), ...toXYZ(f, b[0], b[1]))
    }
  }
  return new Float32Array(pos)
}

export function planeOfFace(f: Face): ResolvedPlane {
  return { plane: PLANE_BY_NORMAL[f.axis], offset: f.coord as never, normal: f.dir }
}

interface Props {
  body: Body
  selected: boolean
  pickable: boolean
  onFace: (face: Face, point: [number, number, number]) => void
  onBody: () => void
}

export function BodyMesh({ body, selected, pickable, onFace, onBody }: Props) {
  const parts = useMemo(() => faces(body).map((f) => ({ face: f, geometry: faceGeometry(f), edges: faceEdges(f) })), [body])
  const [hover, setHover] = useState<number | null>(null)
  return (
    <group>
      {parts.map((p, i) => (
        <group key={i}>
          <mesh
            geometry={p.geometry}
            onPointerOver={(e: ThreeEvent<PointerEvent>) => {
              e.stopPropagation()
              if (pickable) setHover(i)
            }}
            onPointerOut={() => setHover((h) => (h === i ? null : h))}
            onPointerDown={(e: ThreeEvent<PointerEvent>) => {
              if (e.button !== 0) return
              e.stopPropagation()
              if (pickable) onFace(p.face, [e.point.x / IN, e.point.y / IN, e.point.z / IN])
              else onBody()
            }}
          >
            <meshLambertMaterial color={hover === i && pickable ? HOVER : selected ? SELECTED : BASE} />
          </mesh>
          <lineSegments>
            <bufferGeometry>
              <bufferAttribute attach="attributes-position" args={[p.edges, 3]} />
            </bufferGeometry>
            <lineBasicMaterial color={selected ? '#0b6bcb' : '#333'} />
          </lineSegments>
        </group>
      ))}
    </group>
  )
}

