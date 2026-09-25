import { createCircleEntity, type CircleEntity } from '../drawing/entities/CircleEntity.ts'
import type { LineStyle } from '../drawing/entities/LineEntity.ts'
import type { Point } from '../drawing/geometry/Point.ts'
import { distance } from '../drawing/geometry/distance.ts'
import { normalize, pointAlong, vector, type Vector } from '../drawing/geometry/Vector.ts'
import type { SnapCandidate } from '../drawing/snap/types.ts'
import type { Tool } from './Tool.ts'

export type CircleInputMode = 'radius' | 'diameter'
export type CircleToolPhase = 'inactive' | 'placing' | 'value'
export interface CircleToolSnapshot {
  phase: CircleToolPhase
  center: Point | null
  edge: Point | null
  valueInput: string
  inputMode: CircleInputMode
  preview: CircleEntity | null
  snap: SnapCandidate | null
  canConfirm: boolean
}
const initial = (phase: CircleToolPhase): CircleToolSnapshot => ({ phase, center: null, edge: null, valueInput: '', inputMode: 'radius', preview: null, snap: null, canConfirm: false })

export class CircleTool implements Tool {
  readonly id = 'circle' as const
  private snapshot = initial('inactive')
  private direction: Vector = { x: 1, y: 0 }
  private readonly listeners = new Set<() => void>()
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => this.listeners.delete(listener) }
  getSnapshot = () => this.snapshot
  activate() { this.setSnapshot(initial('placing')) }
  deactivate() { this.setSnapshot(initial('inactive')) }

  updatePointer(point: Point, snap: SnapCandidate | null, style: LineStyle) {
    if (this.snapshot.phase !== 'placing' || !this.snapshot.center) return
    const radius = distance(this.snapshot.center, point)
    if (radius <= Number.EPSILON) return
    this.direction = normalize(vector(this.snapshot.center, point)) ?? this.direction
    this.setSnapshot({ ...this.snapshot, edge: { ...point }, snap, preview: previewCircle(this.snapshot.center, radius, style) })
  }

  placePoint(point: Point, snap: SnapCandidate | null, style: LineStyle) {
    if (this.snapshot.phase !== 'placing') return
    if (!this.snapshot.center) {
      this.setSnapshot({ ...this.snapshot, center: { ...point }, edge: { ...point }, snap })
      return
    }
    const radius = distance(this.snapshot.center, point)
    if (radius <= Number.EPSILON) return
    this.direction = normalize(vector(this.snapshot.center, point)) ?? this.direction
    this.setSnapshot({ ...this.snapshot, phase: 'value', edge: { ...point }, valueInput: formatNumber(radius), preview: previewCircle(this.snapshot.center, radius, style), snap, canConfirm: true })
  }

  updateValue(valueInput: string, style: LineStyle) {
    if (this.snapshot.phase !== 'value' || !this.snapshot.center) return
    const entered = parsePositive(valueInput)
    const radius = entered ? (this.snapshot.inputMode === 'diameter' ? entered / 2 : entered) : null
    this.setSnapshot({ ...this.snapshot, valueInput, edge: radius ? pointAlong(this.snapshot.center, this.direction, radius) : this.snapshot.edge, preview: radius ? previewCircle(this.snapshot.center, radius, style) : this.snapshot.preview, canConfirm: radius !== null })
  }

  setInputMode(inputMode: CircleInputMode, style: LineStyle) {
    if (inputMode === this.snapshot.inputMode) return
    const entered = parsePositive(this.snapshot.valueInput)
    const nextValue = entered ? (inputMode === 'diameter' ? entered * 2 : entered / 2) : null
    this.setSnapshot({ ...this.snapshot, inputMode, valueInput: nextValue ? formatNumber(nextValue) : this.snapshot.valueInput })
    if (nextValue) this.updateValue(formatNumber(nextValue), style)
  }

  back() { if (this.snapshot.phase === 'value') this.setSnapshot({ ...this.snapshot, phase: 'placing', valueInput: '', canConfirm: false }) }

  confirm(style: LineStyle) {
    if (!this.snapshot.center || !this.snapshot.canConfirm) return null
    const entered = parsePositive(this.snapshot.valueInput)
    const radius = entered ? (this.snapshot.inputMode === 'diameter' ? entered / 2 : entered) : null
    if (!radius) return null
    const circle = createCircleEntity(this.snapshot.center, radius, style)
    this.setSnapshot(initial('placing'))
    return circle
  }

  private setSnapshot(snapshot: CircleToolSnapshot) { this.snapshot = snapshot; this.listeners.forEach((listener) => listener()) }
}
function previewCircle(center: Point, radius: number, style: LineStyle): CircleEntity { return { id: 'preview-circle', type: 'circle', center: { ...center }, radius, style } }
function parsePositive(value: string) { const parsed = Number(value.replace(',', '.')); return Number.isFinite(parsed) && parsed > 0 ? parsed : null }
function formatNumber(value: number) { return String(Math.round(value * 10) / 10) }
