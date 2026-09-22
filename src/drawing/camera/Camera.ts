import type { Point } from '../geometry/Point.ts'

export interface Camera {
  center: Point
  zoom: number
}

export const DEFAULT_CAMERA: Camera = {
  center: { x: 0, y: 0 },
  zoom: 4,
}

export const MIN_ZOOM = 0.08
export const MAX_ZOOM = 80

export function clampZoom(zoom: number) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom))
}
