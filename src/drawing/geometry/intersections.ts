import type { ArcEntity } from '../entities/ArcEntity.ts'
import type { CircleEntity } from '../entities/CircleEntity.ts'
import type { Point } from './Point.ts'
import { angleFromCenter, angleIsOnArc, arcSweep, normalizeDegrees, pointOnCircle } from './arc.ts'

export const GEOMETRY_EPSILON = 1e-7

export interface LineSegment { start: Point; end: Point }
export interface GeometryIntersection {
  point: Point
  parameterA: number
  parameterB: number
}

export function lineLineIntersections(a: LineSegment, b: LineSegment): GeometryIntersection[] {
  const r = subtract(a.end, a.start)
  const s = subtract(b.end, b.start)
  const denominator = cross(r, s)
  if (Math.abs(denominator) <= GEOMETRY_EPSILON) return []
  const delta = subtract(b.start, a.start)
  const parameterA = cross(delta, s) / denominator
  const parameterB = cross(delta, r) / denominator
  if (!withinSegment(parameterA) || !withinSegment(parameterB)) return []
  const t = clampUnit(parameterA)
  return [{ point: addScaled(a.start, r, t), parameterA: t, parameterB: clampUnit(parameterB) }]
}

export function lineCircleIntersections(line: LineSegment, circle: Pick<CircleEntity, 'center' | 'radius'>): GeometryIntersection[] {
  const direction = subtract(line.end, line.start)
  const fromCenter = subtract(line.start, circle.center)
  const a = dot(direction, direction)
  if (a <= GEOMETRY_EPSILON) return []
  const b = 2 * dot(fromCenter, direction)
  const c = dot(fromCenter, fromCenter) - circle.radius * circle.radius
  const discriminant = b * b - 4 * a * c
  if (discriminant < -GEOMETRY_EPSILON) return []
  const root = Math.sqrt(Math.max(0, discriminant))
  const parameters = root <= GEOMETRY_EPSILON
    ? [-b / (2 * a)]
    : [(-b - root) / (2 * a), (-b + root) / (2 * a)]
  return dedupeIntersections(parameters
    .filter(withinSegment)
    .map((parameterA) => {
      const t = clampUnit(parameterA)
      const point = addScaled(line.start, direction, t)
      return { point, parameterA: t, parameterB: normalizeDegrees(angleFromCenter(circle.center, point)) / 360 }
    }))
}

export function lineArcIntersections(line: LineSegment, arc: Pick<ArcEntity, 'center' | 'radius' | 'startAngle' | 'endAngle' | 'direction'>): GeometryIntersection[] {
  return lineCircleIntersections(line, arc).flatMap((intersection) => {
    const parameterB = arcParameterAtPoint(arc, intersection.point)
    return parameterB === null ? [] : [{ ...intersection, parameterB }]
  })
}

export function arcLineIntersections(arc: Pick<ArcEntity, 'center' | 'radius' | 'startAngle' | 'endAngle' | 'direction'>, line: LineSegment): GeometryIntersection[] {
  return lineArcIntersections(line, arc).map((intersection) => ({
    point: intersection.point,
    parameterA: intersection.parameterB,
    parameterB: intersection.parameterA,
  }))
}

export function circleCircleIntersections(
  a: Pick<CircleEntity, 'center' | 'radius'>,
  b: Pick<CircleEntity, 'center' | 'radius'>,
): GeometryIntersection[] {
  const delta = subtract(b.center, a.center)
  const centerDistance = Math.hypot(delta.x, delta.y)
  if (centerDistance <= GEOMETRY_EPSILON || centerDistance > a.radius + b.radius + GEOMETRY_EPSILON || centerDistance < Math.abs(a.radius - b.radius) - GEOMETRY_EPSILON) return []
  const along = (a.radius * a.radius - b.radius * b.radius + centerDistance * centerDistance) / (2 * centerDistance)
  const heightSquared = a.radius * a.radius - along * along
  if (heightSquared < -GEOMETRY_EPSILON) return []
  const base = { x: a.center.x + delta.x * along / centerDistance, y: a.center.y + delta.y * along / centerDistance }
  const height = Math.sqrt(Math.max(0, heightSquared))
  const normal = { x: -delta.y / centerDistance, y: delta.x / centerDistance }
  const points = height <= GEOMETRY_EPSILON
    ? [base]
    : [addScaled(base, normal, height), addScaled(base, normal, -height)]
  return points.map((point) => ({
    point,
    parameterA: normalizeDegrees(angleFromCenter(a.center, point)) / 360,
    parameterB: normalizeDegrees(angleFromCenter(b.center, point)) / 360,
  }))
}

export function arcCircleIntersections(
  arc: Pick<ArcEntity, 'center' | 'radius' | 'startAngle' | 'endAngle' | 'direction'>,
  circle: Pick<CircleEntity, 'center' | 'radius'>,
): GeometryIntersection[] {
  return circleCircleIntersections(arc, circle).flatMap((intersection) => {
    const parameterA = arcParameterAtPoint(arc, intersection.point)
    return parameterA === null ? [] : [{ ...intersection, parameterA }]
  })
}

export function arcArcIntersections(
  a: Pick<ArcEntity, 'center' | 'radius' | 'startAngle' | 'endAngle' | 'direction'>,
  b: Pick<ArcEntity, 'center' | 'radius' | 'startAngle' | 'endAngle' | 'direction'>,
): GeometryIntersection[] {
  return circleCircleIntersections(a, b).flatMap((intersection) => {
    const parameterA = arcParameterAtPoint(a, intersection.point)
    const parameterB = arcParameterAtPoint(b, intersection.point)
    return parameterA === null || parameterB === null ? [] : [{ ...intersection, parameterA, parameterB }]
  })
}

export function arcParameterAtPoint(arc: Pick<ArcEntity, 'center' | 'startAngle' | 'endAngle' | 'direction'>, point: Point) {
  const angle = angleFromCenter(arc.center, point)
  if (!angleIsOnArc(angle, arc, GEOMETRY_EPSILON * 180 / Math.PI)) return null
  const sweep = arcSweep(arc.startAngle, arc.endAngle, arc.direction)
  if (sweep <= GEOMETRY_EPSILON) return null
  const travelled = arc.direction === 'ccw'
    ? normalizeDegrees(angle - arc.startAngle)
    : normalizeDegrees(arc.startAngle - angle)
  if (travelled > sweep + GEOMETRY_EPSILON) return null
  return clampUnit(travelled / sweep)
}

export function pointAtArcParameter(arc: Pick<ArcEntity, 'center' | 'radius' | 'startAngle' | 'endAngle' | 'direction'>, parameter: number) {
  const sign = arc.direction === 'ccw' ? 1 : -1
  return pointOnCircle(arc.center, arc.radius, arc.startAngle + sign * arcSweep(arc.startAngle, arc.endAngle, arc.direction) * parameter)
}

export function dedupeIntersections(intersections: readonly GeometryIntersection[]) {
  const unique: GeometryIntersection[] = []
  for (const intersection of intersections) {
    if (!unique.some((existing) => Math.hypot(existing.point.x - intersection.point.x, existing.point.y - intersection.point.y) <= GEOMETRY_EPSILON)) unique.push(intersection)
  }
  return unique
}

function subtract(a: Point, b: Point): Point { return { x: a.x - b.x, y: a.y - b.y } }
function addScaled(point: Point, vector: Point, scale: number): Point { return { x: point.x + vector.x * scale, y: point.y + vector.y * scale } }
function dot(a: Point, b: Point) { return a.x * b.x + a.y * b.y }
function cross(a: Point, b: Point) { return a.x * b.y - a.y * b.x }
function withinSegment(value: number) { return value >= -GEOMETRY_EPSILON && value <= 1 + GEOMETRY_EPSILON }
function clampUnit(value: number) { return Math.max(0, Math.min(1, value)) }
