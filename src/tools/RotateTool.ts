import type { Point } from '../drawing/geometry/Point.ts'
import { angleFromCenter } from '../drawing/geometry/arc.ts'
import type { SnapCandidate } from '../drawing/snap/types.ts'
import type { Tool } from './Tool.ts'

export interface RotateSnapshot {
  phase: 'waitingPivot' | 'choosingAngle' | 'angle'
  pivot: Point | null
  pointer: Point | null
  snap: SnapCandidate | null
  angle: number
  angleInput: string
  canConfirm: boolean
}

export class RotateTool implements Tool {
  readonly id = 'rotate' as const
  private snapshot: RotateSnapshot = initial()
  private readonly listeners = new Set<() => void>()
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => this.listeners.delete(listener) }
  getSnapshot = () => this.snapshot
  activate() { this.set(initial()) }
  deactivate() { this.set(initial()) }
  placePivot(point: Point, snap: SnapCandidate | null) {
    if (this.snapshot.phase !== 'waitingPivot') return
    this.set({ ...this.snapshot, phase: 'choosingAngle', pivot: { ...point }, pointer: { ...point }, snap })
  }
  updatePointer(point: Point, snap: SnapCandidate | null) {
    if (this.snapshot.phase !== 'choosingAngle' || !this.snapshot.pivot) return
    const angle = signedAngle(angleFromCenter(this.snapshot.pivot, point))
    this.set({ ...this.snapshot, pointer: { ...point }, snap, angle, angleInput: formatNumber(angle), canConfirm: Math.hypot(point.x - this.snapshot.pivot.x, point.y - this.snapshot.pivot.y) > Number.EPSILON })
  }
  chooseAngle(point: Point, snap: SnapCandidate | null) {
    if (this.snapshot.phase !== 'choosingAngle' || !this.snapshot.pivot) return false
    const distance = Math.hypot(point.x - this.snapshot.pivot.x, point.y - this.snapshot.pivot.y)
    if (distance <= Number.EPSILON) return false
    const angle = signedAngle(angleFromCenter(this.snapshot.pivot, point))
    this.set({ ...this.snapshot, phase: 'angle', pointer: { ...point }, snap, angle, angleInput: formatNumber(angle), canConfirm: true })
    return true
  }
  updateAngle(value: string) {
    if (this.snapshot.phase !== 'angle') return
    const angle = Number(value.replace(',', '.'))
    this.set({ ...this.snapshot, angleInput: value, angle: Number.isFinite(angle) ? angle : this.snapshot.angle, canConfirm: Number.isFinite(angle) })
  }
  back() { if (this.snapshot.phase === 'angle') this.set({ ...this.snapshot, phase: 'choosingAngle', canConfirm: Boolean(this.snapshot.pointer) }) }
  confirm() { return this.snapshot.phase === 'angle' && this.snapshot.pivot && this.snapshot.canConfirm ? { pivot: { ...this.snapshot.pivot }, angle: this.snapshot.angle } : null }
  private set(snapshot: RotateSnapshot) { this.snapshot = snapshot; this.listeners.forEach((listener) => listener()) }
}

function initial(): RotateSnapshot { return { phase: 'waitingPivot', pivot: null, pointer: null, snap: null, angle: 0, angleInput: '', canConfirm: false } }
function signedAngle(angle: number) { return angle > 180 ? angle - 360 : angle }
function formatNumber(value: number) { return String(Math.round(value * 100) / 100) }
