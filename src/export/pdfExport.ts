import type { Project } from '../types/project.ts'
import { createDrawingExportModel, type DrawingExportModel } from './DrawingExportModel.ts'
import { downloadBlob, exportFilename } from './download.ts'

const A4_PORTRAIT = { width: 595.28, height: 841.89 }
const A4_LANDSCAPE = { width: A4_PORTRAIT.height, height: A4_PORTRAIT.width }
const MARGIN = 36

export function createDrawingPdf(model: DrawingExportModel) {
  const page = model.bounds.width > model.bounds.height ? A4_LANDSCAPE : A4_PORTRAIT
  const scale = Math.min(
    (page.width - MARGIN * 2) / model.bounds.width,
    (page.height - MARGIN * 2) / model.bounds.height,
  )
  const x = (value: number) => MARGIN + value * scale
  // PDF pages use +Y up; export space uses +Y down, so this is the sole PDF inversion.
  const y = (value: number) => page.height - MARGIN - value * scale
  const commands: string[] = []

  for (const stroke of model.strokes) {
    commands.push(`${rgb(stroke.color)} RG`, `${n(Math.max(0.5, stroke.width * scale))} w`, `${n(x(stroke.start.x))} ${n(y(stroke.start.y))} m ${n(x(stroke.end.x))} ${n(y(stroke.end.y))} l S`)
  }
  for (const polygon of model.polygons) {
    if (polygon.points.length < 3) continue
    commands.push(`${rgb(polygon.color)} rg`)
    commands.push(`${n(x(polygon.points[0]!.x))} ${n(y(polygon.points[0]!.y))} m`)
    polygon.points.slice(1).forEach((point) => commands.push(`${n(x(point.x))} ${n(y(point.y))} l`))
    commands.push('h f')
  }
  for (const label of model.labels) {
    const radians = -label.rotation * Math.PI / 180
    const cosine = Math.cos(radians)
    const sine = Math.sin(radians)
    const fontSize = Math.max(8, label.size * scale)
    const textOffset = -estimateHelveticaWidth(label.text, fontSize) / 2
    const anchorX = x(label.position.x) + cosine * textOffset
    const anchorY = y(label.position.y) + sine * textOffset
    commands.push(
      'BT',
      `/F1 ${n(fontSize)} Tf`,
      `${rgb(label.color)} rg`,
      `${rgb(label.outlineColor)} RG`,
      '2 Tr',
      `${n(Math.max(1, scale * 1.5))} w`,
      `${n(cosine)} ${n(sine)} ${n(-sine)} ${n(cosine)} ${n(anchorX)} ${n(anchorY)} Tm`,
      `(${escapePdf(label.text)}) Tj`,
      'ET',
    )
  }

  return assemblePdf(page.width, page.height, commands.join('\n'))
}

function estimateHelveticaWidth(value: string, fontSize: number) {
  return value.length * fontSize * 0.53
}

export function exportProjectPdf(project: Project) {
  const bytes = createDrawingPdf(createDrawingExportModel(project))
  downloadBlob(new Blob([bytes], { type: 'application/pdf' }), exportFilename(project.name, 'pdf'))
}

function assemblePdf(width: number, height: number, content: string) {
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${n(width)} ${n(height)}] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${new TextEncoder().encode(content).length} >>\nstream\n${content}\nendstream`,
  ]
  let pdf = '%PDF-1.4\n'
  const offsets = [0]
  for (let index = 0; index < objects.length; index += 1) {
    offsets.push(new TextEncoder().encode(pdf).length)
    pdf += `${index + 1} 0 obj\n${objects[index]}\nendobj\n`
  }
  const xrefOffset = new TextEncoder().encode(pdf).length
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  pdf += offsets.slice(1).map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`).join('')
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`
  return new TextEncoder().encode(pdf)
}

function rgb(color: string) {
  const hex = color.replace('#', '')
  if (!/^[\da-f]{6}$/i.test(hex)) return '0 0 0'
  return [hex.slice(0, 2), hex.slice(2, 4), hex.slice(4, 6)]
    .map((value) => n(parseInt(value, 16) / 255))
    .join(' ')
}

function escapePdf(value: string) {
  return value.replace(/[^\x20-\x7e]/g, '?').replace(/([\\()])/g, '\\$1')
}

function n(value: number) {
  return Number(value.toFixed(4))
}
