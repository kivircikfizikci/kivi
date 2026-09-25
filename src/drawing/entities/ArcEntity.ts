import type { Point } from '../geometry/Point.ts'
import type { LineStyle } from './LineEntity.ts'

export type ArcDirection = 'cw' | 'ccw'

export interface ArcEntity {
  id: string
  type: 'arc'
  center: Point
  radius: number
  /** World-space degrees: 0° is +X and positive angles turn counter-clockwise. */
  startAngle: number
  endAngle: number
  direction: ArcDirection
  style: LineStyle
}

export function createArcEntity(
  center: Point,
  radius: number,
  startAngle: number,
  endAngle: number,
  direction: ArcDirection,
  style: LineStyle,
): ArcEntity {
  return {
    id: globalThis.crypto.randomUUID(),
    type: 'arc',
    center: { ...center },
    radius,
    startAngle: normalizeAngle(startAngle),
    endAngle: normalizeAngle(endAngle),
    direction,
    style: { ...style },
  }
}

export function normalizeAngle(angle: number) {
  return ((angle % 360) + 360) % 360
}
