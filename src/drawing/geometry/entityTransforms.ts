import type { Entity } from '../entities/Entity.ts'
import type { Point } from './Point.ts'

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
    case 'dimension': return entity.source.type === 'points'
      ? { ...entity, source: { type: 'points', start: translatePoint(entity.source.start, delta), end: translatePoint(entity.source.end, delta) }, style: { ...entity.style } }
      : { ...entity, source: { ...entity.source }, style: { ...entity.style } }
  }
}

export function cloneEntitiesWithNewIds(entities: readonly Entity[], delta: Delta, createId: () => string = () => globalThis.crypto.randomUUID()): Entity[] {
  const selectedIds = new Set(entities.map((entity) => entity.id))
  const eligible = entities.filter((entity) => entity.type !== 'dimension' || entity.source.type !== 'entity' || selectedIds.has(entity.source.targetEntityId))
  const idMap = new Map(eligible.map((entity) => [entity.id, createId()]))
  return eligible.map((entity) => {
    const translated = translateEntity(entity, delta)
    if (translated.type === 'dimension' && translated.source.type === 'entity') {
      return { ...translated, id: idMap.get(entity.id)!, source: { type: 'entity', targetEntityId: idMap.get(translated.source.targetEntityId)! } }
    }
    return { ...translated, id: idMap.get(entity.id)! }
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
    case 'rectangle': return [entity.origin, { x: entity.origin.x + entity.width, y: entity.origin.y + entity.height }]
    case 'circle':
    case 'arc': return [entity.center]
    case 'dimension': return entity.source.type === 'points' ? [entity.source.start, entity.source.end] : []
  }
}
