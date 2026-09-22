import type { Point } from './Point.ts'

export interface Vector {
  x: number
  y: number
}

export function vector(from: Point, to: Point): Vector {
  return { x: to.x - from.x, y: to.y - from.y }
}

export function magnitude(value: Vector) {
  return Math.hypot(value.x, value.y)
}

export function normalize(value: Vector): Vector | null {
  const length = magnitude(value)
  return length > Number.EPSILON ? { x: value.x / length, y: value.y / length } : null
}

export function pointAlong(origin: Point, direction: Vector, length: number): Point {
  return { x: origin.x + direction.x * length, y: origin.y + direction.y * length }
}
