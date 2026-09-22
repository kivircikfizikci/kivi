import { snapPointToAngles } from '../geometry/angle.ts'
import type { SnapCandidate, SnapContext } from './types.ts'

export function findAngleSnap(context: SnapContext): SnapCandidate | null {
  if (!context.angleOrigin) return null
  const result = snapPointToAngles(
    context.angleOrigin,
    context.pointer,
    context.settings.angles,
    context.settings.angleThresholdDegrees,
  )
  return result ? { kind: 'angle', point: result.point, distancePixels: 0, angle: result.angle } : null
}
