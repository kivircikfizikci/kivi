import { findAngleSnap } from './AngleSnap.ts'
import { findEndpointSnap } from './EndpointSnap.ts'
import { findGridSnap } from './GridSnap.ts'
import { findMidpointSnap } from './MidpointSnap.ts'
import type { SnapCandidate, SnapContext } from './types.ts'

export class SnapManager {
  find(context: SnapContext): SnapCandidate | null {
    const orderedResolvers = [
      context.settings.endpoint && findEndpointSnap,
      context.settings.midpoint && findMidpointSnap,
      context.settings.grid && findGridSnap,
      context.settings.angle && findAngleSnap,
    ]

    for (const resolve of orderedResolvers) {
      if (!resolve) continue
      const candidate = resolve(context)
      if (candidate) return candidate
    }
    return null
  }

  resolve(context: SnapContext): { point: SnapCandidate['point']; snap: SnapCandidate | null } {
    const snap = this.find(context)
    return { point: snap?.point ?? context.pointer, snap }
  }
}
