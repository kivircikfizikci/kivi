import type { TextEntity } from '../entities/TextEntity.ts'
import type { Point } from './Point.ts'

export interface TextLine { text: string; x: number; y: number }

export function wrapText(entity: Pick<TextEntity, 'text' | 'box' | 'style'>): TextLine[] {
  const charWidth = entity.style.fontSize * 0.6
  const maxCharacters = Math.max(1, Math.floor(entity.box.width / charWidth))
  const lines: string[] = []
  for (const paragraph of entity.text.split('\n')) {
    if (!paragraph) { lines.push(''); continue }
    const words = paragraph.split(/\s+/)
    let current = ''
    for (const word of words) {
      if (word.length > maxCharacters) {
        if (current) { lines.push(current); current = '' }
        for (let index = 0; index < word.length; index += maxCharacters) lines.push(word.slice(index, index + maxCharacters))
        continue
      }
      const candidate = current ? `${current} ${word}` : word
      if (candidate.length <= maxCharacters) current = candidate
      else { lines.push(current); current = word }
    }
    if (current) lines.push(current)
  }
  const lineHeight = entity.style.fontSize * entity.style.lineHeight
  return lines.map((text, index) => ({ text, x: textAnchorOffset(entity), y: entity.style.fontSize + index * lineHeight }))
    .filter((line) => line.y <= entity.box.height + entity.style.fontSize * 0.2)
}

export function textBoxCorners(entity: Pick<TextEntity, 'position' | 'box' | 'rotation'>): Point[] {
  const radians = entity.rotation * Math.PI / 180
  const cosine = Math.cos(radians)
  const sine = Math.sin(radians)
  return [{ x: 0, y: 0 }, { x: entity.box.width, y: 0 }, { x: entity.box.width, y: -entity.box.height }, { x: 0, y: -entity.box.height }]
    .map((point) => ({ x: entity.position.x + point.x * cosine - point.y * sine, y: entity.position.y + point.x * sine + point.y * cosine }))
}

export function pointInTextBox(point: Point, entity: Pick<TextEntity, 'position' | 'box' | 'rotation'>, tolerance = 0) {
  const local = textLocalPoint(point, entity)
  return local.x >= -tolerance && local.x <= entity.box.width + tolerance && local.y <= tolerance && local.y >= -entity.box.height - tolerance
}

export function textLocalPoint(point: Point, entity: Pick<TextEntity, 'position' | 'rotation'>) {
  const radians = -entity.rotation * Math.PI / 180
  const dx = point.x - entity.position.x
  const dy = point.y - entity.position.y
  return { x: dx * Math.cos(radians) - dy * Math.sin(radians), y: dx * Math.sin(radians) + dy * Math.cos(radians) }
}

export function resizeTextBox(entity: TextEntity, width: number, height: number): TextEntity {
  return { ...entity, box: { width: Math.max(10, width), height: Math.max(10, height) }, style: { ...entity.style } }
}

export function resizeTextBoxFromCorner(entity: TextEntity, corner: number, pointer: Point): TextEntity {
  const local = textLocalPoint(pointer, entity)
  const corners = [{ x: 0, y: 0 }, { x: entity.box.width, y: 0 }, { x: entity.box.width, y: -entity.box.height }, { x: 0, y: -entity.box.height }]
  const opposite = corners[(corner + 2) % 4]!
  const minX = Math.min(local.x, opposite.x)
  const maxX = Math.max(local.x, opposite.x)
  const minY = Math.min(local.y, opposite.y)
  const maxY = Math.max(local.y, opposite.y)
  const radians = entity.rotation * Math.PI / 180
  const position = {
    x: entity.position.x + minX * Math.cos(radians) - maxY * Math.sin(radians),
    y: entity.position.y + minX * Math.sin(radians) + maxY * Math.cos(radians),
  }
  return { ...resizeTextBox(entity, maxX - minX, maxY - minY), position }
}

function textAnchorOffset(entity: Pick<TextEntity, 'box' | 'style'>) {
  if (entity.style.textAlign === 'center') return entity.box.width / 2
  if (entity.style.textAlign === 'right') return entity.box.width
  return 0
}
