import type { Point } from '../geometry/Point.ts'
import type { LineStyle } from './LineEntity.ts'

export interface RectangleEntity {
  id: string
  type: 'rectangle'
  /** Bottom-left corner in world coordinates. */
  origin: Point
  width: number
  height: number
  /** World-space degrees from +X; positive angles turn counter-clockwise. */
  rotation: number
  style: LineStyle
  layerId: string
}

export function createRectangleEntity(origin: Point, width: number, height: number, style: LineStyle, layerId = 'default'): RectangleEntity {
  return {
    id: globalThis.crypto.randomUUID(),
    type: 'rectangle',
    origin: { ...origin },
    width,
    height,
    rotation: 0,
    style: { ...style },
    layerId,
  }
}
