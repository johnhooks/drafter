import type { Sixteenths } from '../units'

export type PlaneKind = 'XZ' | 'XY' | 'YZ'

/** A length slot: a plain length in whole sixteenths, or an expression string. Unbranded so literals are easy to write. */
export type Len = number | string

export interface PrincipalPlane {
  readonly kind: 'principal'
  readonly plane: PlaneKind
  readonly offset: Len
  readonly normal: 1 | -1
}

/** The corner where a region's lower-left vertical and horizontal bounding lines meet; names the region just inside it. */
export interface RegionRef {
  readonly vertical: string
  readonly horizontal: string
}

export const regionKey = (r: RegionRef): string => `${r.vertical}|${r.horizontal}`
export const sameRegion = (a: RegionRef, b: RegionRef): boolean => a.vertical === b.vertical && a.horizontal === b.horizontal

/** Which face of a region's extrusion a sketch plane hangs off. cap is the far end of the extrusion. */
export type FaceRole = 'cap' | 'base' | 'side'

export type FaceRef =
  | { readonly kind: 'face'; readonly featureId: string; readonly region: RegionRef; readonly face: 'cap' | 'base' }
  | { readonly kind: 'face'; readonly featureId: string; readonly region: RegionRef; readonly face: 'side'; readonly lineId: string; readonly outward: 1 | -1 }

export type PlaneDef = PrincipalPlane | FaceRef

export interface ResolvedPlane {
  readonly plane: PlaneKind
  readonly offset: Sixteenths
  readonly normal: 1 | -1
}

export type Slot = 'min' | 'max' | 'size'
export const SLOTS: readonly Slot[] = ['min', 'max', 'size']

/** Exactly two of the three are present; the third is derived. */
export interface AxisSlots {
  readonly min?: Len
  readonly max?: Len
  readonly size?: Len
}

/**
 * Where a dimension is drawn. offset is sixteenths from the rectangle edge, positive away from
 * the rectangle on the dimension's default side, negative on the other side. label is a fraction
 * along the line, 0.5 by default, clamped to -0.5..1.5 so short dimensions can carry text outside.
 */
export interface DimLayout {
  readonly offset: number
  readonly label?: number
}

/** A line runs along u (horizontal) or along v (vertical). */
export type LineDir = 'h' | 'v'

/** at is the position on the axis the line crosses; min, max, size are the run along the other axis. */
export type LineSlot = 'at' | Slot
export const LINE_SLOTS: readonly LineSlot[] = ['at', 'min', 'max', 'size']

export type LineLayout = Partial<Record<LineSlot, DimLayout>>

export interface SketchLine {
  readonly id: string
  /** Stable name used in expressions: l1, l2, ... */
  readonly handle: string
  readonly dir: LineDir
  /** v for a horizontal line, u for a vertical one. */
  readonly at: Len
  /** Exactly two of min, max, size along the axis the line runs on. */
  readonly run: AxisSlots
  /** Construction lines snap and take part in expressions but never bound a region. */
  readonly construction?: boolean
  /** Optional placements for this line's dimensions; absent means automatic. */
  readonly layout?: LineLayout
}

/** Placement of a region's width and height labels, keyed in the sketch by the region's corner. */
export interface RegionLabelLayout {
  readonly width?: DimLayout
  readonly height?: DimLayout
}

export const LABEL_MIN = -0.5
export const LABEL_MAX = 1.5

export interface SketchFeature {
  readonly kind: 'sketch'
  readonly id: string
  /** Stable name reserved for expressions: s1, s2, ... */
  readonly handle: string
  readonly name: string
  readonly plane: PlaneDef
  readonly lines: readonly SketchLine[]
  readonly regionLabels?: Readonly<Record<string, RegionLabelLayout>>
}

export type ExtrudeOp = 'new' | 'join' | 'cut'

export interface ExtrudeFeature {
  readonly kind: 'extrude'
  readonly id: string
  readonly name: string
  readonly sketchId: string
  readonly regions: readonly RegionRef[]
  /** Signed: positive along the sketch plane normal. May be an expression over parameters. */
  readonly distance: Len
  readonly op: ExtrudeOp
  readonly targetBodyId?: string
}

export type Feature = SketchFeature | ExtrudeFeature

export interface Param {
  readonly name: string
  readonly value: Len
}

/** The model: what the user built. This is what undo snapshots and what evaluation reads. */
export interface Model {
  readonly title: string
  readonly params: readonly Param[]
  readonly features: readonly Feature[]
}

/** Kept as the name the core uses; the file wraps it as `model`. */
export type Document = Model

export interface CameraState {
  /** Degrees around Z from the +X axis toward +Y. */
  readonly azimuth: number
  /** Degrees above the XY plane, clamped short of the poles. */
  readonly elevation: number
  /** Orthographic zoom in pixels per inch. */
  readonly zoom: number
  /** Orbit centre and look-at point, sixteenths. */
  readonly center: readonly [number, number, number]
}

/** Display state: how the model was being looked at. Saved, never undone, never evaluated. */
export interface ViewState {
  readonly camera: CameraState
  /** Sketch open for editing when the file was saved, if any. */
  readonly sketchId?: string
}

export interface DocumentFile {
  readonly version: 4
  readonly model: Model
  readonly view: ViewState
}

export const DEFAULT_PLANE: PrincipalPlane = { kind: 'principal', plane: 'XZ', offset: 0 as Sixteenths, normal: -1 }

/** Front-left-above isometric: the camera sits at (+x, -y, +z) looking at the origin. */
export const DEFAULT_CAMERA: CameraState = { azimuth: -45, elevation: 35.264, zoom: 6, center: [0, 0, 0] }
export const DEFAULT_VIEW: ViewState = { camera: DEFAULT_CAMERA }

export function newDocument(title = 'Untitled'): Model {
  return { title, params: [], features: [] }
}

export function newFile(title = 'Untitled'): DocumentFile {
  return { version: 4, model: newDocument(title), view: DEFAULT_VIEW }
}

export function isExpr(v: Len): v is string {
  return typeof v === 'string'
}
