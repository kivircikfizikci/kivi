import type { Point } from './Point.ts'
import type { LineEntity } from '../entities/LineEntity.ts'
import type { DimensionEntity } from '../entities/DimensionEntity.ts'
import { distance } from './distance.ts'

export interface DimensionGeometry {
  start: Point
  end: Point
  text: Point
  normal: Point
  length: number
  rotation: number
}

export function dimensionPlacement(line: LineEntity, pointer: Point, minimumOffset = 0) {
  const length = distance(line.start, line.end)
  if (length <= Number.EPSILON) return null
  const normal = { x: -(line.end.y - line.start.y) / length, y: (line.end.x - line.start.x) / length }
  const signedOffset = (pointer.x - line.start.x) * normal.x + (pointer.y - line.start.y) * normal.y
  return { side: signedOffset < 0 ? -1 as const : 1 as const, offset: Math.max(Math.abs(signedOffset), minimumOffset) }
}

export function dimensionGeometry(line: LineEntity, dimension: Pick<DimensionEntity, 'offset' | 'side'>): DimensionGeometry | null {
  const length = distance(line.start, line.end)
  if (length <= Number.EPSILON) return null
  const normal = { x: -(line.end.y - line.start.y) / length, y: (line.end.x - line.start.x) / length }
  const displacement = { x: normal.x * dimension.offset * dimension.side, y: normal.y * dimension.offset * dimension.side }
  const start = { x: line.start.x + displacement.x, y: line.start.y + displacement.y }
  const end = { x: line.end.x + displacement.x, y: line.end.y + displacement.y }
  let rotation = Math.atan2(-(end.y - start.y), end.x - start.x) * 180 / Math.PI
  if (rotation > 90) rotation -= 180
  if (rotation <= -90) rotation += 180
  if (Object.is(rotation, -0)) rotation = 0
  return {
    start,
    end,
    text: { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 },
    normal,
    length,
    rotation,
  }
}
