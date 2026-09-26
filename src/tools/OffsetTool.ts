import type { Point } from '../drawing/geometry/Point.ts'
import type { Tool } from './Tool.ts'

export type OffsetPhase = 'inactive' | 'selecting' | 'choosingSide' | 'distance'
export interface OffsetToolSnapshot {
  phase: OffsetPhase
  sourceId: string | null
  pointer: Point | null
  distanceInput: string
  canConfirm: boolean
}

export class OffsetTool implements Tool {
  readonly id = 'offset' as const
  private snapshot: OffsetToolSnapshot = initial('inactive')
  private readonly listeners = new Set<() => void>()
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => this.listeners.delete(listener) }
  getSnapshot = () => this.snapshot
  activate() { this.set(initial('selecting')) }
  deactivate() { this.set(initial('inactive')) }
  setSource(sourceId: string) {
    if (this.snapshot.phase !== 'selecting') return
    this.set({ ...this.snapshot, phase: 'choosingSide', sourceId })
  }
  updatePointer(pointer: Point) {
    if (this.snapshot.phase !== 'choosingSide') return
    this.set({ ...this.snapshot, pointer: { ...pointer } })
  }
  chooseSide(distance: number) {
    if (this.snapshot.phase !== 'choosingSide' || !this.snapshot.sourceId || !this.snapshot.pointer) return false
    const valid = Number.isFinite(distance) && distance > 0
    this.set({ ...this.snapshot, phase: 'distance', distanceInput: valid ? formatNumber(distance) : '', canConfirm: valid })
    return true
  }
  updateDistance(value: string) {
    if (this.snapshot.phase !== 'distance') return
    const distance = parseDistance(value)
    this.set({ ...this.snapshot, distanceInput: value, canConfirm: distance !== null })
  }
  back() {
    if (this.snapshot.phase !== 'distance') return
    this.set({ ...this.snapshot, phase: 'choosingSide', distanceInput: '', canConfirm: false })
  }
  confirmDistance() {
    return this.snapshot.phase === 'distance' && this.snapshot.canConfirm ? parseDistance(this.snapshot.distanceInput) : null
  }
  private set(snapshot: OffsetToolSnapshot) { this.snapshot = snapshot; this.listeners.forEach((listener) => listener()) }
}

function initial(phase: OffsetPhase): OffsetToolSnapshot { return { phase, sourceId: null, pointer: null, distanceInput: '', canConfirm: false } }
function parseDistance(value: string) { const parsed = Number(value.replace(',', '.')); return Number.isFinite(parsed) && parsed > 0 ? parsed : null }
function formatNumber(value: number) { return Number(value.toFixed(4)).toString() }
