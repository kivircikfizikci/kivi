import type { Point } from '../drawing/geometry/Point.ts'
import { dimensionGeometry } from '../drawing/geometry/dimension.ts'
import { formatDimension } from '../drawing/geometry/formatDimension.ts'
import type { Project } from '../types/project.ts'
import { calculateDrawingBounds, type DrawingBounds } from './drawingBounds.ts'

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
  haloColor: string
  size: number
  rotation: number
}

export interface DrawingExportModel {
  bounds: DrawingBounds
  backgroundColor: string
  grid: { enabled: boolean; spacing: number; color: string }
  strokes: ExportStroke[]
  polygons: ExportPolygon[]
  labels: ExportLabel[]
}

export function createDrawingExportModel(project: Pick<Project, 'drawing' | 'projectSettings'>): DrawingExportModel {
  const { entities } = project.drawing
  const lines = new Map(entities.filter((entity) => entity.type === 'line').map((line) => [line.id, line]))
  const strokes: ExportStroke[] = []
  const polygons: ExportPolygon[] = []
  const labels: ExportLabel[] = []

  for (const entity of entities) {
    if (entity.type === 'line') {
      strokes.push({ start: entity.start, end: entity.end, color: entity.style.color, width: entity.style.width })
      continue
    }
    const target = lines.get(entity.targetEntityId)
    if (!target) continue
    const geometry = dimensionGeometry(target, entity)
    if (!geometry) continue
    const color = entity.style.color ?? contrastColor(project.projectSettings.backgroundColor)
    const direction = unitDirection(geometry.start, geometry.end)
    strokes.push(
      { start: target.start, end: geometry.start, color, width: 1.2 },
      { start: target.end, end: geometry.end, color, width: 1.2 },
      { start: geometry.start, end: geometry.end, color, width: 1.2 },
    )
    polygons.push(
      { points: arrow(geometry.start, direction, 1), color },
      { points: arrow(geometry.end, direction, -1), color },
    )
    labels.push({
      position: { x: geometry.text.x, y: geometry.text.y - 7 },
      text: formatDimension(geometry.length, project.projectSettings),
      color,
      haloColor: project.projectSettings.backgroundColor,
      size: entity.style.textSize ?? 13,
      rotation: geometry.rotation,
    })
  }

  return {
    bounds: calculateDrawingBounds(entities, project.projectSettings),
    backgroundColor: project.projectSettings.backgroundColor,
    grid: {
      enabled: project.projectSettings.gridEnabled,
      spacing: project.projectSettings.gridSpacing,
      color: project.projectSettings.gridColor,
    },
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

function contrastColor(background: string) {
  const hex = background.replace('#', '')
  if (!/^[\da-f]{6}$/i.test(hex)) return '#315c4c'
  const [r, g, b] = [hex.slice(0, 2), hex.slice(2, 4), hex.slice(4, 6)].map((value) => parseInt(value, 16))
  return ((r ?? 0) * 299 + (g ?? 0) * 587 + (b ?? 0) * 114) / 1000 < 128 ? '#d9f0e4' : '#315c4c'
}
