export interface Point {
  x: number
  y: number
}

export function pointsEqual(a: Point, b: Point, epsilon = 1e-9) {
  return Math.abs(a.x - b.x) <= epsilon && Math.abs(a.y - b.y) <= epsilon
}
