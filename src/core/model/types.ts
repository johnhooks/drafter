import type { Sixteenths } from '../units'

export type PlaneKind = 'XZ' | 'XY' | 'YZ'

export interface PrincipalPlane {
  readonly kind: 'principal'
  readonly plane: PlaneKind
  readonly offset: Sixteenths
  readonly normal: 1 | -1
}

/** Which face of an extruded box a sketch plane hangs off. cap is the far end of the extrusion. */
export type FaceRole = 'cap' | 'base' | 'uMin' | 'uMax' | 'vMin' | 'vMax'

export interface FaceRef {
  readonly kind: 'face'
  readonly featureId: string
  readonly rectId?: string
  readonly face: FaceRole
}

export type PlaneDef = PrincipalPlane | FaceRef

export interface ResolvedPlane {
  readonly plane: PlaneKind
  readonly offset: Sixteenths
  readonly normal: 1 | -1
}

/** Two opposite corners in plane coordinates; order does not matter. */
export interface SketchRect {
  readonly id: string
  readonly u1: Sixteenths
  readonly v1: Sixteenths
  readonly u2: Sixteenths
  readonly v2: Sixteenths
}

export interface SketchFeature {
  readonly kind: 'sketch'
  readonly id: string
  readonly name: string
  readonly plane: PlaneDef
  readonly rects: readonly SketchRect[]
}

export type ExtrudeOp = 'new' | 'join' | 'cut'

export interface ExtrudeFeature {
  readonly kind: 'extrude'
  readonly id: string
  readonly name: string
  readonly sketchId: string
  readonly rectIds: readonly string[]
  /** Signed: positive along the sketch plane normal. */
  readonly distance: Sixteenths
  readonly op: ExtrudeOp
  readonly targetBodyId?: string
}

export type Feature = SketchFeature | ExtrudeFeature

export interface Document {
  readonly version: 1
  readonly title: string
  readonly features: readonly Feature[]
}

export const DEFAULT_PLANE: PrincipalPlane = { kind: 'principal', plane: 'XZ', offset: 0 as Sixteenths, normal: -1 }

export function newDocument(title = 'Untitled'): Document {
  return { version: 1, title, features: [] }
}
