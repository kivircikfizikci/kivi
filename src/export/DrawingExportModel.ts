import type { Point } from '../drawing/geometry/Point.ts'
import { buildDimensionGeometry, resolveDimensionSegment } from '../drawing/geometry/dimension.ts'
import { formatDimension } from '../drawing/geometry/formatDimension.ts'
import type { Project } from '../types/project.ts'
import { calculateDrawingExportLayout, type DrawingBounds } from './drawingBounds.ts'
import { exportBoundsFromWorldBounds, worldPointToExportPoint } from './exportCoordinates.ts'
import { resolveDimensionColor } from '../drawing/geometry/dimensionColor.ts'
import { rectangleCorners } from '../drawing/geometry/rectangle.ts'
import type { ArcDirection } from '../drawing/entities/ArcEntity.ts'
import { createBuiltInLayers, entitiesOnVisibleLayers } from '../project/layers.ts'
import { getPolygonVertices } from '../drawing/geometry/polygon.ts'
import { wrapText } from '../drawing/geometry/text.ts'
import type { TextStyle } from '../drawing/entities/TextEntity.ts'

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
export interface ExportText { position: Point; box: { width: number; height: number }; lines: { text: string; x: number; y: number }[]; style: TextStyle; rotation: number }

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
  texts: ExportText[]
}

export function createDrawingExportModel(project: Pick<Project, 'drawing' | 'projectSettings'> & Partial<Pick<Project, 'layers'>>): DrawingExportModel {
  const entities = entitiesOnVisibleLayers(project.drawing.entities, project.layers ?? createBuiltInLayers())
  const { bounds: worldBounds, worldUnitsPerPixel } = calculateDrawingExportLayout(entities, project.projectSettings)
  const visualSize = (pixels: number) => pixels * worldUnitsPerPixel
  const mapPoint = (point: Point) => worldPointToExportPoint(point, worldBounds)
  const strokes: ExportStroke[] = []
  const polygons: ExportPolygon[] = []
  const labels: ExportLabel[] = []
  const rectangles: ExportRectangle[] = []
  const circles: ExportCircle[] = []
  const arcs: ExportArc[] = []
  const texts: ExportText[] = []

  for (const entity of entities) {
    if (entity.type === 'line') {
      strokes.push({ start: mapPoint(entity.start), end: mapPoint(entity.end), color: entity.style.color, width: visualSize(entity.style.width) })
      continue
    }
    if (entity.type === 'rectangle') {
      const corners = rectangleCorners(entity).map(mapPoint)
      if ((entity.rotation ?? 0) === 0) rectangles.push({ origin: corners[3]!, width: entity.width, height: entity.height, color: entity.style.color, strokeWidth: visualSize(entity.style.width) })
      else corners.forEach((start, index) => strokes.push({ start, end: corners[(index + 1) % corners.length]!, color: entity.style.color, width: visualSize(entity.style.width) }))
      continue
    }
    if (entity.type === 'circle') {
      circles.push({ center: mapPoint(entity.center), radius: entity.radius, color: entity.style.color, strokeWidth: visualSize(entity.style.width) })
      continue
    }
    if (entity.type === 'arc') {
      arcs.push({ center: mapPoint(entity.center), radius: entity.radius, startAngle: entity.startAngle, endAngle: entity.endAngle, direction: entity.direction, color: entity.style.color, strokeWidth: visualSize(entity.style.width) })
      continue
    }
    if (entity.type === 'polygon') {
      const vertices = getPolygonVertices(entity).map(mapPoint)
      vertices.forEach((start, index) => strokes.push({ start, end: vertices[(index + 1) % vertices.length]!, color: entity.style.color, width: visualSize(entity.style.width) }))
      continue
    }
    if (entity.type === 'text') {
      texts.push({ position: mapPoint(entity.position), box: { ...entity.box }, lines: wrapText(entity), style: { ...entity.style }, rotation: entity.rotation })
      continue
    }
    const segment = resolveDimensionSegment(entity, entities)
    if (!segment) continue
    const geometry = buildDimensionGeometry(segment, entity)
    if (!geometry) continue
    const color = resolveDimensionColor(entity, project.projectSettings)
    const targetStart = mapPoint(segment.start)
    const targetEnd = mapPoint(segment.end)
    const start = mapPoint(geometry.start)
    const end = mapPoint(geometry.end)
    const direction = unitDirection(start, end)
    strokes.push(
      { start: targetStart, end: start, color, width: visualSize(1.2) },
      { start: targetEnd, end, color, width: visualSize(1.2) },
      { start, end, color, width: visualSize(1.2) },
    )
    polygons.push(
      { points: arrow(start, direction, 1, worldUnitsPerPixel), color },
      { points: arrow(end, direction, -1, worldUnitsPerPixel), color },
    )
    const text = mapPoint(geometry.text)
    labels.push({
      position: { x: text.x, y: text.y - visualSize(7) },
      text: formatDimension(geometry.length, project.projectSettings),
      color,
      size: visualSize(entity.style.textSize ?? 13),
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
    texts,
  }
}

function unitDirection(start: Point, end: Point) {
  const length = Math.hypot(end.x - start.x, end.y - start.y) || 1
  return { x: (end.x - start.x) / length, y: (end.y - start.y) / length }
}

function arrow(tip: Point, direction: Point, sign: number, worldUnitsPerPixel: number): Point[] {
  const length = 8 * worldUnitsPerPixel
  const halfWidth = 2.7 * worldUnitsPerPixel
  const base = { x: tip.x + direction.x * sign * length, y: tip.y + direction.y * sign * length }
  return [
    tip,
    { x: base.x - direction.y * halfWidth, y: base.y + direction.x * halfWidth },
    { x: base.x + direction.y * halfWidth, y: base.y - direction.x * halfWidth },
  ]
}
