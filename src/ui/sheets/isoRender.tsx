import { createRoot, extend, useThree } from '@react-three/fiber'
import { useLayoutEffect, type ReactNode } from 'react'
import * as THREE from 'three'
import type { EvalResult } from '../../core/eval/evaluate'
import type { Body } from '../../core/geom/body'
import { faces } from '../../core/geom/faces'
import { pageLayout } from '../../core/sheets/layout'
import { isometricProjection } from '../../core/sheets/isometric'
import type { Sheet } from '../../core/sheets/types'
import { BODY_BASE_COLOR, BODY_EDGE_COLOR, BodyMesh, faceGeometry, faceEdges } from '../model/BodyMesh'

type Angles = { azimuth: number; elevation: number }
type CacheEntry = { pending: Promise<string>; image?: string }

const cache = new WeakMap<EvalResult, Map<string, CacheEntry>>()
let surface: { canvas: HTMLCanvasElement; root: ReturnType<typeof createRoot>; gl: THREE.WebGLRenderer } | undefined
let queue: Promise<unknown> = Promise.resolve()

function inputs(sheet: Sheet) {
  const camera = sheet.camera
  if (!camera || !Number.isFinite(camera.azimuth) || !Number.isFinite(camera.elevation)) return undefined
  const { drawing } = pageLayout(sheet.orientation)
  const width = Math.ceil(drawing.width * 300)
  const height = Math.ceil(drawing.height * 300)
  return {
    width, height, scale: sheet.scale, azimuth: camera.azimuth, elevation: camera.elevation,
    key: JSON.stringify([sheet.targetBodyId ?? null, camera.azimuth, camera.elevation, sheet.scale, width, height]),
  }
}

function position(center: THREE.Vector3, angles: Angles, distance: number): THREE.Vector3 {
  const azimuth = angles.azimuth * Math.PI / 180
  const elevation = angles.elevation * Math.PI / 180
  return new THREE.Vector3(Math.cos(elevation) * Math.cos(azimuth), Math.cos(elevation) * Math.sin(azimuth), Math.sin(elevation)).multiplyScalar(distance).add(center)
}

function Capture({ children, canvas, resolve, reject }: {
  children: ReactNode
  canvas: HTMLCanvasElement
  resolve: (image: string) => void
  reject: (error: unknown) => void
}) {
  const get = useThree((state) => state.get)
  useLayoutEffect(() => {
    try {
      const { gl, scene, camera } = get()
      scene.updateMatrixWorld(true)
      gl.render(scene, camera)
      resolve(canvas.toDataURL('image/png'))
    } catch (error) {
      reject(error)
    }
  }, [get, canvas, resolve, reject])
  return children
}

const ignorePick = () => {}

function getSurface() {
  if (!surface) {
    extend({
      Group: THREE.Group, Mesh: THREE.Mesh, MeshLambertMaterial: THREE.MeshLambertMaterial,
      LineSegments: THREE.LineSegments, BufferGeometry: THREE.BufferGeometry,
      BufferAttribute: THREE.BufferAttribute, LineBasicMaterial: THREE.LineBasicMaterial,
      AmbientLight: THREE.AmbientLight, DirectionalLight: THREE.DirectionalLight,
    })
    const canvas = document.createElement('canvas')
    canvas.hidden = true
    const gl = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true })
    gl.outputColorSpace = THREE.SRGBColorSpace
    gl.toneMapping = THREE.ACESFilmicToneMapping
    surface = { canvas, gl, root: createRoot(canvas) }
  }
  return surface
}

function frame(bodies: Body[], input: NonNullable<ReturnType<typeof inputs>>) {
  const projection = isometricProjection(bodies, input)
  const center = new THREE.Vector3().fromArray(projection.center).multiplyScalar(1 / 16)
  const depth = Math.max(projection.depthSpan / 16, 1)
  const distance = Math.max(200, depth)
  const camera = new THREE.OrthographicCamera(-input.width / 2, input.width / 2, input.height / 2, -input.height / 2, 0.1, distance + depth)
  Object.assign(camera, { manual: true })
  camera.up.fromArray(projection.up)
  camera.position.copy(center).addScaledVector(new THREE.Vector3().fromArray(projection.depth), distance)
  camera.zoom = 300 / input.scale
  camera.lookAt(center)
  camera.updateProjectionMatrix()
  camera.updateMatrixWorld(true)
  const lightTarget = new THREE.Object3D()
  lightTarget.position.copy(center)
  const lightPosition = position(center, { azimuth: input.azimuth + 25, elevation: Math.min(80, input.elevation + 20) }, 200)
  return { camera, lightTarget, lightPosition }
}

async function raster(bodies: Body[], input: NonNullable<ReturnType<typeof inputs>>): Promise<string> {
  const { canvas, root, gl } = getSurface()
  const { camera, lightTarget, lightPosition } = frame(bodies, input)
  await root.configure({ gl, camera, frameloop: 'never', dpr: 1, size: { width: input.width, height: input.height, top: 0, left: 0 } })
  return new Promise<string>((resolve, reject) => {
    root.render(
      <Capture canvas={canvas} resolve={resolve} reject={reject}>
        <ambientLight intensity={0.55} />
        <primitive object={lightTarget} />
        <directionalLight position={lightPosition} target={lightTarget} intensity={1.1} />
        {bodies.map((body) => <BodyMesh key={body.id} body={body} selected={false} pickable={false} onFace={ignorePick} onBody={ignorePick} />)}
      </Capture>,
    )
  })
}

function targetBodies(sheet: Sheet, model: EvalResult): Body[] {
  if (sheet.targetBodyId === undefined) return [...model.bodies.values()]
  const target = model.bodies.get(sheet.targetBodyId)
  return target ? [target] : []
}

function modelCache(model: EvalResult) {
  let entries = cache.get(model)
  if (!entries) { entries = new Map(); cache.set(model, entries) }
  return entries
}

export function renderIsometricSync(sheet: Sheet, model: EvalResult): string {
  const input = inputs(sheet)
  if (!input) throw new Error('Isometric rendering requires a finite captured camera orientation.')
  const entries = modelCache(model)
  const cached = entries.get(input.key)?.image
  if (cached !== undefined) return cached
  const bodies = targetBodies(sheet, model)
  const { canvas, gl } = getSurface()
  const { camera, lightTarget, lightPosition } = frame(bodies, input)
  const scene = new THREE.Scene()
  const light = new THREE.DirectionalLight(0xffffff, 1.1)
  light.position.copy(lightPosition)
  light.target = lightTarget
  scene.add(new THREE.AmbientLight(0xffffff, 0.55), lightTarget, light)
  const material = new THREE.MeshLambertMaterial({ color: BODY_BASE_COLOR, side: THREE.DoubleSide })
  const edgeMaterial = new THREE.LineBasicMaterial({ color: BODY_EDGE_COLOR })
  const geometries: THREE.BufferGeometry[] = []
  const size = gl.getSize(new THREE.Vector2())
  const pixelRatio = gl.getPixelRatio()
  try {
    for (const body of bodies) {
      const group = new THREE.Group()
      scene.add(group)
      for (const face of faces(body)) {
        const geometry = faceGeometry(face)
        geometries.push(geometry)
        const edges = new THREE.BufferGeometry()
        geometries.push(edges)
        edges.setAttribute('position', new THREE.BufferAttribute(faceEdges(face), 3))
        const part = new THREE.Group()
        part.add(new THREE.Mesh(geometry, material), new THREE.LineSegments(edges, edgeMaterial))
        group.add(part)
      }
    }
    gl.setPixelRatio(1)
    gl.setSize(input.width, input.height, false)
    scene.updateMatrixWorld(true)
    gl.render(scene, camera)
    const image = canvas.toDataURL('image/png')
    entries.set(input.key, { image, pending: Promise.resolve(image) })
    return image
  } finally {
    for (const geometry of geometries) geometry.dispose()
    material.dispose()
    edgeMaterial.dispose()
    gl.setPixelRatio(pixelRatio)
    gl.setSize(size.x, size.y, false)
  }
}

export function cachedIsometric(sheet: Sheet, model: EvalResult): string | undefined {
  const input = inputs(sheet)
  return input ? cache.get(model)?.get(input.key)?.image : undefined
}

export async function renderIsometric(sheet: Sheet, model: EvalResult): Promise<string> {
  const input = inputs(sheet)
  if (!input) throw new Error('Isometric rendering requires a finite captured camera orientation.')
  const entries = modelCache(model)
  const cached = entries.get(input.key)
  if (cached) return cached.pending
  const bodies = targetBodies(sheet, model)
  const pending = queue.then(() => entries.get(input.key)?.image ?? raster(bodies, input)).then(
    (image) => entries.get(input.key)?.image ?? image,
    (error: unknown) => {
      const image = entries.get(input.key)?.image
      if (image !== undefined) return image
      throw error
    },
  )
  const entry: CacheEntry = { pending }
  entries.set(input.key, entry)
  queue = pending.then((image) => { entry.image = image }, () => { if (entries.get(input.key) === entry) entries.delete(input.key) })
  return pending
}
