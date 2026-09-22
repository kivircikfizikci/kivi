import type { Entity } from '../entities/Entity.ts'
import type { Point } from '../geometry/Point.ts'

export type SnapKind = 'endpoint' | 'midpoint' | 'grid' | 'angle'

export interface SnapCandidate {
  kind: SnapKind
  point: Point
  distancePixels: number
  entityId?: string
  angle?: number
}

export interface SnapSettings {
  endpoint: boolean
  midpoint: boolean
  grid: boolean
  angle: boolean
  gridSpacing: number
  pixelTolerance: number
  angleThresholdDegrees?: number
  angles?: readonly number[]
}

export interface SnapContext {
  pointer: Point
  entities: readonly Entity[]
  zoom: number
  settings: SnapSettings
  angleOrigin?: Point
}
