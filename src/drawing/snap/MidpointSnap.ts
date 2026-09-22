import type { SnapCandidate, SnapContext } from './types.ts'
import { distance } from '../geometry/distance.ts'

export function findMidpointSnap(context: SnapContext): SnapCandidate | null {
  let best: SnapCandidate | null = null

  for (const entity of context.entities) {
    if (entity.type !== 'line') continue
    const point = {
      x: (entity.start.x + entity.end.x) / 2,
      y: (entity.start.y + entity.end.y) / 2,
    }
    const distancePixels = distance(context.pointer, point) * context.zoom
    if (distancePixels <= context.settings.pixelTolerance && (!best || distancePixels < best.distancePixels)) {
      best = { kind: 'midpoint', point, distancePixels, entityId: entity.id }
    }
  }

  return best
}
