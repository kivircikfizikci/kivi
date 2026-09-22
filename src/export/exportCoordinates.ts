import type { Point } from '../drawing/geometry/Point.ts'
import type { DrawingBounds } from './drawingBounds.ts'

/** Export space uses the browser convention: +X right and +Y down. */
export function worldPointToExportPoint(point: Point, worldBounds: DrawingBounds): Point {
  return {
    x: point.x - worldBounds.minX,
    y: worldBounds.maxY - point.y,
  }
}

export function exportBoundsFromWorldBounds(worldBounds: DrawingBounds): DrawingBounds {
  return {
    minX: 0,
    minY: 0,
    maxX: worldBounds.width,
    maxY: worldBounds.height,
    width: worldBounds.width,
    height: worldBounds.height,
  }
}
