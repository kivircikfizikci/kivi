import type { Camera } from '../camera/Camera.ts'
import { worldToScreen, type ViewportSize } from '../camera/coordinateTransforms.ts'

interface GridRendererProps {
  camera: Camera
  viewport: ViewportSize
  spacing: number
  color: string
}

export function GridRenderer({ camera, viewport, spacing, color }: GridRendererProps) {
  const visualSpacing = getVisualSpacing(spacing, camera.zoom)
  const spacingPixels = visualSpacing * camera.zoom
  const origin = worldToScreen({ x: 0, y: 0 }, camera, viewport)
  const x = modulo(origin.x, spacingPixels)
  const y = modulo(origin.y, spacingPixels)

  return (
    <defs>
      <pattern id="drawing-grid" x={x} y={y} width={spacingPixels} height={spacingPixels} patternUnits="userSpaceOnUse">
        <path d={`M ${spacingPixels} 0 L 0 0 0 ${spacingPixels}`} fill="none" stroke={color} strokeOpacity="0.58" strokeWidth="1" />
      </pattern>
    </defs>
  )
}

function getVisualSpacing(baseSpacing: number, zoom: number) {
  const minimumPixels = 22
  const steps = [1, 2, 5]
  let stepIndex = 0
  let decade = 0
  let multiplier = steps[stepIndex]!
  while (baseSpacing * multiplier * zoom < minimumPixels) {
    stepIndex += 1
    if (stepIndex === steps.length) {
      stepIndex = 0
      decade += 1
    }
    multiplier = steps[stepIndex]! * 10 ** decade
  }
  return baseSpacing * multiplier
}

function modulo(value: number, divisor: number) {
  return ((value % divisor) + divisor) % divisor
}
