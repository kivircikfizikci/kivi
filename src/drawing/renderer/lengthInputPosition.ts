import type { Point } from '../geometry/Point.ts'
import type { ViewportSize } from '../camera/coordinateTransforms.ts'

export interface FloatingPanelSize {
  width: number
  height: number
}

const DEFAULT_PANEL = { width: 252, height: 118 }
const EDGE_PADDING = 10
const ANCHOR_GAP = 14

export function positionLengthInput(
  endpoint: Point,
  viewport: ViewportSize,
  panel: FloatingPanelSize = DEFAULT_PANEL,
): Point {
  const preferredX = endpoint.x + ANCHOR_GAP
  const preferredY = endpoint.y + ANCHOR_GAP
  const x = preferredX + panel.width <= viewport.width - EDGE_PADDING
    ? preferredX
    : endpoint.x - panel.width - ANCHOR_GAP
  const y = preferredY + panel.height <= viewport.height - EDGE_PADDING
    ? preferredY
    : endpoint.y - panel.height - ANCHOR_GAP

  return {
    x: clamp(x, EDGE_PADDING, Math.max(EDGE_PADDING, viewport.width - panel.width - EDGE_PADDING)),
    y: clamp(y, EDGE_PADDING, Math.max(EDGE_PADDING, viewport.height - panel.height - EDGE_PADDING)),
  }
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum)
}
