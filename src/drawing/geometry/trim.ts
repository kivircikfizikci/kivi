import type { ArcEntity } from '../entities/ArcEntity.ts'
import type { Entity } from '../entities/Entity.ts'
import type { LineEntity } from '../entities/LineEntity.ts'
import type { Point } from './Point.ts'
import { normalizeDegrees } from './arc.ts'
import {
  GEOMETRY_EPSILON,
  arcArcIntersections,
  arcCircleIntersections,
  arcLineIntersections,
  arcParameterAtPoint,
  lineArcIntersections,
  lineCircleIntersections,
  lineLineIntersections,
} from './intersections.ts'
import { projectPointToSegment } from './projection.ts'
import { rectangleEdges } from './rectangle.ts'

export type TrimmableEntity = LineEntity | ArcEntity

export interface TrimPlan {
  targetId: string
  replacements: TrimmableEntity[]
  removedPortion: TrimmableEntity
}

export function isTrimmable(entity: Entity): entity is TrimmableEntity {
  return entity.type === 'line' || entity.type === 'arc'
}

export function createTrimPlan(
  target: TrimmableEntity,
  boundaries: readonly Entity[],
  click: Point,
  createId: () => string = () => globalThis.crypto.randomUUID(),
): TrimPlan | null {
  const allIntersections = dedupeParameters(collectParameters(target, boundaries).sort((a, b) => a - b))
  const cuts = allIntersections.filter((parameter) => parameter > GEOMETRY_EPSILON && parameter < 1 - GEOMETRY_EPSILON)
  const boundedAtBothEnds = allIntersections.some((parameter) => parameter <= GEOMETRY_EPSILON) &&
    allIntersections.some((parameter) => parameter >= 1 - GEOMETRY_EPSILON)
  if (cuts.length === 0 && !boundedAtBothEnds) return null
  const clickParameter = target.type === 'line'
    ? projectPointToSegment(click, target.start, target.end).parameter
    : arcParameterAtPoint(target, click)
  if (clickParameter === null) return null
  const stops = [0, ...cuts, 1]
  let removedIndex = stops.length - 2
  for (let index = 0; index < stops.length - 1; index += 1) {
    if (clickParameter <= stops[index + 1]! + GEOMETRY_EPSILON) { removedIndex = index; break }
  }
  const removedStart = stops[removedIndex]!
  const removedEnd = stops[removedIndex + 1]!
  if (removedEnd - removedStart <= GEOMETRY_EPSILON) return null
  const remaining = [
    { start: 0, end: removedStart },
    { start: removedEnd, end: 1 },
  ]
  const replacements = remaining
    .filter((interval) => intervalHasLength(target, interval.start, interval.end))
    .map((interval, index) => sliceEntity(target, interval.start, interval.end, index === 0 ? target.id : createId()))
  return {
    targetId: target.id,
    replacements,
    removedPortion: sliceEntity(target, removedStart, removedEnd, `trim-preview-${target.id}`),
  }
}

function collectParameters(target: TrimmableEntity, boundaries: readonly Entity[]) {
  const parameters: number[] = []
  for (const boundary of boundaries) {
    if (boundary.id === target.id || boundary.type === 'dimension') continue
    if (target.type === 'line') {
      if (boundary.type === 'line') parameters.push(...lineLineIntersections(target, boundary).map((item) => item.parameterA))
      else if (boundary.type === 'rectangle') {
        for (const edge of rectangleEdges(boundary)) parameters.push(...lineLineIntersections(target, edge).map((item) => item.parameterA))
      } else if (boundary.type === 'circle') parameters.push(...lineCircleIntersections(target, boundary).map((item) => item.parameterA))
      else parameters.push(...lineArcIntersections(target, boundary).map((item) => item.parameterA))
    } else {
      if (boundary.type === 'line') parameters.push(...arcLineIntersections(target, boundary).map((item) => item.parameterA))
      else if (boundary.type === 'rectangle') {
        for (const edge of rectangleEdges(boundary)) parameters.push(...arcLineIntersections(target, edge).map((item) => item.parameterA))
      } else if (boundary.type === 'circle') parameters.push(...arcCircleIntersections(target, boundary).map((item) => item.parameterA))
      else parameters.push(...arcArcIntersections(target, boundary).map((item) => item.parameterA))
    }
  }
  return parameters
}

function sliceEntity<T extends TrimmableEntity>(entity: T, start: number, end: number, id: string): T {
  if (entity.type === 'line') {
    const point = (parameter: number) => ({
      x: entity.start.x + (entity.end.x - entity.start.x) * parameter,
      y: entity.start.y + (entity.end.y - entity.start.y) * parameter,
    })
    return { ...entity, id, start: point(start), end: point(end), style: { ...entity.style } } as T
  }
  const sweep = directedSweep(entity)
  const sign = entity.direction === 'ccw' ? 1 : -1
  return {
    ...entity,
    id,
    startAngle: normalizeDegrees(entity.startAngle + sign * sweep * start),
    endAngle: normalizeDegrees(entity.startAngle + sign * sweep * end),
    center: { ...entity.center },
    style: { ...entity.style },
  } as T
}

function directedSweep(arc: ArcEntity) {
  return arc.direction === 'ccw'
    ? normalizeDegrees(arc.endAngle - arc.startAngle)
    : normalizeDegrees(arc.startAngle - arc.endAngle)
}

function dedupeParameters(parameters: readonly number[]) {
  const unique: number[] = []
  for (const parameter of parameters) {
    if (!unique.some((existing) => Math.abs(existing - parameter) <= GEOMETRY_EPSILON)) unique.push(parameter)
  }
  return unique
}

function intervalHasLength(entity: TrimmableEntity, start: number, end: number) {
  const fraction = end - start
  if (fraction <= GEOMETRY_EPSILON) return false
  if (entity.type === 'line') return Math.hypot(entity.end.x - entity.start.x, entity.end.y - entity.start.y) * fraction > GEOMETRY_EPSILON
  return entity.radius * directedSweep(entity) * Math.PI / 180 * fraction > GEOMETRY_EPSILON
}
