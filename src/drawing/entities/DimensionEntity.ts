import type { Point } from '../geometry/Point.ts'

export type DimensionSource =
  | { type: 'entity'; targetEntityId: string }
  | { type: 'points'; start: Point; end: Point }

export interface DimensionEntity {
  id: string
  type: 'dimension'
  source: DimensionSource
  offset: number
  side: 1 | -1
  style: {
    color?: string
    textSize?: number
  }
  layerId: string
}

export function createDimensionEntity(targetEntityId: string, offset: number, side: 1 | -1): DimensionEntity {
  return createEntityDimension(targetEntityId, offset, side)
}

export function createEntityDimension(targetEntityId: string, offset: number, side: 1 | -1): DimensionEntity {
  return { id: globalThis.crypto.randomUUID(), type: 'dimension', source: { type: 'entity', targetEntityId }, offset, side, style: {}, layerId: 'dimensions' }
}

export function createPointDimension(start: Point, end: Point, offset: number, side: 1 | -1): DimensionEntity {
  return { id: globalThis.crypto.randomUUID(), type: 'dimension', source: { type: 'points', start: { ...start }, end: { ...end } }, offset, side, style: {}, layerId: 'dimensions' }
}
