import type { Point } from '../geometry/Point.ts'
import type { LineStyle } from './LineEntity.ts'

export const MIN_POLYGON_SIDES = 3
export const MAX_POLYGON_SIDES = 50

export interface PolygonEntity {
  id: string
  type: 'polygon'
  center: Point
  radius: number
  sides: number
  /** Direction of the first vertex in world-space degrees. */
  rotation: number
  style: LineStyle
  layerId: string
}

export function createPolygonEntity(center: Point, radius: number, sides: number, rotation: number, style: LineStyle, layerId = 'default'): PolygonEntity {
  return {
    id: globalThis.crypto.randomUUID(),
    type: 'polygon',
    center: { ...center },
    radius,
    sides,
    rotation,
    style: { ...style },
    layerId,
  }
}

export function validPolygonSides(value: number) {
  return Number.isInteger(value) && value >= MIN_POLYGON_SIDES && value <= MAX_POLYGON_SIDES
}
