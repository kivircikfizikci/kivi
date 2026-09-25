import type { Camera } from '../camera/Camera.ts'
import { worldToScreen, type ViewportSize } from '../camera/coordinateTransforms.ts'
import type { RectangleEntity } from '../entities/RectangleEntity.ts'

export function RectangleRenderer({ rectangle, camera, viewport, selected = false, preview = false }: { rectangle: RectangleEntity; camera: Camera; viewport: ViewportSize; selected?: boolean; preview?: boolean }) {
  const topLeft = worldToScreen({ x: rectangle.origin.x, y: rectangle.origin.y + rectangle.height }, camera, viewport)
  const width = rectangle.width * camera.zoom
  const height = rectangle.height * camera.zoom
  return (
    <g className={preview ? 'shape-preview' : undefined} pointerEvents="none">
      {selected && <rect x={topLeft.x} y={topLeft.y} width={width} height={height} fill="none" className="selection-highlight shape-selection" />}
      <rect x={topLeft.x} y={topLeft.y} width={width} height={height} fill="none" stroke={rectangle.style.color} strokeWidth={rectangle.style.width} />
    </g>
  )
}
