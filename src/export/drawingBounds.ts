import type { Entity } from '../drawing/entities/Entity.ts'
import { buildDimensionGeometry, resolveDimensionSegment } from '../drawing/geometry/dimension.ts'
import { formatDimension } from '../drawing/geometry/formatDimension.ts'
import type { ProjectSettings } from '../types/project.ts'
import { rectangleCorners } from '../drawing/geometry/rectangle.ts'
import { angleIsOnArc, pointOnCircle } from '../drawing/geometry/arc.ts'

export interface DrawingBounds {
  minX: number
  minY: number
  maxX: number
  maxY: number
  width: number
  height: number
}

export interface DrawingExportLayout {
  bounds: DrawingBounds
  worldUnitsPerPixel: number
}

const EXPORT_REFERENCE_VIEWPORT_PX = 1000

export function calculateDrawingBounds(entities: readonly Entity[], settings: ProjectSettings): DrawingBounds {
  return calculateDrawingExportLayout(entities, settings).bounds
}

export function calculateDrawingExportLayout(entities: readonly Entity[], settings: ProjectSettings): DrawingExportLayout {
  const points: Array<{ x: number; y: number }> = []
  const labels: Array<{ position: { x: number; y: number }; text: string; textSize: number }> = []

  for (const entity of entities) {
    if (entity.type === 'line') {
      points.push(entity.start, entity.end)
      continue
    }
    if (entity.type === 'rectangle') {
      points.push(...rectangleCorners(entity))
      continue
    }
    if (entity.type === 'circle') {
      points.push(
        { x: entity.center.x - entity.radius, y: entity.center.y - entity.radius },
        { x: entity.center.x + entity.radius, y: entity.center.y + entity.radius },
      )
      continue
    }
    if (entity.type === 'arc') {
      points.push(pointOnCircle(entity.center, entity.radius, entity.startAngle), pointOnCircle(entity.center, entity.radius, entity.endAngle))
      for (const angle of [0, 90, 180, 270]) {
        if (angleIsOnArc(angle, entity)) points.push(pointOnCircle(entity.center, entity.radius, angle))
      }
      continue
    }
    const segment = resolveDimensionSegment(entity, entities)
    if (!segment) continue
    const geometry = buildDimensionGeometry(segment, entity)
    if (!geometry) continue
    points.push(segment.start, segment.end, geometry.start, geometry.end)
    labels.push({ position: geometry.text, text: formatDimension(geometry.length, settings), textSize: entity.style.textSize ?? 13 })
  }

  if (points.length === 0) return { bounds: createBounds(0, 0, 100, 100), worldUnitsPerPixel: 0.1 }
  const geometryMinX = Math.min(...points.map((point) => point.x))
  const geometryMinY = Math.min(...points.map((point) => point.y))
  const geometryMaxX = Math.max(...points.map((point) => point.x))
  const geometryMaxY = Math.max(...points.map((point) => point.y))
  const geometrySpan = Math.max(geometryMaxX - geometryMinX, geometryMaxY - geometryMinY, 1)
  const worldUnitsPerPixel = geometrySpan / EXPORT_REFERENCE_VIEWPORT_PX

  for (const label of labels) {
    const labelWidth = label.text.length * label.textSize * 0.62 * worldUnitsPerPixel
    const labelHeight = label.textSize * worldUnitsPerPixel
    const radius = Math.hypot(labelWidth / 2, labelHeight) + 4 * worldUnitsPerPixel
    points.push(
      { x: label.position.x - radius, y: label.position.y - radius },
      { x: label.position.x + radius, y: label.position.y + radius },
    )
  }

  const minX = Math.min(...points.map((point) => point.x))
  const minY = Math.min(...points.map((point) => point.y))
  const maxX = Math.max(...points.map((point) => point.x))
  const maxY = Math.max(...points.map((point) => point.y))
  const padding = geometrySpan * 0.06
  return { bounds: createBounds(minX - padding, minY - padding, maxX + padding, maxY + padding), worldUnitsPerPixel }
}

function createBounds(minX: number, minY: number, maxX: number, maxY: number): DrawingBounds {
  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY }
}
