import type { Camera } from '../camera/Camera.ts'
import { worldToScreen, type ViewportSize } from '../camera/coordinateTransforms.ts'
import type { ArcEntity } from '../entities/ArcEntity.ts'
import { arcToSvgPath } from '../geometry/arc.ts'

export function ArcRenderer({ arc, camera, viewport, selected = false, preview = false }: { arc: ArcEntity; camera: Camera; viewport: ViewportSize; selected?: boolean; preview?: boolean }) {
  const path = arcToSvgPath(arc, (point) => worldToScreen(point, camera, viewport), camera.zoom, true)
  return (
    <g className={preview ? 'shape-preview' : undefined} pointerEvents="none">
      {selected && <path d={path} fill="none" className="selection-highlight shape-selection" />}
      <path d={path} fill="none" stroke={arc.style.color} strokeWidth={arc.style.width} strokeLinecap="round" />
    </g>
  )
}
