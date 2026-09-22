import type { DrawingExportModel } from './DrawingExportModel.ts'

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
  const grid = model.grid.enabled ? renderGrid(model) : ''
  const strokes = model.strokes.map((stroke) => `<line x1="${n(stroke.start.x)}" y1="${n(stroke.start.y)}" x2="${n(stroke.end.x)}" y2="${n(stroke.end.y)}" stroke="${escapeXml(stroke.color)}" stroke-width="${n(stroke.width)}" stroke-linecap="round"/>`).join('')
  const polygons = model.polygons.map((polygon) => `<polygon points="${polygon.points.map((point) => `${n(point.x)},${n(point.y)}`).join(' ')}" fill="${escapeXml(polygon.color)}"/>`).join('')
  const labels = model.labels.map((label) => `<text x="${n(label.position.x)}" y="${n(label.position.y)}" text-anchor="middle" font-family="Arial,sans-serif" font-size="${n(label.size)}" font-weight="600" fill="${escapeXml(label.color)}" stroke="${escapeXml(label.haloColor)}" stroke-width="4" stroke-linejoin="round" paint-order="stroke" transform="rotate(${n(label.rotation)} ${n(label.position.x)} ${n(label.position.y)})">${escapeXml(label.text)}</text>`).join('')

  return {
    width,
    height,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${n(bounds.minX)} ${n(bounds.minY)} ${n(bounds.width)} ${n(bounds.height)}"><rect x="${n(bounds.minX)}" y="${n(bounds.minY)}" width="${n(bounds.width)}" height="${n(bounds.height)}" fill="${escapeXml(model.backgroundColor)}"/>${grid}${strokes}${polygons}${labels}</svg>`,
  }
}

function renderGrid(model: DrawingExportModel) {
  const { bounds } = model
  const spacing = Math.max(model.grid.spacing, Number.EPSILON)
  const firstX = Math.ceil(bounds.minX / spacing) * spacing
  const firstY = Math.ceil(bounds.minY / spacing) * spacing
  const lines: string[] = []
  for (let x = firstX, count = 0; x <= bounds.maxX && count < 5000; x += spacing, count += 1) {
    lines.push(`<line x1="${n(x)}" y1="${n(bounds.minY)}" x2="${n(x)}" y2="${n(bounds.maxY)}"/>`)
  }
  for (let y = firstY, count = 0; y <= bounds.maxY && count < 5000; y += spacing, count += 1) {
    lines.push(`<line x1="${n(bounds.minX)}" y1="${n(y)}" x2="${n(bounds.maxX)}" y2="${n(y)}"/>`)
  }
  return `<g stroke="${escapeXml(model.grid.color)}" stroke-width="0.6" stroke-opacity="0.58">${lines.join('')}</g>`
}

function n(value: number) {
  return Number(value.toFixed(4))
}

function escapeXml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[character]!)
}
