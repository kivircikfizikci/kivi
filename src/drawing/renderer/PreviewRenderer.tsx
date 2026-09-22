import type { Camera } from '../camera/Camera.ts'
import { worldToScreen, type ViewportSize } from '../camera/coordinateTransforms.ts'
import type { Point } from '../geometry/Point.ts'

interface PreviewRendererProps {
  start: Point | null
  end: Point | null
  camera: Camera
  viewport: ViewportSize
  color: string
  width: number
}

export function PreviewRenderer({ start, end, camera, viewport, color, width }: PreviewRendererProps) {
  if (!start || !end) return null
  const screenStart = worldToScreen(start, camera, viewport)
  const screenEnd = worldToScreen(end, camera, viewport)
  return (
    <line
      x1={screenStart.x}
      y1={screenStart.y}
      x2={screenEnd.x}
      y2={screenEnd.y}
      stroke={color}
      strokeWidth={width}
      strokeLinecap="round"
      strokeDasharray="7 5"
      opacity="0.8"
      pointerEvents="none"
    />
  )
}
