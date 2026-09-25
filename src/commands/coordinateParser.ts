import type { Point } from '../drawing/geometry/Point.ts'

const COORDINATE_PATTERN = /^\s*([+-]?(?:\d+(?:\.\d+)?|\.\d+))\s*,\s*([+-]?(?:\d+(?:\.\d+)?|\.\d+))\s*$/

export function parseCoordinate(input: string): Point | null {
  const match = COORDINATE_PATTERN.exec(input)
  if (!match) return null
  const x = Number(match[1])
  const y = Number(match[2])
  return Number.isFinite(x) && Number.isFinite(y) ? { x, y } : null
}
