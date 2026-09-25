import type { Entity } from '../entities/Entity.ts'
import type { LineEntity } from '../entities/LineEntity.ts'
import type { Point } from '../geometry/Point.ts'
import { projectPointToSegment } from '../geometry/projection.ts'
import { buildDimensionGeometry, resolveDimensionSegment } from '../geometry/dimension.ts'
import { rectangleEdges } from '../geometry/rectangle.ts'
import { angleFromCenter, angleIsOnArc } from '../geometry/arc.ts'

export const SELECTION_TOLERANCE_MOUSE_PX = 8
export const SELECTION_TOLERANCE_TOUCH_PX = 16

export class SelectionManager {
  findLine(
    pointer: Point,
    entities: readonly Entity[],
    zoom: number,
    tolerancePixels: number,
  ): LineEntity | null {
    let selected: LineEntity | null = null
    let bestDistancePixels = Number.POSITIVE_INFINITY

    for (const entity of entities) {
      if (entity.type !== 'line') continue
      const projection = projectPointToSegment(pointer, entity.start, entity.end)
      const distancePixels = Math.sqrt(projection.distanceSquared) * zoom
      if (distancePixels <= tolerancePixels && distancePixels < bestDistancePixels) {
        selected = entity
        bestDistancePixels = distancePixels
      }
    }

    return selected
  }

  findEntity(pointer: Point, entities: readonly Entity[], zoom: number, tolerancePixels: number): Entity | null {
    let selected: Entity | null = null
    let bestDistance = Number.POSITIVE_INFINITY
    for (const entity of entities) {
      let distancePixels: number
      if (entity.type === 'line') {
        distancePixels = Math.sqrt(projectPointToSegment(pointer, entity.start, entity.end).distanceSquared) * zoom
      } else if (entity.type === 'dimension') {
        const segment = resolveDimensionSegment(entity, entities)
        if (!segment) continue
        const geometry = buildDimensionGeometry(segment, entity)
        if (!geometry) continue
        const lineDistance = Math.sqrt(projectPointToSegment(pointer, geometry.start, geometry.end).distanceSquared) * zoom
        const textDistancePixels = Math.hypot(pointer.x - geometry.text.x, pointer.y - geometry.text.y) * zoom
        distancePixels = Math.min(lineDistance, Math.max(0, textDistancePixels - 22))
      } else if (entity.type === 'rectangle') {
        distancePixels = Math.min(...rectangleEdges(entity).map((edge) => Math.sqrt(projectPointToSegment(pointer, edge.start, edge.end).distanceSquared) * zoom))
      } else if (entity.type === 'circle') {
        distancePixels = Math.abs(Math.hypot(pointer.x - entity.center.x, pointer.y - entity.center.y) - entity.radius) * zoom
      } else {
        const radialDistance = Math.abs(Math.hypot(pointer.x - entity.center.x, pointer.y - entity.center.y) - entity.radius) * zoom
        const angularTolerance = entity.radius > 0 ? tolerancePixels / (entity.radius * zoom) * 180 / Math.PI : 0
        distancePixels = angleIsOnArc(angleFromCenter(entity.center, pointer), entity, angularTolerance)
          ? radialDistance
          : Number.POSITIVE_INFINITY
      }
      if (distancePixels <= tolerancePixels && distancePixels <= bestDistance) {
        selected = entity
        bestDistance = distancePixels
      }
    }
    return selected
  }
}
