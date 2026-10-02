import type { Camera } from '../camera/Camera.ts'
import { worldToScreen, type ViewportSize } from '../camera/coordinateTransforms.ts'
import type { PolygonEntity } from '../entities/PolygonEntity.ts'
import { getPolygonVertices } from '../geometry/polygon.ts'

export function PolygonRenderer({ polygon, camera, viewport, selected = false, preview = false }: { polygon: PolygonEntity; camera: Camera; viewport: ViewportSize; selected?: boolean; preview?: boolean }) {
  const points = getPolygonVertices(polygon).map((point) => worldToScreen(point, camera, viewport)).map((point) => `${point.x},${point.y}`).join(' ')
  return <g className={preview ? 'shape-preview' : undefined} pointerEvents="none">
    {selected && <polygon points={points} fill="none" className="selection-highlight shape-selection" />}
    <polygon points={points} fill="none" stroke={polygon.style.color} strokeWidth={polygon.style.width} />
  </g>
}
