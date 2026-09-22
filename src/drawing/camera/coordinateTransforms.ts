import { clampZoom, type Camera } from './Camera.ts'
import type { Point } from '../geometry/Point.ts'

export interface ViewportSize {
  width: number
  height: number
}

export function worldToScreen(point: Point, camera: Camera, viewport: ViewportSize): Point {
  return {
    x: viewport.width / 2 + (point.x - camera.center.x) * camera.zoom,
    y: viewport.height / 2 - (point.y - camera.center.y) * camera.zoom,
  }
}

export function screenToWorld(point: Point, camera: Camera, viewport: ViewportSize): Point {
  return {
    x: camera.center.x + (point.x - viewport.width / 2) / camera.zoom,
    y: camera.center.y - (point.y - viewport.height / 2) / camera.zoom,
  }
}

export function zoomCameraAt(camera: Camera, focus: Point, requestedZoom: number, viewport: ViewportSize): Camera {
  const zoom = clampZoom(requestedZoom)
  const worldFocus = screenToWorld(focus, camera, viewport)
  return {
    zoom,
    center: {
      x: worldFocus.x - (focus.x - viewport.width / 2) / zoom,
      y: worldFocus.y + (focus.y - viewport.height / 2) / zoom,
    },
  }
}

export function panCamera(camera: Camera, screenDelta: Point): Camera {
  return {
    ...camera,
    center: {
      x: camera.center.x - screenDelta.x / camera.zoom,
      y: camera.center.y + screenDelta.y / camera.zoom,
    },
  }
}

export function cameraForGesture(
  initialCamera: Camera,
  initialFocus: Point,
  currentFocus: Point,
  scale: number,
  viewport: ViewportSize,
): Camera {
  const zoom = clampZoom(initialCamera.zoom * scale)
  const anchoredWorldPoint = screenToWorld(initialFocus, initialCamera, viewport)
  return {
    zoom,
    center: {
      x: anchoredWorldPoint.x - (currentFocus.x - viewport.width / 2) / zoom,
      y: anchoredWorldPoint.y + (currentFocus.y - viewport.height / 2) / zoom,
    },
  }
}
