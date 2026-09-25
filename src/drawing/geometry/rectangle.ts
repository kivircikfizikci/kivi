import type { RectangleEntity } from '../entities/RectangleEntity.ts'
import type { Point } from './Point.ts'

export function rectangleCorners(rectangle: Pick<RectangleEntity, 'origin' | 'width' | 'height'>): [Point, Point, Point, Point] {
  const { origin, width, height } = rectangle
  return [
    { x: origin.x, y: origin.y },
    { x: origin.x + width, y: origin.y },
    { x: origin.x + width, y: origin.y + height },
    { x: origin.x, y: origin.y + height },
  ]
}

export function rectangleEdges(rectangle: Pick<RectangleEntity, 'origin' | 'width' | 'height'>) {
  const corners = rectangleCorners(rectangle)
  return corners.map((start, index) => ({ start, end: corners[(index + 1) % corners.length]! }))
}
