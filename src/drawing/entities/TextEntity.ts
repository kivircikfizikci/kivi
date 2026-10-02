import type { Point } from '../geometry/Point.ts'

export type TextAlign = 'left' | 'center' | 'right'

export interface TextStyle {
  fontFamily: string
  fontSize: number
  color: string
  fontWeight: number
  italic: boolean
  underline: boolean
  strikeThrough: boolean
  textAlign: TextAlign
  lineHeight: number
}

export interface TextEntity {
  id: string
  type: 'text'
  position: Point
  box: { width: number; height: number }
  text: string
  style: TextStyle
  rotation: number
  layerId: string
}

export function createTextEntity(position: Point, text: string, style: TextStyle, layerId = 'default'): TextEntity {
  return {
    id: globalThis.crypto.randomUUID(),
    type: 'text',
    position: { ...position },
    box: { width: Math.max(80, style.fontSize * 8), height: Math.max(style.fontSize * style.lineHeight * 2, 36) },
    text,
    style: { ...style },
    rotation: 0,
    layerId,
  }
}

export function validTextEntity(entity: Pick<TextEntity, 'text' | 'box' | 'style'>) {
  return entity.text.trim().length > 0
    && entity.box.width > 0
    && entity.box.height > 0
    && Number.isFinite(entity.style.fontSize)
    && entity.style.fontSize > 0
}
