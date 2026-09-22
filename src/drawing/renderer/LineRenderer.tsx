import type { Camera } from '../camera/Camera.ts'
import { worldToScreen, type ViewportSize } from '../camera/coordinateTransforms.ts'
import type { LineEntity } from '../entities/LineEntity.ts'

interface LineRendererProps {
  line: LineEntity
  camera: Camera
  viewport: ViewportSize
  selected: boolean
}

export function LineRenderer({ line, camera, viewport, selected }: LineRendererProps) {
  const start = worldToScreen(line.start, camera, viewport)
  const end = worldToScreen(line.end, camera, viewport)
  return (
    <g>
      {selected && (
        <line x1={start.x} y1={start.y} x2={end.x} y2={end.y} className="selection-highlight" />
      )}
      <line
        x1={start.x}
        y1={start.y}
        x2={end.x}
        y2={end.y}
        stroke={line.style.color}
        strokeWidth={line.style.width}
        strokeLinecap="round"
      />
    </g>
  )
}
