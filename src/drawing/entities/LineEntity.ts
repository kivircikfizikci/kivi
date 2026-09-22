import type { Point } from '../geometry/Point.ts'

export interface LineStyle {
  color: string
  width: number
}

export interface LineEntity {
  id: string
  type: 'line'
  start: Point
  end: Point
  style: LineStyle
}

export function createLineEntity(start: Point, end: Point, style: LineStyle): LineEntity {
  return {
    id: globalThis.crypto.randomUUID(),
    type: 'line',
    start: { ...start },
    end: { ...end },
    style: { ...style },
  }
}
