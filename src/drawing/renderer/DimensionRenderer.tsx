import type { Camera } from '../camera/Camera.ts'
import { worldToScreen, type ViewportSize } from '../camera/coordinateTransforms.ts'
import type { LineEntity } from '../entities/LineEntity.ts'
import type { DimensionEntity } from '../entities/DimensionEntity.ts'
import { dimensionGeometry } from '../geometry/dimension.ts'
import { formatDimension } from '../geometry/formatDimension.ts'
import type { ProjectSettings } from '../../types/project.ts'
import { resolveDimensionColor } from '../geometry/dimensionColor.ts'

interface DimensionRendererProps {
  dimension: DimensionEntity
  target: LineEntity
  camera: Camera
  viewport: ViewportSize
  settings: ProjectSettings
  selected?: boolean
  preview?: boolean
}

export function DimensionRenderer({ dimension, target, camera, viewport, settings, selected = false, preview = false }: DimensionRendererProps) {
  const geometry = dimensionGeometry(target, dimension)
  if (!geometry) return null
  const a = worldToScreen(target.start, camera, viewport)
  const b = worldToScreen(target.end, camera, viewport)
  const start = worldToScreen(geometry.start, camera, viewport)
  const end = worldToScreen(geometry.end, camera, viewport)
  const center = worldToScreen(geometry.text, camera, viewport)
  const dx = end.x - start.x
  const dy = end.y - start.y
  const screenLength = Math.hypot(dx, dy)
  if (screenLength < 1) return null
  const direction = { x: dx / screenLength, y: dy / screenLength }
  const color = resolveDimensionColor(dimension, settings)
  const textSize = dimension.style.textSize ?? 13
  const label = formatDimension(geometry.length, settings)
  const marker = (tipX: number, tipY: number, sign: number) => {
    const baseX = tipX + direction.x * sign * 8
    const baseY = tipY + direction.y * sign * 8
    return `${tipX},${tipY} ${baseX - direction.y * 2.7},${baseY + direction.x * 2.7} ${baseX + direction.y * 2.7},${baseY - direction.x * 2.7}`
  }

  return (
    <g className={`dimension-entity${preview ? ' is-preview' : ''}`} pointerEvents="none">
      {selected && <line x1={start.x} y1={start.y} x2={end.x} y2={end.y} className="selection-highlight" />}
      <g stroke={color} strokeWidth="1.2" strokeLinecap="round" fill="none">
        <line x1={a.x} y1={a.y} x2={start.x} y2={start.y} />
        <line x1={b.x} y1={b.y} x2={end.x} y2={end.y} />
        <line x1={start.x} y1={start.y} x2={end.x} y2={end.y} />
      </g>
      <g fill={color}>
        <polygon points={marker(start.x, start.y, 1)} />
        <polygon points={marker(end.x, end.y, -1)} />
      </g>
      <text
        x={center.x}
        y={center.y - 7}
        textAnchor="middle"
        fontSize={textSize}
        fontWeight="600"
        fill={color}
        transform={`rotate(${geometry.rotation} ${center.x} ${center.y})`}
      >
        {label}
      </text>
    </g>
  )
}
