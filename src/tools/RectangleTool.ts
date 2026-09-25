import { createRectangleEntity, type RectangleEntity } from '../drawing/entities/RectangleEntity.ts'
import type { LineStyle } from '../drawing/entities/LineEntity.ts'
import type { Point } from '../drawing/geometry/Point.ts'
import type { SnapCandidate } from '../drawing/snap/types.ts'
import type { Tool } from './Tool.ts'

export type RectangleToolPhase = 'inactive' | 'placing' | 'size'

export interface RectangleToolSnapshot {
  phase: RectangleToolPhase
  start: Point | null
  pointer: Point | null
  widthInput: string
  heightInput: string
  signX: 1 | -1
  signY: 1 | -1
  preview: RectangleEntity | null
  snap: SnapCandidate | null
  canConfirm: boolean
}

const initial = (phase: RectangleToolPhase): RectangleToolSnapshot => ({
  phase, start: null, pointer: null, widthInput: '', heightInput: '', signX: 1, signY: 1,
  preview: null, snap: null, canConfirm: false,
})

export class RectangleTool implements Tool {
  readonly id = 'rectangle' as const
  private snapshot = initial('inactive')
  private readonly listeners = new Set<() => void>()

  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => this.listeners.delete(listener) }
  getSnapshot = () => this.snapshot
  activate() { this.setSnapshot(initial('placing')) }
  deactivate() { this.setSnapshot(initial('inactive')) }

  updatePointer(point: Point, snap: SnapCandidate | null, style: LineStyle) {
    if (this.snapshot.phase !== 'placing' || !this.snapshot.start) return
    this.setSnapshot({ ...this.snapshot, pointer: { ...point }, snap, preview: rectangleFromCorners(this.snapshot.start, point, style) })
  }

  placePoint(point: Point, snap: SnapCandidate | null, style: LineStyle) {
    if (this.snapshot.phase !== 'placing') return
    if (!this.snapshot.start) {
      this.setSnapshot({ ...this.snapshot, start: { ...point }, pointer: { ...point }, snap })
      return
    }
    const width = Math.abs(point.x - this.snapshot.start.x)
    const height = Math.abs(point.y - this.snapshot.start.y)
    if (width <= Number.EPSILON || height <= Number.EPSILON) return
    const signX = point.x < this.snapshot.start.x ? -1 : 1
    const signY = point.y < this.snapshot.start.y ? -1 : 1
    this.setSnapshot({
      ...this.snapshot, phase: 'size', pointer: { ...point }, snap, signX, signY,
      widthInput: formatNumber(width), heightInput: formatNumber(height),
      preview: rectangleFromValues(this.snapshot.start, width, height, signX, signY, style), canConfirm: true,
    })
  }

  updateSize(widthInput: string, heightInput: string, style: LineStyle) {
    if (this.snapshot.phase !== 'size' || !this.snapshot.start) return
    const width = parsePositive(widthInput)
    const height = parsePositive(heightInput)
    this.setSnapshot({
      ...this.snapshot, widthInput, heightInput,
      preview: width && height ? rectangleFromValues(this.snapshot.start, width, height, this.snapshot.signX, this.snapshot.signY, style) : this.snapshot.preview,
      canConfirm: width !== null && height !== null,
    })
  }

  back() {
    if (this.snapshot.phase !== 'size') return
    this.setSnapshot({ ...this.snapshot, phase: 'placing', widthInput: '', heightInput: '', canConfirm: false })
  }

  confirm(style: LineStyle) {
    if (!this.snapshot.canConfirm || !this.snapshot.start) return null
    const width = parsePositive(this.snapshot.widthInput)
    const height = parsePositive(this.snapshot.heightInput)
    if (!width || !height) return null
    const rectangle = rectangleFromValues(this.snapshot.start, width, height, this.snapshot.signX, this.snapshot.signY, style)
    this.setSnapshot(initial('placing'))
    return createRectangleEntity(rectangle.origin, rectangle.width, rectangle.height, rectangle.style)
  }

  private setSnapshot(snapshot: RectangleToolSnapshot) { this.snapshot = snapshot; this.listeners.forEach((listener) => listener()) }
}

function rectangleFromCorners(start: Point, end: Point, style: LineStyle): RectangleEntity {
  return { id: 'preview-rectangle', type: 'rectangle', origin: { x: Math.min(start.x, end.x), y: Math.min(start.y, end.y) }, width: Math.abs(end.x - start.x), height: Math.abs(end.y - start.y), style }
}

function rectangleFromValues(start: Point, width: number, height: number, signX: 1 | -1, signY: 1 | -1, style: LineStyle): RectangleEntity {
  return { id: 'preview-rectangle', type: 'rectangle', origin: { x: signX > 0 ? start.x : start.x - width, y: signY > 0 ? start.y : start.y - height }, width, height, style }
}

function parsePositive(value: string) { const parsed = Number(value.replace(',', '.')); return Number.isFinite(parsed) && parsed > 0 ? parsed : null }
function formatNumber(value: number) { return String(Math.round(value * 10) / 10) }
