import type { Point } from '../drawing/geometry/Point.ts'
import { distance } from '../drawing/geometry/distance.ts'
import { normalize, vector } from '../drawing/geometry/Vector.ts'
import type { SnapCandidate } from '../drawing/snap/types.ts'
import type { Tool, ToolId } from './Tool.ts'

export type TranslationPhase = 'waitingBase' | 'choosingDestination' | 'distance'
export interface TranslationSnapshot { phase: TranslationPhase; base: Point | null; pointer: Point | null; delta: Point; snap: SnapCandidate | null; distanceInput: string; canConfirm: boolean }

export class TranslationTool implements Tool {
  readonly id: ToolId
  private snapshot: TranslationSnapshot = initial()
  private readonly listeners = new Set<() => void>()
  constructor(id: 'move' | 'copy') { this.id = id }
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => this.listeners.delete(listener) }
  getSnapshot = () => this.snapshot
  activate() { this.set(initial()) }
  deactivate() { this.set(initial()) }
  placeBase(point: Point, snap: SnapCandidate | null) {
    if (this.snapshot.phase !== 'waitingBase') return
    this.set({ ...this.snapshot, phase: 'choosingDestination', base: { ...point }, pointer: { ...point }, snap })
  }
  updatePointer(point: Point, snap: SnapCandidate | null) {
    if (this.snapshot.phase === 'waitingBase') {
      this.set({ ...this.snapshot, pointer: { ...point }, snap })
      return
    }
    if (this.snapshot.phase !== 'choosingDestination' || !this.snapshot.base) return
    this.set({ ...this.snapshot, pointer: { ...point }, delta: vector(this.snapshot.base, point), snap })
  }
  chooseDestination(point: Point, snap: SnapCandidate | null) {
    if (this.snapshot.phase !== 'choosingDestination' || !this.snapshot.base) return false
    const length = distance(this.snapshot.base, point)
    if (length <= Number.EPSILON) return false
    this.set({ ...this.snapshot, phase: 'distance', pointer: { ...point }, delta: vector(this.snapshot.base, point), snap, distanceInput: formatNumber(length), canConfirm: true })
    return true
  }
  updateDistance(value: string) {
    if (this.snapshot.phase !== 'distance') return
    const parsed = Number(value.replace(',', '.'))
    const direction = normalize(this.snapshot.delta)
    const valid = direction && Number.isFinite(parsed) && parsed > 0
    this.set({ ...this.snapshot, distanceInput: value, canConfirm: Boolean(valid), delta: valid ? { x: direction.x * parsed, y: direction.y * parsed } : this.snapshot.delta })
  }
  back() { if (this.snapshot.phase === 'distance') this.set({ ...this.snapshot, phase: 'choosingDestination', distanceInput: '', canConfirm: false }) }
  confirm() { return this.snapshot.phase === 'distance' && this.snapshot.canConfirm ? { ...this.snapshot.delta } : null }
  private set(snapshot: TranslationSnapshot) { this.snapshot = snapshot; this.listeners.forEach((listener) => listener()) }
}

function initial(): TranslationSnapshot { return { phase: 'waitingBase', base: null, pointer: null, delta: { x: 0, y: 0 }, snap: null, distanceInput: '', canConfirm: false } }
function formatNumber(value: number) { return String(Math.round(value * 100) / 100) }
