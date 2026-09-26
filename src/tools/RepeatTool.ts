import type { Point } from '../drawing/geometry/Point.ts'
import { distance } from '../drawing/geometry/distance.ts'
import { normalize, vector } from '../drawing/geometry/Vector.ts'
import { validRepeatCount } from '../drawing/geometry/entityTransforms.ts'
import type { SnapCandidate } from '../drawing/snap/types.ts'
import type { Tool } from './Tool.ts'

export interface RepeatSnapshot { phase: 'direction' | 'parameters'; origin: Point | null; pointer: Point | null; direction: Point | null; snap: SnapCandidate | null; spacingInput: string; copiesInput: string; canConfirm: boolean }
export class RepeatTool implements Tool {
  readonly id = 'repeat' as const
  private snapshot: RepeatSnapshot = initial()
  private readonly listeners = new Set<() => void>()
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => this.listeners.delete(listener) }
  getSnapshot = () => this.snapshot
  activate() { this.set(initial()) }
  deactivate() { this.set(initial()) }
  setOrigin(origin: Point) { if (!this.snapshot.origin) this.set({ ...this.snapshot, origin: { ...origin } }) }
  updatePointer(point: Point, snap: SnapCandidate | null) {
    if (this.snapshot.phase !== 'direction' || !this.snapshot.origin) return
    this.set({ ...this.snapshot, pointer: { ...point }, direction: normalize(vector(this.snapshot.origin, point)), snap })
  }
  chooseDirection(point: Point, snap: SnapCandidate | null) {
    if (this.snapshot.phase !== 'direction' || !this.snapshot.origin) return false
    const direction = normalize(vector(this.snapshot.origin, point))
    if (!direction) return false
    this.set({ ...this.snapshot, phase: 'parameters', pointer: { ...point }, direction, snap, spacingInput: formatNumber(distance(this.snapshot.origin, point)), copiesInput: '1', canConfirm: true })
    return true
  }
  updateParameters(spacingInput: string, copiesInput: string) {
    const spacing = Number(spacingInput.replace(',', '.'))
    const copies = Number(copiesInput)
    this.set({ ...this.snapshot, spacingInput, copiesInput, canConfirm: Boolean(this.snapshot.direction && Number.isFinite(spacing) && spacing > 0 && validRepeatCount(copies)) })
  }
  confirm() {
    const spacing = Number(this.snapshot.spacingInput.replace(',', '.'))
    const copies = Number(this.snapshot.copiesInput)
    return this.snapshot.phase === 'parameters' && this.snapshot.direction && this.snapshot.canConfirm ? { direction: this.snapshot.direction, spacing, copies } : null
  }
  private set(snapshot: RepeatSnapshot) { this.snapshot = snapshot; this.listeners.forEach((listener) => listener()) }
}
function initial(): RepeatSnapshot { return { phase: 'direction', origin: null, pointer: null, direction: null, snap: null, spacingInput: '', copiesInput: '1', canConfirm: false } }
function formatNumber(value: number) { return String(Math.round(value * 100) / 100) }
