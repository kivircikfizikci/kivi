import type { SnapCandidate, SnapContext } from './types.ts'
import { distance } from '../geometry/distance.ts'
import { rectangleEdges } from '../geometry/rectangle.ts'
import { arcSweep, pointOnCircle } from '../geometry/arc.ts'

export function findMidpointSnap(context: SnapContext): SnapCandidate | null {
  let best: SnapCandidate | null = null

  for (const entity of context.entities) {
    const points = entity.type === 'line'
      ? [{ x: (entity.start.x + entity.end.x) / 2, y: (entity.start.y + entity.end.y) / 2 }]
      : entity.type === 'rectangle'
        ? rectangleEdges(entity).map((edge) => ({ x: (edge.start.x + edge.end.x) / 2, y: (edge.start.y + edge.end.y) / 2 }))
        : entity.type === 'circle'
          ? [entity.center]
          : entity.type === 'arc'
            ? [entity.center, pointOnCircle(entity.center, entity.radius, entity.direction === 'ccw' ? entity.startAngle + arcSweep(entity.startAngle, entity.endAngle, entity.direction) / 2 : entity.startAngle - arcSweep(entity.startAngle, entity.endAngle, entity.direction) / 2)]
            : []
    for (const point of points) {
      const distancePixels = distance(context.pointer, point) * context.zoom
      if (distancePixels <= context.settings.pixelTolerance && (!best || distancePixels < best.distancePixels)) {
        best = { kind: 'midpoint', point, distancePixels, entityId: entity.id }
      }
    }
  }

  return best
}
