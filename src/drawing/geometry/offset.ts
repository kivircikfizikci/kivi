import type { ArcEntity } from '../entities/ArcEntity.ts'
import type { CircleEntity } from '../entities/CircleEntity.ts'
import type { Entity } from '../entities/Entity.ts'
import type { LineEntity } from '../entities/LineEntity.ts'
import type { RectangleEntity } from '../entities/RectangleEntity.ts'
import type { Point } from './Point.ts'

export type OffsettableEntity = LineEntity | RectangleEntity | CircleEntity | ArcEntity

export function isOffsettable(entity: Entity): entity is OffsettableEntity {
  return entity.type === 'line' || entity.type === 'rectangle' || entity.type === 'circle' || entity.type === 'arc'
}

export function offsetDistanceFromPointer(entity: OffsettableEntity, pointer: Point) {
  if (entity.type === 'line') {
    const dx = entity.end.x - entity.start.x
    const dy = entity.end.y - entity.start.y
    const length = Math.hypot(dx, dy)
    return length <= Number.EPSILON ? 0 : Math.abs(dx * (pointer.y - entity.start.y) - dy * (pointer.x - entity.start.x)) / length
  }
  if (entity.type === 'circle' || entity.type === 'arc') return Math.abs(Math.hypot(pointer.x - entity.center.x, pointer.y - entity.center.y) - entity.radius)
  const minX = entity.origin.x
  const minY = entity.origin.y
  const maxX = entity.origin.x + entity.width
  const maxY = entity.origin.y + entity.height
  if (pointer.x >= minX && pointer.x <= maxX && pointer.y >= minY && pointer.y <= maxY) {
    return Math.min(pointer.x - minX, maxX - pointer.x, pointer.y - minY, maxY - pointer.y)
  }
  const dx = Math.max(minX - pointer.x, 0, pointer.x - maxX)
  const dy = Math.max(minY - pointer.y, 0, pointer.y - maxY)
  return Math.hypot(dx, dy)
}

export function offsetEntity(entity: OffsettableEntity, pointer: Point, distance: number, createId: () => string = () => globalThis.crypto.randomUUID()): OffsettableEntity | null {
  if (!Number.isFinite(distance) || distance <= 0) return null
  if (entity.type === 'line') {
    const dx = entity.end.x - entity.start.x
    const dy = entity.end.y - entity.start.y
    const length = Math.hypot(dx, dy)
    if (length <= Number.EPSILON) return null
    const normal = { x: -dy / length, y: dx / length }
    const side = (pointer.x - entity.start.x) * normal.x + (pointer.y - entity.start.y) * normal.y < 0 ? -1 : 1
    const delta = { x: normal.x * distance * side, y: normal.y * distance * side }
    return { ...entity, id: createId(), start: { x: entity.start.x + delta.x, y: entity.start.y + delta.y }, end: { x: entity.end.x + delta.x, y: entity.end.y + delta.y }, style: { ...entity.style } }
  }
  if (entity.type === 'rectangle') {
    const inside = pointInsideRectangle(pointer, entity)
    const origin = inside
      ? { x: entity.origin.x + distance, y: entity.origin.y + distance }
      : { x: entity.origin.x - distance, y: entity.origin.y - distance }
    const width = entity.width + (inside ? -2 : 2) * distance
    const height = entity.height + (inside ? -2 : 2) * distance
    if (width <= 0 || height <= 0) return null
    return { ...entity, id: createId(), origin, width, height, style: { ...entity.style } }
  }
  const outward = Math.hypot(pointer.x - entity.center.x, pointer.y - entity.center.y) >= entity.radius
  const radius = entity.radius + (outward ? distance : -distance)
  if (radius <= 0) return null
  return { ...entity, id: createId(), radius, center: { ...entity.center }, style: { ...entity.style } }
}

function pointInsideRectangle(point: Point, rectangle: RectangleEntity) {
  return point.x > rectangle.origin.x && point.x < rectangle.origin.x + rectangle.width &&
    point.y > rectangle.origin.y && point.y < rectangle.origin.y + rectangle.height
}
