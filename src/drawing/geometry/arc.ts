import type { ArcDirection, ArcEntity } from '../entities/ArcEntity.ts'
import type { Point } from './Point.ts'

export function angleFromCenter(center: Point, point: Point) {
  return normalizeDegrees(Math.atan2(point.y - center.y, point.x - center.x) * 180 / Math.PI)
}

export function pointOnCircle(center: Point, radius: number, angle: number): Point {
  const radians = angle * Math.PI / 180
  return { x: center.x + radius * Math.cos(radians), y: center.y + radius * Math.sin(radians) }
}

export function arcSweep(startAngle: number, endAngle: number, direction: ArcDirection) {
  const counterClockwise = normalizeDegrees(endAngle - startAngle)
  return direction === 'ccw' ? counterClockwise : normalizeDegrees(startAngle - endAngle)
}

export function shortestArcDirection(startAngle: number, endAngle: number): ArcDirection {
  return normalizeDegrees(endAngle - startAngle) <= 180 ? 'ccw' : 'cw'
}

export function angleIsOnArc(angle: number, arc: Pick<ArcEntity, 'startAngle' | 'endAngle' | 'direction'>, toleranceDegrees = 0) {
  const sweep = arcSweep(arc.startAngle, arc.endAngle, arc.direction)
  const fromStart = arc.direction === 'ccw'
    ? normalizeDegrees(angle - arc.startAngle)
    : normalizeDegrees(arc.startAngle - angle)
  return fromStart <= sweep + toleranceDegrees || 360 - fromStart <= toleranceDegrees
}

export function arcToSvgPath(
  arc: Pick<ArcEntity, 'center' | 'radius' | 'startAngle' | 'endAngle' | 'direction'>,
  mapPoint: (point: Point) => Point = (point) => point,
  radiusScale = 1,
  yAxisDown = false,
) {
  const start = mapPoint(pointOnCircle(arc.center, arc.radius, arc.startAngle))
  const end = mapPoint(pointOnCircle(arc.center, arc.radius, arc.endAngle))
  const sweep = arcSweep(arc.startAngle, arc.endAngle, arc.direction)
  const largeArc = sweep > 180 ? 1 : 0
  const sweepFlag = yAxisDown
    ? (arc.direction === 'cw' ? 1 : 0)
    : (arc.direction === 'ccw' ? 1 : 0)
  return `M ${start.x} ${start.y} A ${arc.radius * radiusScale} ${arc.radius * radiusScale} 0 ${largeArc} ${sweepFlag} ${end.x} ${end.y}`
}

export function normalizeDegrees(angle: number) {
  return ((angle % 360) + 360) % 360
}
