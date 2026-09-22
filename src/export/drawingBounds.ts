import type { Entity } from '../drawing/entities/Entity.ts'
import { dimensionGeometry } from '../drawing/geometry/dimension.ts'
import { formatDimension } from '../drawing/geometry/formatDimension.ts'
import type { ProjectSettings } from '../types/project.ts'

export interface DrawingBounds {
  minX: number
  minY: number
  maxX: number
  maxY: number
  width: number
  height: number
}

export function calculateDrawingBounds(entities: readonly Entity[], settings: ProjectSettings): DrawingBounds {
  const points: Array<{ x: number; y: number }> = []
  const lines = new Map(entities.filter((entity) => entity.type === 'line').map((line) => [line.id, line]))

  for (const entity of entities) {
    if (entity.type === 'line') {
      points.push(entity.start, entity.end)
      continue
    }
    const target = lines.get(entity.targetEntityId)
    if (!target) continue
    const geometry = dimensionGeometry(target, entity)
    if (!geometry) continue
    points.push(target.start, target.end, geometry.start, geometry.end)
    const textSize = entity.style.textSize ?? 13
    const labelWidth = formatDimension(geometry.length, settings).length * textSize * 0.62
    const radius = Math.hypot(labelWidth / 2, textSize) + 4
    points.push(
      { x: geometry.text.x - radius, y: geometry.text.y - radius },
      { x: geometry.text.x + radius, y: geometry.text.y + radius },
    )
  }

  if (points.length === 0) return createBounds(0, 0, 100, 100)
  const minX = Math.min(...points.map((point) => point.x))
  const minY = Math.min(...points.map((point) => point.y))
  const maxX = Math.max(...points.map((point) => point.x))
  const maxY = Math.max(...points.map((point) => point.y))
  const span = Math.max(maxX - minX, maxY - minY, 1)
  const padding = Math.max(12, span * 0.06)
  return createBounds(minX - padding, minY - padding, maxX + padding, maxY + padding)
}

function createBounds(minX: number, minY: number, maxX: number, maxY: number): DrawingBounds {
  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY }
}
