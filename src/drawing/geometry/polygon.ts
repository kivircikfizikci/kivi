import type { PolygonEntity } from '../entities/PolygonEntity.ts'
import type { Point } from './Point.ts'
import { projectPointToSegment } from './projection.ts'

export interface PolygonEdge { start: Point; end: Point }

export function getPolygonVertices(polygon: Pick<PolygonEntity, 'center' | 'radius' | 'sides' | 'rotation'>): Point[] {
  return Array.from({ length: polygon.sides }, (_, index) => {
    const radians = (polygon.rotation + index * 360 / polygon.sides) * Math.PI / 180
    return {
      x: polygon.center.x + Math.cos(radians) * polygon.radius,
      y: polygon.center.y + Math.sin(radians) * polygon.radius,
    }
  })
}

export function polygonEdges(polygon: Pick<PolygonEntity, 'center' | 'radius' | 'sides' | 'rotation'>): PolygonEdge[] {
  const vertices = getPolygonVertices(polygon)
  return vertices.map((start, index) => ({ start, end: vertices[(index + 1) % vertices.length]! }))
}

export function polygonSideLength(radius: number, sides: number) {
  return 2 * radius * Math.sin(Math.PI / sides)
}

export function polygonPerimeter(radius: number, sides: number) {
  return polygonSideLength(radius, sides) * sides
}

export function polygonInteriorAngle(sides: number) {
  return (sides - 2) * 180 / sides
}

export function polygonBounds(polygon: Pick<PolygonEntity, 'center' | 'radius' | 'sides' | 'rotation'>) {
  const vertices = getPolygonVertices(polygon)
  const xs = vertices.map((point) => point.x)
  const ys = vertices.map((point) => point.y)
  return { minX: Math.min(...xs), minY: Math.min(...ys), maxX: Math.max(...xs), maxY: Math.max(...ys) }
}

export function pointNearPolygonEdge(pointer: Point, polygon: Pick<PolygonEntity, 'center' | 'radius' | 'sides' | 'rotation'>, tolerance: number) {
  return polygonEdges(polygon).some((edge) => Math.sqrt(projectPointToSegment(pointer, edge.start, edge.end).distanceSquared) <= tolerance)
}

export function nearestPolygonEdge(pointer: Point, polygon: Pick<PolygonEntity, 'center' | 'radius' | 'sides' | 'rotation'>) {
  return polygonEdges(polygon).reduce((best, edge) => {
    const distanceSquared = projectPointToSegment(pointer, edge.start, edge.end).distanceSquared
    return distanceSquared < best.distanceSquared ? { edge, distanceSquared } : best
  }, { edge: polygonEdges(polygon)[0]!, distanceSquared: Number.POSITIVE_INFINITY })
}
