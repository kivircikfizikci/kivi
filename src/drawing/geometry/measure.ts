import type { Entity } from '../entities/Entity.ts'
import type { Point } from './Point.ts'
import { angleFromCenter, angleIsOnArc, arcSweep, pointOnCircle } from './arc.ts'
import { distance } from './distance.ts'
import { lineArcIntersections, lineCircleIntersections, lineLineIntersections, type LineSegment } from './intersections.ts'
import { getPolygonVertices, polygonEdges, polygonInteriorAngle, polygonSideLength } from './polygon.ts'
import { projectPointToSegment } from './projection.ts'
import { rectangleCorners, rectangleEdges } from './rectangle.ts'

export interface PointMeasurement { distance: number; deltaX: number; deltaY: number; angle: number }
export interface AngleMeasurement { angle: number; supplementary: number; intersection: Point | null; parallel: boolean }
export interface MeasureValue { label: 'length' | 'angle' | 'width' | 'height' | 'radius' | 'diameter' | 'sides' | 'sideLength' | 'sweepAngle' | 'arcLength' | 'interiorAngle'; value: number; kind: 'length' | 'angle' | 'count' }

type MeasureEntityType = 'line' | 'rectangle' | 'circle' | 'arc' | 'polygon'
interface MeasurePrimitiveBase { key: string; entityId: string; entityType: MeasureEntityType }
export interface MeasureSegmentPrimitive extends MeasurePrimitiveBase { kind: 'segment'; segment: LineSegment }
export interface MeasureCirclePrimitive extends MeasurePrimitiveBase { kind: 'circle'; center: Point; radius: number }
export interface MeasureArcPrimitive extends MeasurePrimitiveBase { kind: 'arc'; center: Point; radius: number; startAngle: number; endAngle: number; direction: 'cw' | 'ccw' }
export type MeasurePrimitive = MeasureSegmentPrimitive | MeasureCirclePrimitive | MeasureArcPrimitive
export interface RankedMeasurePrimitive { primitive: MeasurePrimitive; distancePixels: number; nearestPoint: Point }
export type MeasureRelationship =
  | { kind: 'segment-angle'; first: MeasureSegmentPrimitive; second: MeasureSegmentPrimitive; measurement: AngleMeasurement; focus: Point }
  | { kind: 'distance'; first: MeasurePrimitive; second: MeasurePrimitive; start: Point; end: Point; distance: number; parallel: boolean; intersects: boolean }
export interface LiveMeasureInspection {
  anchor: Point
  radiusPixels: number
  candidates: RankedMeasurePrimitive[]
  relationship: MeasureRelationship | null
}

const HYSTERESIS_PIXELS = 12

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

export function getMeasurePrimitives(entity: Entity): MeasurePrimitive[] {
  if (entity.type === 'line') return [{ kind: 'segment', key: `${entity.id}:segment:0`, entityId: entity.id, entityType: entity.type, segment: { start: entity.start, end: entity.end } }]
  if (entity.type === 'rectangle' || entity.type === 'polygon') return getEntityMeasureSegments(entity).map((segment, index) => ({ kind: 'segment', key: `${entity.id}:segment:${index}`, entityId: entity.id, entityType: entity.type, segment }))
  if (entity.type === 'circle') return [{ kind: 'circle', key: `${entity.id}:circle`, entityId: entity.id, entityType: entity.type, center: entity.center, radius: entity.radius }]
  if (entity.type === 'arc') return [{ kind: 'arc', key: `${entity.id}:arc`, entityId: entity.id, entityType: entity.type, center: entity.center, radius: entity.radius, startAngle: entity.startAngle, endAngle: entity.endAngle, direction: entity.direction }]
  return []
}

export function inspectNearbyGeometry(anchor: Point, entities: readonly Entity[], zoom: number, radiusPixels: number, previousKeys: readonly string[] = []): LiveMeasureInspection {
  const safeZoom = Math.max(zoom, Number.EPSILON)
  const radiusWorld = radiusPixels / safeZoom
  const candidates = entities
    .filter(isMeasureEntity)
    .filter((entity) => boundsNearPoint(entityMeasureBounds(entity), anchor, radiusWorld))
    .flatMap(getMeasurePrimitives)
    .map((primitive) => rankPrimitive(primitive, anchor, safeZoom))
    .filter((candidate) => candidate.distancePixels <= radiusPixels)
    .sort((a, b) => candidateScore(a) - candidateScore(b))

  const primary = stabilizeCandidate(candidates, previousKeys[0], radiusPixels)
  if (!primary) return { anchor: { ...anchor }, radiusPixels, candidates: [], relationship: null }
  const remaining = candidates.filter((candidate) => candidate.primitive.key !== primary.primitive.key)
  const secondary = stabilizeCandidate(
    remaining.filter((candidate) => {
      const relationshipWindow = candidate.primitive.entityId === primary.primitive.entityId ? 18 : 48
      return compatiblePrimitives(primary.primitive, candidate.primitive) && candidate.distancePixels <= Math.min(radiusPixels, primary.distancePixels + relationshipWindow)
    }),
    previousKeys[1],
    radiusPixels,
  )
  const selected = [primary]
  if (secondary) selected.push(secondary)
  const tertiary = remaining.find((candidate) => !selected.some((selectedCandidate) => selectedCandidate.primitive.key === candidate.primitive.key) && candidate.distancePixels <= primary.distancePixels + 28)
  if (tertiary) selected.push(tertiary)
  return {
    anchor: { ...anchor },
    radiusPixels,
    candidates: selected,
    relationship: secondary ? measurePrimitiveRelationship(primary, secondary, safeZoom) : null,
  }
}

export function stabilizeCandidate(candidates: readonly RankedMeasurePrimitive[], previousKey: string | undefined, radiusPixels: number) {
  const best = candidates[0] ?? null
  if (!best || !previousKey) return best
  const previous = candidates.find((candidate) => candidate.primitive.key === previousKey)
  return previous && previous.distancePixels <= radiusPixels && previous.distancePixels <= best.distancePixels + HYSTERESIS_PIXELS ? previous : best
}

export function measurePrimitiveRelationship(first: RankedMeasurePrimitive, second: RankedMeasurePrimitive, zoom: number): MeasureRelationship {
  if (first.primitive.kind === 'segment' && second.primitive.kind === 'segment') {
    const measurement = intersectionAngleGeometry(first.primitive.segment, second.primitive.segment)
    if (!measurement.parallel) {
      const intersectionDistancePixels = measurement.intersection ? distance(measurement.intersection, first.nearestPoint) * zoom : Number.POSITIVE_INFINITY
      return { kind: 'segment-angle', first: first.primitive, second: second.primitive, measurement, focus: measurement.intersection && intersectionDistancePixels <= 240 ? measurement.intersection : midpoint(first.nearestPoint, second.nearestPoint) }
    }
    const connector = closestSegmentConnector(first.primitive.segment, second.primitive.segment)
    return { kind: 'distance', first: first.primitive, second: second.primitive, ...connector, distance: distance(connector.start, connector.end), parallel: true, intersects: false }
  }
  const connector = primitiveConnector(first.primitive, second.primitive, first.nearestPoint, second.nearestPoint)
  return { kind: 'distance', first: first.primitive, second: second.primitive, ...connector, distance: distance(connector.start, connector.end), parallel: false, intersects: connector.intersects }
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

function isMeasureEntity(entity: Entity): entity is Extract<Entity, { type: MeasureEntityType }> {
  return entity.type === 'line' || entity.type === 'rectangle' || entity.type === 'circle' || entity.type === 'arc' || entity.type === 'polygon'
}

function rankPrimitive(primitive: MeasurePrimitive, anchor: Point, zoom: number): RankedMeasurePrimitive {
  const nearestPoint = nearestPointOnPrimitive(primitive, anchor)
  return { primitive, nearestPoint, distancePixels: distance(anchor, nearestPoint) * zoom }
}

function candidateScore(candidate: RankedMeasurePrimitive) {
  const kindPenalty = candidate.primitive.kind === 'segment' ? 0 : candidate.primitive.kind === 'arc' ? 1 : 2
  return candidate.distancePixels + kindPenalty
}

function radialPoint(center: Point, radius: number, anchor: Point) {
  const dx = anchor.x - center.x; const dy = anchor.y - center.y
  const length = Math.hypot(dx, dy)
  return length <= Number.EPSILON ? { x: center.x + radius, y: center.y } : { x: center.x + dx / length * radius, y: center.y + dy / length * radius }
}

function nearestPointOnPrimitive(primitive: MeasurePrimitive, anchor: Point): Point {
  if (primitive.kind === 'segment') return projectPointToSegment(anchor, primitive.segment.start, primitive.segment.end).point
  const radial = radialPoint(primitive.center, primitive.radius, anchor)
  if (primitive.kind === 'circle' || angleIsOnArc(angleFromCenter(primitive.center, radial), primitive)) return radial
  const start = pointOnCircle(primitive.center, primitive.radius, primitive.startAngle)
  const end = pointOnCircle(primitive.center, primitive.radius, primitive.endAngle)
  return distance(anchor, start) <= distance(anchor, end) ? start : end
}

function compatiblePrimitives(first: MeasurePrimitive, second: MeasurePrimitive) {
  if (first.key === second.key) return false
  return first.kind === 'segment' || second.kind === 'segment' || first.entityId !== second.entityId
}

function primitiveConnector(first: MeasurePrimitive, second: MeasurePrimitive, firstNearest: Point, secondNearest: Point) {
  const segment = first.kind === 'segment' ? first : second.kind === 'segment' ? second : null
  const curve = segment === first ? second : segment === second ? first : null
  if (segment && curve && curve.kind !== 'segment') {
    const intersections = curve.kind === 'circle' ? lineCircleIntersections(segment.segment, curve) : lineArcIntersections(segment.segment, curve)
    if (intersections.length) {
      const point = intersections.reduce((nearest, item) => distance(item.point, firstNearest) < distance(nearest.point, firstNearest) ? item : nearest).point
      return { start: point, end: point, intersects: true }
    }
    const curvePoint = nearestPointOnPrimitive(curve, firstNearest)
    const segmentPoint = projectPointToSegment(curvePoint, segment.segment.start, segment.segment.end).point
    return segment === first ? { start: segmentPoint, end: curvePoint, intersects: false } : { start: curvePoint, end: segmentPoint, intersects: false }
  }
  return { start: firstNearest, end: secondNearest, intersects: false }
}

function closestSegmentConnector(first: LineSegment, second: LineSegment) {
  const intersection = lineLineIntersections(first, second)[0]
  if (intersection) return { start: intersection.point, end: intersection.point }
  const options = [
    { start: first.start, end: projectPointToSegment(first.start, second.start, second.end).point },
    { start: first.end, end: projectPointToSegment(first.end, second.start, second.end).point },
    { start: projectPointToSegment(second.start, first.start, first.end).point, end: second.start },
    { start: projectPointToSegment(second.end, first.start, first.end).point, end: second.end },
  ]
  return options.reduce((best, item) => distance(item.start, item.end) < distance(best.start, best.end) ? item : best)
}

function entityMeasureBounds(entity: Extract<Entity, { type: MeasureEntityType }>) {
  if (entity.type === 'line') return pointsBounds([entity.start, entity.end])
  if (entity.type === 'rectangle') return pointsBounds(rectangleCorners(entity))
  if (entity.type === 'polygon') return pointsBounds(getPolygonVertices(entity))
  return { minX: entity.center.x - entity.radius, minY: entity.center.y - entity.radius, maxX: entity.center.x + entity.radius, maxY: entity.center.y + entity.radius }
}

function pointsBounds(points: readonly Point[]) {
  return { minX: Math.min(...points.map((point) => point.x)), minY: Math.min(...points.map((point) => point.y)), maxX: Math.max(...points.map((point) => point.x)), maxY: Math.max(...points.map((point) => point.y)) }
}

function boundsNearPoint(bounds: { minX: number; minY: number; maxX: number; maxY: number }, point: Point, radius: number) {
  return point.x >= bounds.minX - radius && point.x <= bounds.maxX + radius && point.y >= bounds.minY - radius && point.y <= bounds.maxY + radius
}

function midpoint(a: Point, b: Point) { return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 } }
