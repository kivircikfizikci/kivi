import type { Camera } from '../camera/Camera.ts'
import { worldToScreen, type ViewportSize } from '../camera/coordinateTransforms.ts'
import type { RectangleEntity } from '../entities/RectangleEntity.ts'
import { rectangleCorners } from '../geometry/rectangle.ts'

export function RectangleRenderer({ rectangle, camera, viewport, selected = false, preview = false }: { rectangle: RectangleEntity; camera: Camera; viewport: ViewportSize; selected?: boolean; preview?: boolean }) {
  const points = rectangleCorners(rectangle).map((point) => worldToScreen(point, camera, viewport)).map((point) => `${point.x},${point.y}`).join(' ')
  return (
    <g className={preview ? 'shape-preview' : undefined} pointerEvents="none">
      {selected && <polygon points={points} fill="none" className="selection-highlight shape-selection" />}
      <polygon points={points} fill="none" stroke={rectangle.style.color} strokeWidth={rectangle.style.width} />
    </g>
  )
}
