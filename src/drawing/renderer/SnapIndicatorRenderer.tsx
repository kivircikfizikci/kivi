import type { Camera } from '../camera/Camera.ts'
import { worldToScreen, type ViewportSize } from '../camera/coordinateTransforms.ts'
import type { SnapCandidate } from '../snap/types.ts'

interface SnapIndicatorRendererProps {
  snap: SnapCandidate | null
  camera: Camera
  viewport: ViewportSize
}

export function SnapIndicatorRenderer({ snap, camera, viewport }: SnapIndicatorRendererProps) {
  if (!snap) return null
  const point = worldToScreen(snap.point, camera, viewport)
  const common = { className: `snap-indicator snap-${snap.kind}`, pointerEvents: 'none' as const }

  if (snap.kind === 'endpoint') {
    return <rect x={point.x - 5} y={point.y - 5} width="10" height="10" {...common} />
  }
  if (snap.kind === 'midpoint') {
    return <path d={`M ${point.x} ${point.y - 6} L ${point.x + 6} ${point.y} L ${point.x} ${point.y + 6} L ${point.x - 6} ${point.y} Z`} {...common} />
  }
  return (
    <path d={`M ${point.x - 6} ${point.y} H ${point.x + 6} M ${point.x} ${point.y - 6} V ${point.y + 6}`} {...common} />
  )
}
