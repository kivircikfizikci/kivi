import type { Project } from '../types/project.ts'
import { createDrawingExportModel } from './DrawingExportModel.ts'
import { downloadBlob, exportFilename } from './download.ts'
import { createDrawingSvg } from './svgExport.ts'

export async function exportProjectPng(project: Project) {
  const rendered = createDrawingSvg(createDrawingExportModel(project))
  const source = new Blob([rendered.svg], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(source)
  try {
    const image = await loadImage(url)
    const canvas = document.createElement('canvas')
    canvas.width = rendered.width
    canvas.height = rendered.height
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Canvas is unavailable')
    context.drawImage(image, 0, 0, rendered.width, rendered.height)
    const png = await new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('PNG export failed')), 'image/png'))
    downloadBlob(png, exportFilename(project.name, 'png'))
  } finally {
    URL.revokeObjectURL(url)
  }
}

function loadImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Drawing image could not be rendered'))
    image.src = url
  })
}
