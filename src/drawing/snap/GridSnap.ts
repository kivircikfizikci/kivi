import type { SnapCandidate, SnapContext } from './types.ts'
import { distance } from '../geometry/distance.ts'

export function findGridSnap(context: SnapContext): SnapCandidate | null {
  const spacing = context.settings.gridSpacing
  if (!Number.isFinite(spacing) || spacing <= 0) return null

  const point = {
    x: Math.round(context.pointer.x / spacing) * spacing,
    y: Math.round(context.pointer.y / spacing) * spacing,
  }
  const distancePixels = distance(context.pointer, point) * context.zoom
  return distancePixels <= context.settings.pixelTolerance
    ? { kind: 'grid', point, distancePixels }
    : null
}
