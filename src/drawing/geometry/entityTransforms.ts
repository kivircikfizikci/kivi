import type { Entity } from '../entities/Entity.ts'
import type { Point } from './Point.ts'
import { normalizeDegrees } from './arc.ts'
import { rectangleCorners } from './rectangle.ts'
import { getPolygonVertices } from './polygon.ts'

export interface Delta { x: number; y: number }
export const MAX_REPEAT_COPIES = 500
export const REPEAT_PREVIEW_LIMIT = 100

export function translatePoint(point: Point, delta: Delta): Point {
  return { x: point.x + delta.x, y: point.y + delta.y }
}

export function translateEntity(entity: Entity, delta: Delta): Entity {
  switch (entity.type) {
    case 'line': return { ...entity, start: translatePoint(entity.start, delta), end: translatePoint(entity.end, delta), style: { ...entity.style } }
    case 'rectangle': return { ...entity, origin: translatePoint(entity.origin, delta), style: { ...entity.style } }
    case 'circle': return { ...entity, center: translatePoint(entity.center, delta), style: { ...entity.style } }
    case 'arc': return { ...entity, center: translatePoint(entity.center, delta), style: { ...entity.style } }
    case 'polygon': return { ...entity, center: translatePoint(entity.center, delta), style: { ...entity.style } }
    case 'dimension': return entity.source.type === 'points'
      ? { ...entity, source: { type: 'points', start: translatePoint(entity.source.start, delta), end: translatePoint(entity.source.end, delta) }, style: { ...entity.style } }
      : { ...entity, source: { ...entity.source }, style: { ...entity.style } }
  }
}

/** Positive angles rotate counter-clockwise in world space. */
export function rotatePoint(point: Point, pivot: Point, angle: number): Point {
  const radians = angle * Math.PI / 180
  const cosine = Math.cos(radians)
  const sine = Math.sin(radians)
  const x = point.x - pivot.x
  const y = point.y - pivot.y
  return { x: pivot.x + x * cosine - y * sine, y: pivot.y + x * sine + y * cosine }
}

export function rotateEntity(entity: Entity, pivot: Point, angle: number): Entity {
  switch (entity.type) {
    case 'line': return { ...entity, start: rotatePoint(entity.start, pivot, angle), end: rotatePoint(entity.end, pivot, angle), style: { ...entity.style } }
    case 'rectangle': return { ...entity, origin: rotatePoint(entity.origin, pivot, angle), rotation: normalizeDegrees((entity.rotation ?? 0) + angle), style: { ...entity.style } }
    case 'circle': return { ...entity, center: rotatePoint(entity.center, pivot, angle), style: { ...entity.style } }
    case 'arc': return { ...entity, center: rotatePoint(entity.center, pivot, angle), startAngle: normalizeDegrees(entity.startAngle + angle), endAngle: normalizeDegrees(entity.endAngle + angle), style: { ...entity.style } }
    case 'polygon': return { ...entity, center: rotatePoint(entity.center, pivot, angle), rotation: normalizeDegrees(entity.rotation + angle), style: { ...entity.style } }
    case 'dimension': return entity.source.type === 'points'
      ? { ...entity, source: { type: 'points', start: rotatePoint(entity.source.start, pivot, angle), end: rotatePoint(entity.source.end, pivot, angle) }, style: { ...entity.style } }
      : { ...entity, source: { ...entity.source }, style: { ...entity.style } }
  }
}

export function mirrorPointAcrossLine(point: Point, axisA: Point, axisB: Point): Point {
  const dx = axisB.x - axisA.x
  const dy = axisB.y - axisA.y
  const lengthSquared = dx * dx + dy * dy
  if (lengthSquared <= Number.EPSILON) return { ...point }
  const parameter = ((point.x - axisA.x) * dx + (point.y - axisA.y) * dy) / lengthSquared
  const projection = { x: axisA.x + parameter * dx, y: axisA.y + parameter * dy }
  return { x: projection.x * 2 - point.x, y: projection.y * 2 - point.y }
}

export function mirrorEntity(entity: Entity, axisA: Point, axisB: Point): Entity {
  switch (entity.type) {
    case 'line': return { ...entity, start: mirrorPointAcrossLine(entity.start, axisA, axisB), end: mirrorPointAcrossLine(entity.end, axisA, axisB), style: { ...entity.style } }
    case 'rectangle': {
      const corners = rectangleCorners(entity).map((point) => mirrorPointAcrossLine(point, axisA, axisB))
      const origin = corners[3]!
      const next = corners[2]!
      return { ...entity, origin, rotation: normalizeDegrees(Math.atan2(next.y - origin.y, next.x - origin.x) * 180 / Math.PI), style: { ...entity.style } }
    }
    case 'circle': return { ...entity, center: mirrorPointAcrossLine(entity.center, axisA, axisB), style: { ...entity.style } }
    case 'arc': {
      const start = mirrorPointAcrossLine(pointAtAngle(entity.center, entity.radius, entity.startAngle), axisA, axisB)
      const end = mirrorPointAcrossLine(pointAtAngle(entity.center, entity.radius, entity.endAngle), axisA, axisB)
      const center = mirrorPointAcrossLine(entity.center, axisA, axisB)
      return {
        ...entity,
        center,
        startAngle: normalizeDegrees(Math.atan2(start.y - center.y, start.x - center.x) * 180 / Math.PI),
        endAngle: normalizeDegrees(Math.atan2(end.y - center.y, end.x - center.x) * 180 / Math.PI),
        direction: entity.direction === 'ccw' ? 'cw' : 'ccw',
        style: { ...entity.style },
      }
    }
    case 'polygon': {
      const center = mirrorPointAcrossLine(entity.center, axisA, axisB)
      const firstVertex = mirrorPointAcrossLine(getPolygonVertices(entity)[0]!, axisA, axisB)
      return { ...entity, center, rotation: normalizeDegrees(Math.atan2(firstVertex.y - center.y, firstVertex.x - center.x) * 180 / Math.PI), style: { ...entity.style } }
    }
    case 'dimension': return entity.source.type === 'points'
      ? { ...entity, source: { type: 'points', start: mirrorPointAcrossLine(entity.source.start, axisA, axisB), end: mirrorPointAcrossLine(entity.source.end, axisA, axisB) }, side: entity.side === 1 ? -1 : 1, style: { ...entity.style } }
      : { ...entity, source: { ...entity.source }, side: entity.side === 1 ? -1 : 1, style: { ...entity.style } }
  }
}

export function cloneEntitiesWithNewIds(entities: readonly Entity[], delta: Delta, createId: () => string = () => globalThis.crypto.randomUUID()): Entity[] {
  return cloneTransformedEntitiesWithNewIds(entities, (entity) => translateEntity(entity, delta), createId)
}

export function cloneTransformedEntitiesWithNewIds(entities: readonly Entity[], transform: (entity: Entity) => Entity, createId: () => string = () => globalThis.crypto.randomUUID()): Entity[] {
  const selectedIds = new Set(entities.map((entity) => entity.id))
  const eligible = entities.filter((entity) => entity.type !== 'dimension' || entity.source.type !== 'entity' || selectedIds.has(entity.source.targetEntityId))
  const idMap = new Map(eligible.map((entity) => [entity.id, createId()]))
  return eligible.map((entity) => {
    const transformed = transform(entity)
    if (transformed.type === 'dimension' && transformed.source.type === 'entity') {
      return { ...transformed, id: idMap.get(entity.id)!, source: { type: 'entity', targetEntityId: idMap.get(transformed.source.targetEntityId)! } }
    }
    return { ...transformed, id: idMap.get(entity.id)! }
  })
}

export function repeatEntities(entities: readonly Entity[], direction: Delta, spacing: number, copies: number, createId: () => string = () => globalThis.crypto.randomUUID()): Entity[] {
  if (!validRepeatCount(copies) || !Number.isFinite(spacing) || spacing <= 0) return []
  const result: Entity[] = []
  for (let index = 1; index <= copies; index += 1) {
    result.push(...cloneEntitiesWithNewIds(entities, { x: direction.x * spacing * index, y: direction.y * spacing * index }, createId))
  }
  return result
}

export function validRepeatCount(value: number) {
  return Number.isInteger(value) && value >= 1 && value <= MAX_REPEAT_COPIES
}

export function selectionAnchor(entities: readonly Entity[]): Point | null {
  const points = entities.flatMap(entityReferencePoints)
  if (!points.length) return null
  return { x: points.reduce((sum, point) => sum + point.x, 0) / points.length, y: points.reduce((sum, point) => sum + point.y, 0) / points.length }
}

function entityReferencePoints(entity: Entity): Point[] {
  switch (entity.type) {
    case 'line': return [entity.start, entity.end]
    case 'rectangle': return rectangleCorners(entity)
    case 'circle':
    case 'arc':
    case 'polygon': return [entity.center]
    case 'dimension': return entity.source.type === 'points' ? [entity.source.start, entity.source.end] : []
  }
}

function pointAtAngle(center: Point, radius: number, angle: number): Point {
  const radians = angle * Math.PI / 180
  return { x: center.x + Math.cos(radians) * radius, y: center.y + Math.sin(radians) * radius }
}
