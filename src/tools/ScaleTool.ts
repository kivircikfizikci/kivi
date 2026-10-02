import type { Point } from '../drawing/geometry/Point.ts'
import type { SnapCandidate } from '../drawing/snap/types.ts'
import type { Tool } from './Tool.ts'

export interface ScaleSnapshot { phase: 'waitingPivot' | 'choosingFactor' | 'factor'; pivot: Point | null; pointer: Point | null; snap: SnapCandidate | null; factor: number; factorInput: string; canConfirm: boolean }

export class ScaleTool implements Tool {
  readonly id = 'scale' as const
  private snapshot: ScaleSnapshot = initial()
  private readonly listeners = new Set<() => void>()
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => this.listeners.delete(listener) }
  getSnapshot = () => this.snapshot
  activate() { this.set(initial()) }
  deactivate() { this.set(initial()) }
  placePivot(point: Point, snap: SnapCandidate | null) { if (this.snapshot.phase === 'waitingPivot') this.set({ ...this.snapshot, phase: 'choosingFactor', pivot: { ...point }, pointer: { x: point.x + 100, y: point.y }, snap }) }
  updatePointer(point: Point, snap: SnapCandidate | null) {
    if (this.snapshot.phase !== 'choosingFactor' || !this.snapshot.pivot) return
    const factor = Math.max(0.01, Math.hypot(point.x - this.snapshot.pivot.x, point.y - this.snapshot.pivot.y) / 100)
    this.set({ ...this.snapshot, pointer: { ...point }, snap, factor, factorInput: format(factor), canConfirm: true })
  }
  chooseFactor(point: Point, snap: SnapCandidate | null) { if (this.snapshot.phase !== 'choosingFactor') return; this.updatePointer(point, snap); this.set({ ...this.snapshot, phase: 'factor' }) }
  updateFactor(value: string) { const factor = Number(value.replace(',', '.')); this.set({ ...this.snapshot, factorInput: value, factor: validScaleFactor(factor) ? factor : this.snapshot.factor, canConfirm: validScaleFactor(factor) }) }
  back() { if (this.snapshot.phase === 'factor') this.set({ ...this.snapshot, phase: 'choosingFactor' }) }
  confirm() { return this.snapshot.pivot && this.snapshot.canConfirm && validScaleFactor(this.snapshot.factor) ? { pivot: { ...this.snapshot.pivot }, factor: this.snapshot.factor } : null }
  private set(snapshot: ScaleSnapshot) { this.snapshot = snapshot; this.listeners.forEach((listener) => listener()) }
}

export function validScaleFactor(value: number) { return Number.isFinite(value) && value > 0 }
function initial(): ScaleSnapshot { return { phase: 'waitingPivot', pivot: null, pointer: null, snap: null, factor: 1, factorInput: '1', canConfirm: false } }
function format(value: number) { return String(Math.round(value * 100) / 100) }
