import type { Camera } from '../camera/Camera.ts'
import { worldToScreen, type ViewportSize } from '../camera/coordinateTransforms.ts'
import type { CircleEntity } from '../entities/CircleEntity.ts'

export function CircleRenderer({ circle, camera, viewport, selected = false, preview = false }: { circle: CircleEntity; camera: Camera; viewport: ViewportSize; selected?: boolean; preview?: boolean }) {
  const center = worldToScreen(circle.center, camera, viewport)
  const radius = circle.radius * camera.zoom
  return (
    <g className={preview ? 'shape-preview' : undefined} pointerEvents="none">
      {selected && <circle cx={center.x} cy={center.y} r={radius} fill="none" className="selection-highlight shape-selection" />}
      <circle cx={center.x} cy={center.y} r={radius} fill="none" stroke={circle.style.color} strokeWidth={circle.style.width} />
    </g>
  )
}
