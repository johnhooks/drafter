import { beforeAll, describe, expect, it, vi } from 'vitest'
import { Box3, Mesh, OrthographicCamera, Scene, Vector3 } from 'three'
import { box } from '../../src/core/geom/box'
import { newBody } from '../../src/core/geom/body'
import type { EvalResult } from '../../src/core/eval/evaluate'
import type { Sheet } from '../../src/core/sheets/types'
import { cachedIsometric, renderIsometric, renderIsometricSync } from '../../src/ui/sheets/isoRender'

const backend = vi.hoisted(() => ({
  canvases: [] as { hidden: boolean; width: number; height: number; toDataURL: ReturnType<typeof vi.fn> }[],
  frames: [] as { camera: OrthographicCamera; scene: Scene; width: number; height: number }[],
  fail: false,
}))

vi.mock('three', async () => {
  const { createRequire } = await import('node:module')
  const actual = createRequire(import.meta.url)('three') as typeof import('three')
  return {
    ...actual,
    WebGLRenderer: class {
      domElement: typeof backend.canvases[number]
      xr = { enabled: false, isPresenting: false }
      pixelRatio = 1
      constructor({ canvas }: { canvas: typeof backend.canvases[number] }) { this.domElement = canvas }
      getPixelRatio() { return this.pixelRatio }
      getSize(target: { set: (width: number, height: number) => unknown }) { return target.set(this.domElement.width / this.pixelRatio, this.domElement.height / this.pixelRatio) }
      setPixelRatio(ratio: number) { this.pixelRatio = ratio }
      setSize(width: number, height: number) { Object.assign(this.domElement, { width: width * this.pixelRatio, height: height * this.pixelRatio }) }
      render(scene: Scene, camera: OrthographicCamera) {
        if (backend.fail) { backend.fail = false; throw new Error('GPU failed') }
        backend.frames.push({ scene: scene.clone(), camera: camera.clone(), width: this.domElement.width, height: this.domElement.height })
      }
    },
  }
})

beforeAll(() => {
  vi.stubGlobal('window', { devicePixelRatio: 3 })
  vi.stubGlobal('document', {
    createElement: () => {
      const canvas = { hidden: false, width: 0, height: 0, toDataURL: vi.fn(() => `data:image/png;base64,frame${backend.frames.length}`) }
      backend.canvases.push(canvas)
      return canvas
    },
  })
})

function model(): EvalResult {
  const bodies = [newBody('first', 'First', box(160, 320, 320, 400, 480, 528)), newBody('second', 'Second', box(-320, -160, -160, 0, -80, 0))]
  return { bodies: new Map(bodies.map((body) => [body.id, body])), results: new Map(), errors: [], params: new Map(), paramErrors: new Map() }
}

function sheet(overrides: object = {}): Sheet {
  return { id: 'iso', name: 'Isometric', view: 'isometric', orientation: 'landscape', scale: 1, camera: { azimuth: -45, elevation: 35.264 }, ...overrides } as Sheet
}

function latest() { return backend.frames.at(-1)! }

describe('offscreen isometric rendering', () => {
  it('captures synchronously on a cold renderer and populates the shared cache', async () => {
    const evaluation = model()
    const original = sheet()
    const image = renderIsometricSync(original, evaluation)
    expect(image).toMatch(/^data:image\/png;base64,/)
    expect(latest()).toMatchObject({ width: 3000, height: 1950 })
    expect(new Box3().setFromObject(latest().scene).isEmpty()).toBe(false)
    expect(cachedIsometric(original, evaluation)).toBe(image)
    const count = backend.frames.length
    expect(renderIsometricSync(original, evaluation)).toBe(image)
    expect(await renderIsometric(original, evaluation)).toBe(image)
    expect(backend.frames.length).toBe(count)
    expect(backend.canvases).toHaveLength(1)
  })

  it('matches the r3f geometry, materials, lights, and framing synchronously', async () => {
    const original = sheet({ targetBodyId: 'first' })
    await renderIsometric(original, model())
    const asynchronous = latest()
    renderIsometricSync(original, model())
    const synchronous = latest()
    const meshes = (scene: Scene) => {
      const values: unknown[] = []
      scene.traverse((object) => {
        if (object instanceof Mesh || object.type === 'LineSegments') {
          const mesh = object as Mesh
          const material = mesh.material as import('three').MeshLambertMaterial
          values.push({ type: mesh.type, vertices: Array.from(mesh.geometry.getAttribute('position').array), color: material.color.getHex(), side: material.side, material: material.type })
        }
        if (object.type.endsWith('Light')) {
          const light = object as import('three').DirectionalLight
          values.push({ type: light.type, position: light.position.toArray(), intensity: light.intensity, target: light.target?.position.toArray() })
        }
      })
      return values
    }
    expect(meshes(synchronous.scene)).toEqual(meshes(asynchronous.scene))
    expect(synchronous.camera.projectionMatrix.elements).toEqual(asynchronous.camera.projectionMatrix.elements)
    expect(synchronous.camera.matrixWorld.elements).toEqual(asynchronous.camera.matrixWorld.elements)
  })

  it('does not let pending async captures overwrite synchronous images or dimensions', async () => {
    const evaluation = model()
    const original = sheet()
    const pending = renderIsometric(original, evaluation)
    await Promise.resolve()
    await Promise.resolve()
    const portrait = sheet({ orientation: 'portrait', targetBodyId: 'first' })
    const portraitImage = renderIsometricSync(portrait, evaluation)
    expect(latest()).toMatchObject({ width: 2250, height: 2700 })
    const current = renderIsometricSync(original, evaluation)
    expect(await pending).toBe(current)
    expect(cachedIsometric(original, evaluation)).toBe(current)
    expect(cachedIsometric(portrait, evaluation)).toBe(portraitImage)
    expect(latest()).toMatchObject({ width: 3000, height: 1950 })
    expect(backend.canvases).toHaveLength(1)
  })

  it('does not cache a failed synchronous capture and allows retry', () => {
    const evaluation = model()
    backend.fail = true
    expect(() => renderIsometricSync(sheet(), evaluation)).toThrow('GPU failed')
    expect(cachedIsometric(sheet(), evaluation)).toBeUndefined()
    expect(renderIsometricSync(sheet(), evaluation)).toMatch(/^data:image\/png;/)
  })

  it('synchronously exposes completed images without starting a render', async () => {
    const evaluation = model()
    const original = sheet()
    const before = backend.frames.length
    expect(cachedIsometric(original, evaluation)).toBeUndefined()
    expect(backend.frames.length).toBe(before)
    const pending = renderIsometric(original, evaluation)
    expect(cachedIsometric(original, evaluation)).toBeUndefined()
    const image = await pending
    expect(cachedIsometric(sheet({ name: 'Updated' }), evaluation)).toBe(image)
    expect(cachedIsometric(sheet({ orientation: 'portrait' }), evaluation)).toBeUndefined()
    expect(cachedIsometric(original, { ...evaluation })).toBeUndefined()
  })
  it('renders the drawing area at 300 DPI, independent of display DPR', async () => {
    const result = await renderIsometric(sheet(), model())
    expect(result).toMatch(/^data:image\/png;base64,/)
    expect(latest()).toMatchObject({ width: 3000, height: 1950 })
    expect(backend.canvases[0]!.hidden).toBe(true)
    expect(backend.canvases[0]!.toDataURL).toHaveBeenLastCalledWith('image/png')
    await renderIsometric(sheet({ orientation: 'portrait' }), model())
    expect(latest()).toMatchObject({ width: 2250, height: 2700 })
    expect(backend.canvases).toHaveLength(1)
  })

  it('frames only the target using captured degree angles and shared face rendering', async () => {
    await renderIsometric(sheet({ targetBodyId: 'first', scale: 2, camera: { azimuth: -90, elevation: 0 } }), model())
    const { camera, scene } = latest()
    expect(camera.up.distanceTo(new Vector3(0, 0, 1))).toBeCloseTo(0)
    expect(camera.getWorldDirection(new Vector3()).toArray()[1]).toBeCloseTo(1)
    const bounds = new Box3().setFromObject(scene)
    expect(bounds.min.toArray()).toEqual([10, 20, 30])
    expect(bounds.max.toArray()).toEqual([20, 25, 33])
    expect(bounds.getCenter(new Vector3()).project(camera).x).toBeCloseTo(0)
    expect(bounds.getCenter(new Vector3()).project(camera).y).toBeCloseTo(0)
    for (const horizontal of [10, 20]) for (const depth of [20, 25]) for (const vertical of [30, 33]) {
      const projected = new Vector3(horizontal, depth, vertical).project(camera)
      expect(Math.abs(projected.x)).toBeLessThan(1)
      expect(Math.abs(projected.y)).toBeLessThan(1)
      expect(Math.abs(projected.z)).toBeLessThan(1)
    }
    const meshes: Mesh[] = []
    scene.traverse((object) => { if (object instanceof Mesh) meshes.push(object) })
    expect(meshes).toHaveLength(6)
    expect(meshes.every((mesh) => !Array.isArray(mesh.material) && mesh.material.type === 'MeshLambertMaterial')).toBe(true)
    expect(scene.children.some((object) => object.type === 'AmbientLight')).toBe(true)
    expect(scene.children.some((object) => object.type === 'DirectionalLight')).toBe(true)
  })

  it('shares cached and in-flight images across sheets and annotation edits', async () => {
    const evaluation = model()
    const before = backend.frames.length
    const original = sheet()
    const [first, duplicate] = await Promise.all([
      renderIsometric(original, evaluation),
      renderIsometric(sheet({ id: 'other', name: 'Renamed', notes: [{ id: 'note', text: 'Note', position: [1, 2] }] }), evaluation),
    ])
    expect(first).toBe(duplicate)
    expect(await renderIsometric(original, evaluation)).toBe(first)
    expect(backend.frames.length - before).toBe(1)
  })

  it('invalidates on model identity, target, either captured angle, and raster dimensions', async () => {
    const evaluation = model()
    const variants = [sheet(), sheet({ targetBodyId: 'first' }), sheet({ camera: { azimuth: 45, elevation: 35.264 } }), sheet({ camera: { azimuth: -45, elevation: -20 } }), sheet({ orientation: 'portrait' })]
    const before = backend.frames.length
    const images = await Promise.all(variants.map((variant) => renderIsometric(variant, evaluation)))
    images.push(await renderIsometric(sheet(), { ...evaluation }))
    expect(new Set(images).size).toBe(6)
    expect(backend.frames.length - before).toBe(6)
    expect(backend.canvases).toHaveLength(1)
  })

  it('returns an empty image for a missing target instead of the whole model', async () => {
    await renderIsometric(sheet({ targetBodyId: 'missing' }), model())
    expect(new Box3().setFromObject(latest().scene).isEmpty()).toBe(true)
    expect(Number.isFinite(latest().camera.projectionMatrix.determinant())).toBe(true)
  })

  it('does not cache failures or poison later queued renders', async () => {
    const evaluation = model()
    backend.fail = true
    const failed = renderIsometric(sheet(), evaluation)
    const next = renderIsometric(sheet({ targetBodyId: 'first' }), evaluation)
    await expect(failed).rejects.toThrow('GPU failed')
    expect(cachedIsometric(sheet(), evaluation)).toBeUndefined()
    await expect(next).resolves.toMatch(/^data:image\/png;/)
    await expect(renderIsometric(sheet(), evaluation)).resolves.toMatch(/^data:image\/png;/)
  })

  it('rejects absent or nonfinite captured angles', async () => {
    for (const camera of [undefined, { azimuth: NaN, elevation: 0 }, { azimuth: 0, elevation: Infinity }]) {
      await expect(renderIsometric(sheet({ camera }), model())).rejects.toThrow(/camera/i)
    }
  })

  it('uses paper ratios for both render paths and invalidates the scale cache', async () => {
    const evaluation = model()
    for (const scale of [4, 8]) {
      const current = sheet({ scale, camera: { azimuth: -90, elevation: 0 } })
      const before = backend.frames.length
      const image = await renderIsometric(current, evaluation)
      expect(backend.frames.length).toBe(before + 1)
      const first = new Vector3(0, 0, 0).project(latest().camera)
      const second = new Vector3(24, 0, 0).project(latest().camera)
      expect((second.x - first.x) * latest().width / 2 / 300).toBeCloseTo(24 / scale)
      expect(cachedIsometric(current, evaluation)).toBe(image)
      renderIsometricSync(current, model())
      const syncFirst = new Vector3(0, 0, 0).project(latest().camera)
      const syncSecond = new Vector3(24, 0, 0).project(latest().camera)
      expect((syncSecond.x - syncFirst.x) * latest().width / 2 / 300).toBeCloseTo(24 / scale)
    }
  })

  it('keeps oblique edges foreshortened and oversized targets clipped', async () => {
    await renderIsometric(sheet({ scale: 4, camera: { azimuth: -45, elevation: 0 } }), model())
    const first = new Vector3(0, 0, 0).project(latest().camera)
    const second = new Vector3(24, 0, 0).project(latest().camera)
    expect((second.x - first.x) * latest().width / 600).toBeCloseTo(6 / Math.sqrt(2))
    const large = newBody('large', 'Large', box(0, 1600, 0, 16, 0, 1600))
    await renderIsometric(sheet({ scale: 1, camera: { azimuth: -90, elevation: 0 } }), { ...model(), bodies: new Map([[large.id, large]]) })
    expect(latest().camera.zoom).toBe(300)
    expect(Math.abs(new Vector3(0, 0, 0).project(latest().camera).x)).toBeGreaterThan(1)
  })
})
