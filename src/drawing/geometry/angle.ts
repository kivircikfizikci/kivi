import type { Point } from './Point.ts'
import { distance } from './distance.ts'

export const DEFAULT_SNAP_ANGLES = [0, 15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165, 180, 195, 210, 225, 240, 255, 270, 285, 300, 315, 330, 345] as const

export function snapAnglesForIncrement(increment: number): number[] {
  const safeIncrement = Number.isFinite(increment) && increment >= 1 && increment <= 90 ? increment : 15
  const angles: number[] = []
  for (let angle = 0; angle < 360; angle += safeIncrement) angles.push(angle)
  return angles
}

export function angleDegrees(origin: Point, target: Point) {
  const degrees = Math.atan2(target.y - origin.y, target.x - origin.x) * 180 / Math.PI
  return (degrees + 360) % 360
}

export function angularDistance(a: number, b: number) {
  const difference = Math.abs(((a - b + 180) % 360) - 180)
  return Math.abs(difference)
}

export function pointAtAngle(origin: Point, length: number, degrees: number): Point {
  const radians = degrees * Math.PI / 180
  return {
    x: origin.x + Math.cos(radians) * length,
    y: origin.y + Math.sin(radians) * length,
  }
}

export function snapPointToAngles(
  origin: Point,
  target: Point,
  angles: readonly number[] = DEFAULT_SNAP_ANGLES,
  thresholdDegrees = 7,
) {
  const targetAngle = angleDegrees(origin, target)
  const snappedAngle = angles.reduce((best, candidate) =>
    angularDistance(candidate, targetAngle) < angularDistance(best, targetAngle) ? candidate : best,
  )

  if (angularDistance(snappedAngle, targetAngle) > thresholdDegrees) return null
  return { point: pointAtAngle(origin, distance(origin, target), snappedAngle), angle: snappedAngle }
}
