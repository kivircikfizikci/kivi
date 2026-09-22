import type { Point } from '../drawing/geometry/Point.ts'
import { dimensionGeometry } from '../drawing/geometry/dimension.ts'
import { formatDimension } from '../drawing/geometry/formatDimension.ts'
import type { Project } from '../types/project.ts'
import { calculateDrawingBounds, type DrawingBounds } from './drawingBounds.ts'
import { exportBoundsFromWorldBounds, worldPointToExportPoint } from './exportCoordinates.ts'

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
  outlineColor: string
  size: number
  rotation: number
}

export interface DrawingExportModel {
  bounds: DrawingBounds
  transparent: true
  includesGrid: false
  strokes: ExportStroke[]
  polygons: ExportPolygon[]
  labels: ExportLabel[]
}

export function createDrawingExportModel(project: Pick<Project, 'drawing' | 'projectSettings'>): DrawingExportModel {
  const { entities } = project.drawing
  const worldBounds = calculateDrawingBounds(entities, project.projectSettings)
  const mapPoint = (point: Point) => worldPointToExportPoint(point, worldBounds)
  const lines = new Map(entities.filter((entity) => entity.type === 'line').map((line) => [line.id, line]))
  const strokes: ExportStroke[] = []
  const polygons: ExportPolygon[] = []
  const labels: ExportLabel[] = []

  for (const entity of entities) {
    if (entity.type === 'line') {
      strokes.push({ start: mapPoint(entity.start), end: mapPoint(entity.end), color: entity.style.color, width: entity.style.width })
      continue
    }
    const target = lines.get(entity.targetEntityId)
    if (!target) continue
    const geometry = dimensionGeometry(target, entity)
    if (!geometry) continue
    // Transparent exports cannot borrow contrast from the project canvas.
    const color = entity.style.color ?? '#315c4c'
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
      outlineColor: contrastingOutline(color),
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

function contrastingOutline(color: string) {
  const hex = color.replace('#', '')
  if (!/^[\da-f]{6}$/i.test(hex)) return '#ffffff'
  const [r, g, b] = [hex.slice(0, 2), hex.slice(2, 4), hex.slice(4, 6)].map((value) => parseInt(value, 16))
  return ((r ?? 0) * 299 + (g ?? 0) * 587 + (b ?? 0) * 114) / 1000 > 150 ? '#17201c' : '#ffffff'
}
