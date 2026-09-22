import type { SnapCandidate, SnapContext } from './types.ts'
import { distance } from '../geometry/distance.ts'

export function findEndpointSnap(context: SnapContext): SnapCandidate | null {
  let best: SnapCandidate | null = null

  for (const entity of context.entities) {
    if (entity.type !== 'line') continue
    for (const point of [entity.start, entity.end]) {
      const distancePixels = distance(context.pointer, point) * context.zoom
      if (distancePixels <= context.settings.pixelTolerance && (!best || distancePixels < best.distancePixels)) {
        best = { kind: 'endpoint', point, distancePixels, entityId: entity.id }
      }
    }
  }

  return best
}
