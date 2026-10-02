import type { Entity } from '../entities/Entity.ts'
import type { Point } from './Point.ts'
import { arcSweep } from './arc.ts'
import { distance } from './distance.ts'
import type { LineSegment } from './intersections.ts'
import { polygonEdges, polygonInteriorAngle, polygonSideLength } from './polygon.ts'
import { projectPointToSegment } from './projection.ts'
import { rectangleEdges } from './rectangle.ts'

export interface PointMeasurement { distance: number; deltaX: number; deltaY: number; angle: number }
export interface AngleMeasurement { angle: number; supplementary: number; intersection: Point | null; parallel: boolean }
export interface MeasureValue { label: 'length' | 'angle' | 'width' | 'height' | 'radius' | 'diameter' | 'sides' | 'sideLength' | 'sweepAngle' | 'arcLength' | 'interiorAngle'; value: number; kind: 'length' | 'angle' | 'count' }

export function normalizeAngle(value: number) { return ((value % 360) + 360) % 360 }
export function supplementaryAngle(value: number) { return 180 - value }

export function angleBetweenVectors(a: Point, b: Point) {
  const lengthA = Math.hypot(a.x, a.y)
  const lengthB = Math.hypot(b.x, b.y)
  if (lengthA <= Number.EPSILON || lengthB <= Number.EPSILON) return 0
  const cosine = Math.max(-1, Math.min(1, (a.x * b.x + a.y * b.y) / (lengthA * lengthB)))
  return Math.acos(Math.abs(cosine)) * 180 / Math.PI
}

export function pointMeasurement(a: Point, b: Point): PointMeasurement {
  const deltaX = b.x - a.x
  const deltaY = b.y - a.y
  return { distance: distance(a, b), deltaX, deltaY, angle: normalizeAngle(Math.atan2(deltaY, deltaX) * 180 / Math.PI) }
}

export function intersectionAngleGeometry(a: LineSegment, b: LineSegment): AngleMeasurement {
  const vectorA = { x: a.end.x - a.start.x, y: a.end.y - a.start.y }
  const vectorB = { x: b.end.x - b.start.x, y: b.end.y - b.start.y }
  const determinant = vectorA.x * vectorB.y - vectorA.y * vectorB.x
  const angle = angleBetweenVectors(vectorA, vectorB)
  if (Math.abs(determinant) <= 1e-8) return { angle: 0, supplementary: 180, intersection: null, parallel: true }
  const delta = { x: b.start.x - a.start.x, y: b.start.y - a.start.y }
  const parameter = (delta.x * vectorB.y - delta.y * vectorB.x) / determinant
  return {
    angle,
    supplementary: supplementaryAngle(angle),
    intersection: { x: a.start.x + vectorA.x * parameter, y: a.start.y + vectorA.y * parameter },
    parallel: false,
  }
}

export function getEntityMeasureSegments(entity: Entity): LineSegment[] {
  if (entity.type === 'line') return [{ start: entity.start, end: entity.end }]
  if (entity.type === 'rectangle') return rectangleEdges(entity)
  if (entity.type === 'polygon') return polygonEdges(entity)
  return []
}

export function nearestEntityMeasureSegment(entity: Entity, pointer: Point): LineSegment | null {
  const segments = getEntityMeasureSegments(entity)
  if (!segments.length) return null
  return segments.reduce((best, segment) => projectPointToSegment(pointer, segment.start, segment.end).distanceSquared < projectPointToSegment(pointer, best.start, best.end).distanceSquared ? segment : best)
}

export function entityMeasureValues(entity: Entity): MeasureValue[] {
  if (entity.type === 'line') {
    const measurement = pointMeasurement(entity.start, entity.end)
    return [{ label: 'length', value: measurement.distance, kind: 'length' }, { label: 'angle', value: measurement.angle, kind: 'angle' }]
  }
  if (entity.type === 'rectangle') return [
    { label: 'width', value: entity.width, kind: 'length' },
    { label: 'height', value: entity.height, kind: 'length' },
    { label: 'angle', value: normalizeAngle(entity.rotation ?? 0), kind: 'angle' },
  ]
  if (entity.type === 'circle') return [
    { label: 'radius', value: entity.radius, kind: 'length' },
    { label: 'diameter', value: entity.radius * 2, kind: 'length' },
  ]
  if (entity.type === 'arc') {
    const sweep = arcSweep(entity.startAngle, entity.endAngle, entity.direction)
    return [
      { label: 'radius', value: entity.radius, kind: 'length' },
      { label: 'sweepAngle', value: sweep, kind: 'angle' },
      { label: 'arcLength', value: entity.radius * sweep * Math.PI / 180, kind: 'length' },
    ]
  }
  if (entity.type === 'polygon') return [
    { label: 'sides', value: entity.sides, kind: 'count' },
    { label: 'sideLength', value: polygonSideLength(entity.radius, entity.sides), kind: 'length' },
    { label: 'radius', value: entity.radius, kind: 'length' },
    { label: 'interiorAngle', value: polygonInteriorAngle(entity.sides), kind: 'angle' },
  ]
  if (entity.type === 'text') return []
  return []
}

export function formatMeasureAngle(value: number) {
  const rounded = Math.abs(value - Math.round(value)) < 1e-8 ? Math.round(value) : Number(value.toFixed(2))
  return `${rounded}°`
}
