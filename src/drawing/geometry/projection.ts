import type { Point } from './Point.ts'
import { squaredDistance } from './distance.ts'

export interface SegmentProjection {
  point: Point
  parameter: number
  distanceSquared: number
}

export function projectPointToSegment(point: Point, start: Point, end: Point): SegmentProjection {
  const segmentX = end.x - start.x
  const segmentY = end.y - start.y
  const lengthSquared = segmentX * segmentX + segmentY * segmentY

  if (lengthSquared <= Number.EPSILON) {
    return { point: start, parameter: 0, distanceSquared: squaredDistance(point, start) }
  }

  const rawParameter = ((point.x - start.x) * segmentX + (point.y - start.y) * segmentY) / lengthSquared
  const parameter = Math.max(0, Math.min(1, rawParameter))
  const projected = { x: start.x + segmentX * parameter, y: start.y + segmentY * parameter }
  return { point: projected, parameter, distanceSquared: squaredDistance(point, projected) }
}
