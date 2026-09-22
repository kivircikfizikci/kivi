import type { Point } from './Point.ts'

export function distance(a: Point, b: Point) {
  return Math.hypot(b.x - a.x, b.y - a.y)
}

export function squaredDistance(a: Point, b: Point) {
  const x = b.x - a.x
  const y = b.y - a.y
  return x * x + y * y
}
