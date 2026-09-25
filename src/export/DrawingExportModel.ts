import type { Point } from '../drawing/geometry/Point.ts'
import { dimensionGeometry } from '../drawing/geometry/dimension.ts'
import { formatDimension } from '../drawing/geometry/formatDimension.ts'
import type { Project } from '../types/project.ts'
import { calculateDrawingBounds, type DrawingBounds } from './drawingBounds.ts'
import { exportBoundsFromWorldBounds, worldPointToExportPoint } from './exportCoordinates.ts'
import { resolveDimensionColor } from '../drawing/geometry/dimensionColor.ts'
import { rectangleCorners } from '../drawing/geometry/rectangle.ts'
import type { ArcDirection } from '../drawing/entities/ArcEntity.ts'

export interface ExportStroke {
  start: Point
  end: Point
  color: string
  width: number
}

export interface ExportPolygon {
  points: Point[]
  color: string
}

export interface ExportLabel {
  position: Point
  text: string
  color: string
  size: number
  rotation: number
}

export interface ExportRectangle { origin: Point; width: number; height: number; color: string; strokeWidth: number }
export interface ExportCircle { center: Point; radius: number; color: string; strokeWidth: number }
export interface ExportArc { center: Point; radius: number; startAngle: number; endAngle: number; direction: ArcDirection; color: string; strokeWidth: number }

export interface DrawingExportModel {
  bounds: DrawingBounds
  transparent: true
  includesGrid: false
  strokes: ExportStroke[]
  polygons: ExportPolygon[]
  labels: ExportLabel[]
  rectangles: ExportRectangle[]
  circles: ExportCircle[]
  arcs: ExportArc[]
}

export function createDrawingExportModel(project: Pick<Project, 'drawing' | 'projectSettings'>): DrawingExportModel {
  const { entities } = project.drawing
  const worldBounds = calculateDrawingBounds(entities, project.projectSettings)
  const mapPoint = (point: Point) => worldPointToExportPoint(point, worldBounds)
  const lines = new Map(entities.filter((entity) => entity.type === 'line').map((line) => [line.id, line]))
  const strokes: ExportStroke[] = []
  const polygons: ExportPolygon[] = []
  const labels: ExportLabel[] = []
  const rectangles: ExportRectangle[] = []
  const circles: ExportCircle[] = []
  const arcs: ExportArc[] = []

  for (const entity of entities) {
    if (entity.type === 'line') {
      strokes.push({ start: mapPoint(entity.start), end: mapPoint(entity.end), color: entity.style.color, width: entity.style.width })
      continue
    }
    if (entity.type === 'rectangle') {
      const corners = rectangleCorners(entity).map(mapPoint)
      rectangles.push({ origin: corners[3]!, width: entity.width, height: entity.height, color: entity.style.color, strokeWidth: entity.style.width })
      continue
    }
    if (entity.type === 'circle') {
      circles.push({ center: mapPoint(entity.center), radius: entity.radius, color: entity.style.color, strokeWidth: entity.style.width })
      continue
    }
    if (entity.type === 'arc') {
      arcs.push({ center: mapPoint(entity.center), radius: entity.radius, startAngle: entity.startAngle, endAngle: entity.endAngle, direction: entity.direction, color: entity.style.color, strokeWidth: entity.style.width })
      continue
    }
    const target = lines.get(entity.targetEntityId)
    if (!target) continue
    const geometry = dimensionGeometry(target, entity)
    if (!geometry) continue
    const color = resolveDimensionColor(entity, project.projectSettings)
    const targetStart = mapPoint(target.start)
    const targetEnd = mapPoint(target.end)
    const start = mapPoint(geometry.start)
    const end = mapPoint(geometry.end)
    const direction = unitDirection(start, end)
    strokes.push(
      { start: targetStart, end: start, color, width: 1.2 },
      { start: targetEnd, end, color, width: 1.2 },
      { start, end, color, width: 1.2 },
    )
    polygons.push(
      { points: arrow(start, direction, 1), color },
      { points: arrow(end, direction, -1), color },
    )
    const text = mapPoint(geometry.text)
    labels.push({
      position: { x: text.x, y: text.y - 7 },
      text: formatDimension(geometry.length, project.projectSettings),
      color,
      size: entity.style.textSize ?? 13,
      rotation: geometry.rotation,
    })
  }

  return {
    bounds: exportBoundsFromWorldBounds(worldBounds),
    transparent: true,
    includesGrid: false,
    strokes,
    polygons,
    labels,
    rectangles,
    circles,
    arcs,
  }
}

function unitDirection(start: Point, end: Point) {
  const length = Math.hypot(end.x - start.x, end.y - start.y) || 1
  return { x: (end.x - start.x) / length, y: (end.y - start.y) / length }
}

function arrow(tip: Point, direction: Point, sign: number): Point[] {
  const base = { x: tip.x + direction.x * sign * 8, y: tip.y + direction.y * sign * 8 }
  return [
    tip,
    { x: base.x - direction.y * 2.7, y: base.y + direction.x * 2.7 },
    { x: base.x + direction.y * 2.7, y: base.y - direction.x * 2.7 },
  ]
}
