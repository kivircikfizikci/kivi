import type { DrawingExportModel } from './DrawingExportModel.ts'
import { arcSweep } from '../drawing/geometry/arc.ts'

export interface SvgExport {
  svg: string
  width: number
  height: number
}

export function createDrawingSvg(model: DrawingExportModel, maxDimension = 2400): SvgExport {
  const { bounds } = model
  const aspect = bounds.width / bounds.height
  const width = Math.max(1, Math.round(aspect >= 1 ? maxDimension : maxDimension * aspect))
  const height = Math.max(1, Math.round(aspect >= 1 ? maxDimension / aspect : maxDimension))
  const strokes = model.strokes.map((stroke) => `<line x1="${n(stroke.start.x)}" y1="${n(stroke.start.y)}" x2="${n(stroke.end.x)}" y2="${n(stroke.end.y)}" stroke="${escapeXml(stroke.color)}" stroke-width="${n(stroke.width)}" stroke-linecap="round"/>`).join('')
  const polygons = model.polygons.map((polygon) => `<polygon points="${polygon.points.map((point) => `${n(point.x)},${n(point.y)}`).join(' ')}" fill="${escapeXml(polygon.color)}"/>`).join('')
  const rectangles = model.rectangles.map((rectangle) => `<rect x="${n(rectangle.origin.x)}" y="${n(rectangle.origin.y)}" width="${n(rectangle.width)}" height="${n(rectangle.height)}" fill="none" stroke="${escapeXml(rectangle.color)}" stroke-width="${n(rectangle.strokeWidth)}"/>`).join('')
  const circles = model.circles.map((circle) => `<circle cx="${n(circle.center.x)}" cy="${n(circle.center.y)}" r="${n(circle.radius)}" fill="none" stroke="${escapeXml(circle.color)}" stroke-width="${n(circle.strokeWidth)}"/>`).join('')
  const arcs = model.arcs.map((arc) => {
    const start = exportArcPoint(arc, arc.startAngle)
    const end = exportArcPoint(arc, arc.endAngle)
    const largeArc = arcSweep(arc.startAngle, arc.endAngle, arc.direction) > 180 ? 1 : 0
    const sweepFlag = arc.direction === 'cw' ? 1 : 0
    return `<path d="M ${n(start.x)} ${n(start.y)} A ${n(arc.radius)} ${n(arc.radius)} 0 ${largeArc} ${sweepFlag} ${n(end.x)} ${n(end.y)}" fill="none" stroke="${escapeXml(arc.color)}" stroke-width="${n(arc.strokeWidth)}" stroke-linecap="round"/>`
  }).join('')
  const labels = model.labels.map((label) => `<text x="${n(label.position.x)}" y="${n(label.position.y)}" text-anchor="middle" font-family="Arial,sans-serif" font-size="${n(label.size)}" font-weight="600" fill="${escapeXml(label.color)}" transform="rotate(${n(label.rotation)} ${n(label.position.x)} ${n(label.position.y)})">${escapeXml(label.text)}</text>`).join('')

  return {
    width,
    height,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${n(bounds.width)} ${n(bounds.height)}">${strokes}${polygons}${rectangles}${circles}${arcs}${labels}</svg>`,
  }
}

function exportArcPoint(arc: DrawingExportModel['arcs'][number], angle: number) {
  const radians = angle * Math.PI / 180
  return { x: arc.center.x + arc.radius * Math.cos(radians), y: arc.center.y - arc.radius * Math.sin(radians) }
}

function n(value: number) {
  return Number(value.toFixed(4))
}

function escapeXml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[character]!)
}
