import type { Entity } from '../entities/Entity.ts'
import type { LineEntity } from '../entities/LineEntity.ts'
import type { Point } from './Point.ts'
import {
  GEOMETRY_EPSILON,
  infiniteLineArcIntersections,
  infiniteLineCircleIntersections,
  infiniteLineSegmentIntersections,
} from './intersections.ts'
import { rectangleEdges } from './rectangle.ts'
import { polygonEdges } from './polygon.ts'

export interface LineExtendPlan {
  targetId: string
  replacement: LineEntity
  extension: LineEntity
  endpoint: 'start' | 'end'
}

export function createLineExtendPlan(target: LineEntity, boundaries: readonly Entity[], click: Point): LineExtendPlan | null {
  const startDistance = Math.hypot(click.x - target.start.x, click.y - target.start.y)
  const endDistance = Math.hypot(click.x - target.end.x, click.y - target.end.y)
  const endpoint = startDistance <= endDistance ? 'start' : 'end'
  const origin = endpoint === 'start' ? target.start : target.end
  const opposite = endpoint === 'start' ? target.end : target.start
  const length = Math.hypot(origin.x - opposite.x, origin.y - opposite.y)
  if (length <= GEOMETRY_EPSILON) return null
  const direction = { x: (origin.x - opposite.x) / length, y: (origin.y - opposite.y) / length }
  const ray = { start: origin, end: { x: origin.x + direction.x, y: origin.y + direction.y } }
  const candidates: Array<{ point: Point; distance: number }> = []

  for (const boundary of boundaries) {
    if (boundary.id === target.id || boundary.type === 'dimension') continue
    const intersections = boundary.type === 'line'
      ? infiniteLineSegmentIntersections(ray, boundary)
      : boundary.type === 'rectangle'
        ? rectangleEdges(boundary).flatMap((edge) => infiniteLineSegmentIntersections(ray, edge))
        : boundary.type === 'circle'
          ? infiniteLineCircleIntersections(ray, boundary)
          : boundary.type === 'arc'
            ? infiniteLineArcIntersections(ray, boundary)
            : polygonEdges(boundary).flatMap((edge) => infiniteLineSegmentIntersections(ray, edge))
    for (const intersection of intersections) {
      if (intersection.parameterA > GEOMETRY_EPSILON) candidates.push({ point: intersection.point, distance: intersection.parameterA })
    }
  }

  candidates.sort((a, b) => a.distance - b.distance)
  const nearest = candidates[0]
  if (!nearest) return null
  const replacement: LineEntity = endpoint === 'start'
    ? { ...target, start: nearest.point, end: { ...target.end }, style: { ...target.style } }
    : { ...target, start: { ...target.start }, end: nearest.point, style: { ...target.style } }
  return {
    targetId: target.id,
    replacement,
    endpoint,
    extension: { ...target, id: `extend-preview-${target.id}`, start: { ...origin }, end: nearest.point, style: { ...target.style } },
  }
}
