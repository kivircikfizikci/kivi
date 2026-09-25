import type { Point } from './Point.ts'
import type { LineEntity } from '../entities/LineEntity.ts'
import type { DimensionEntity } from '../entities/DimensionEntity.ts'
import { distance } from './distance.ts'
import type { Entity } from '../entities/Entity.ts'

export interface MeasuredSegment { start: Point; end: Point }

export interface DimensionGeometry {
  start: Point
  end: Point
  text: Point
  normal: Point
  length: number
  rotation: number
}

export function resolveDimensionSegment(dimension: Pick<DimensionEntity, 'source'>, entities: readonly Entity[]): MeasuredSegment | null {
  if (dimension.source.type === 'points') return { start: dimension.source.start, end: dimension.source.end }
  const targetEntityId = dimension.source.targetEntityId
  const target = entities.find((entity): entity is LineEntity => entity.type === 'line' && entity.id === targetEntityId)
  return target ? { start: target.start, end: target.end } : null
}

export function dimensionPlacement(segment: MeasuredSegment, pointer: Point, minimumOffset = 0) {
  const length = distance(segment.start, segment.end)
  if (length <= Number.EPSILON) return null
  const normal = { x: -(segment.end.y - segment.start.y) / length, y: (segment.end.x - segment.start.x) / length }
  const signedOffset = (pointer.x - segment.start.x) * normal.x + (pointer.y - segment.start.y) * normal.y
  return { side: signedOffset < 0 ? -1 as const : 1 as const, offset: Math.max(Math.abs(signedOffset), minimumOffset) }
}

export function dimensionGeometry(line: LineEntity, dimension: Pick<DimensionEntity, 'offset' | 'side'>): DimensionGeometry | null {
  return buildDimensionGeometry({ start: line.start, end: line.end }, dimension)
}

export function buildDimensionGeometry(segment: MeasuredSegment, dimension: Pick<DimensionEntity, 'offset' | 'side'>): DimensionGeometry | null {
  const length = distance(segment.start, segment.end)
  if (length <= Number.EPSILON) return null
  const normal = { x: -(segment.end.y - segment.start.y) / length, y: (segment.end.x - segment.start.x) / length }
  const displacement = { x: normal.x * dimension.offset * dimension.side, y: normal.y * dimension.offset * dimension.side }
  const start = { x: segment.start.x + displacement.x, y: segment.start.y + displacement.y }
  const end = { x: segment.end.x + displacement.x, y: segment.end.y + displacement.y }
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
