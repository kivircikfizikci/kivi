import type { RectangleEntity } from '../entities/RectangleEntity.ts'
import type { Point } from './Point.ts'

export function rectangleCorners(rectangle: Pick<RectangleEntity, 'origin' | 'width' | 'height'> & Partial<Pick<RectangleEntity, 'rotation'>>): [Point, Point, Point, Point] {
  const { origin, width, height } = rectangle
  const corners: [Point, Point, Point, Point] = [
    { x: origin.x, y: origin.y },
    { x: origin.x + width, y: origin.y },
    { x: origin.x + width, y: origin.y + height },
    { x: origin.x, y: origin.y + height },
  ]
  const rotation = rectangle.rotation ?? 0
  return rotation ? corners.map((point) => rotateAroundOrigin(point, origin, rotation)) as [Point, Point, Point, Point] : corners
}

function rotateAroundOrigin(point: Point, origin: Point, angle: number): Point {
  const radians = angle * Math.PI / 180
  const cosine = Math.cos(radians)
  const sine = Math.sin(radians)
  const x = point.x - origin.x
  const y = point.y - origin.y
  return { x: origin.x + x * cosine - y * sine, y: origin.y + x * sine + y * cosine }
}

export function rectangleEdges(rectangle: Pick<RectangleEntity, 'origin' | 'width' | 'height'> & Partial<Pick<RectangleEntity, 'rotation'>>) {
  const corners = rectangleCorners(rectangle)
  return corners.map((start, index) => ({ start, end: corners[(index + 1) % corners.length]! }))
}
