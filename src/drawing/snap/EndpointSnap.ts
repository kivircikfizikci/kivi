import type { SnapCandidate, SnapContext } from './types.ts'
import { distance } from '../geometry/distance.ts'
import { rectangleCorners } from '../geometry/rectangle.ts'
import { pointOnCircle } from '../geometry/arc.ts'

export function findEndpointSnap(context: SnapContext): SnapCandidate | null {
  let best: SnapCandidate | null = null

  for (const entity of context.entities) {
    const points = entity.type === 'line'
      ? [entity.start, entity.end]
      : entity.type === 'rectangle'
        ? rectangleCorners(entity)
        : entity.type === 'arc'
          ? [pointOnCircle(entity.center, entity.radius, entity.startAngle), pointOnCircle(entity.center, entity.radius, entity.endAngle)]
          : []
    for (const point of points) {
      const distancePixels = distance(context.pointer, point) * context.zoom
      if (distancePixels <= context.settings.pixelTolerance && (!best || distancePixels < best.distancePixels)) {
        best = { kind: 'endpoint', point, distancePixels, entityId: entity.id }
      }
    }
  }

  return best
}
