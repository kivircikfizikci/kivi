import type { Point } from '../geometry/Point.ts'
import type { LineStyle } from './LineEntity.ts'

export interface CircleEntity {
  id: string
  type: 'circle'
  center: Point
  radius: number
  style: LineStyle
}

export function createCircleEntity(center: Point, radius: number, style: LineStyle): CircleEntity {
  return {
    id: globalThis.crypto.randomUUID(),
    type: 'circle',
    center: { ...center },
    radius,
    style: { ...style },
  }
}
