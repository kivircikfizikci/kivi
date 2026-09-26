import type { Entity } from '../entities/Entity.ts'
import type { Point } from '../geometry/Point.ts'
import { arcSweep, pointOnCircle } from '../geometry/arc.ts'
import { buildDimensionGeometry, resolveDimensionSegment } from '../geometry/dimension.ts'
import { rectangleCorners, rectangleEdges } from '../geometry/rectangle.ts'

export interface SelectionBox {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

export function selectionBox(a: Point, b: Point): SelectionBox {
  return {
    minX: Math.min(a.x, b.x),
    minY: Math.min(a.y, b.y),
    maxX: Math.max(a.x, b.x),
    maxY: Math.max(a.y, b.y),
  }
}

export function entitiesInSelectionBox(box: SelectionBox, entities: readonly Entity[]) {
  return entities.filter((entity) => entityIntersectsBox(entity, box, entities))
}

function entityIntersectsBox(entity: Entity, box: SelectionBox, entities: readonly Entity[]) {
  if (entity.type === 'line') return segmentIntersectsBox(entity.start, entity.end, box)
  if (entity.type === 'rectangle') {
    return rectangleCorners(entity).some((point) => pointInBox(point, box)) ||
      rectangleEdges(entity).some((edge) => segmentIntersectsBox(edge.start, edge.end, box))
  }
  if (entity.type === 'circle') return circleIntersectsBox(entity.center, entity.radius, box)
  if (entity.type === 'arc') {
    const sweep = arcSweep(entity.startAngle, entity.endAngle, entity.direction)
    const steps = Math.max(4, Math.ceil(sweep / 12))
    let previous = pointOnCircle(entity.center, entity.radius, entity.startAngle)
    for (let index = 1; index <= steps; index += 1) {
      const sign = entity.direction === 'ccw' ? 1 : -1
      const current = pointOnCircle(entity.center, entity.radius, entity.startAngle + sign * sweep * index / steps)
      if (segmentIntersectsBox(previous, current, box)) return true
      previous = current
    }
    return false
  }

  const segment = resolveDimensionSegment(entity, entities)
  if (!segment) return false
  const geometry = buildDimensionGeometry(segment, entity)
  if (!geometry) return false
  return segmentIntersectsBox(segment.start, geometry.start, box) ||
    segmentIntersectsBox(segment.end, geometry.end, box) ||
    segmentIntersectsBox(geometry.start, geometry.end, box) ||
    pointInBox(geometry.text, box)
}

function pointInBox(point: Point, box: SelectionBox) {
  return point.x >= box.minX && point.x <= box.maxX && point.y >= box.minY && point.y <= box.maxY
}

function segmentIntersectsBox(start: Point, end: Point, box: SelectionBox) {
  if (pointInBox(start, box) || pointInBox(end, box)) return true
  const corners: [Point, Point, Point, Point] = [
    { x: box.minX, y: box.minY },
    { x: box.maxX, y: box.minY },
    { x: box.maxX, y: box.maxY },
    { x: box.minX, y: box.maxY },
  ]
  return corners.some((corner, index) => segmentsIntersect(start, end, corner, corners[(index + 1) % corners.length]!))
}

function segmentsIntersect(a: Point, b: Point, c: Point, d: Point) {
  const abC = cross(a, b, c)
  const abD = cross(a, b, d)
  const cdA = cross(c, d, a)
  const cdB = cross(c, d, b)
  return ((abC <= 0 && abD >= 0) || (abC >= 0 && abD <= 0)) &&
    ((cdA <= 0 && cdB >= 0) || (cdA >= 0 && cdB <= 0))
}

function cross(a: Point, b: Point, c: Point) {
  return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x)
}

function circleIntersectsBox(center: Point, radius: number, box: SelectionBox) {
  const nearestX = Math.max(box.minX, Math.min(center.x, box.maxX))
  const nearestY = Math.max(box.minY, Math.min(center.y, box.maxY))
  const nearestDistance = Math.hypot(nearestX - center.x, nearestY - center.y)
  const farthestDistance = Math.max(
    Math.hypot(box.minX - center.x, box.minY - center.y),
    Math.hypot(box.maxX - center.x, box.minY - center.y),
    Math.hypot(box.maxX - center.x, box.maxY - center.y),
    Math.hypot(box.minX - center.x, box.maxY - center.y),
  )
  return nearestDistance <= radius && farthestDistance >= radius
}
