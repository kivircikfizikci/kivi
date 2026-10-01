import type { Point } from '../drawing/geometry/Point.ts'
import type { SnapCandidate } from '../drawing/snap/types.ts'
import type { Tool } from './Tool.ts'

export interface MirrorSnapshot {
  phase: 'waitingFirst' | 'choosingSecond' | 'ready'
  axisA: Point | null
  axisB: Point | null
  pointer: Point | null
  snap: SnapCandidate | null
  keepOriginal: boolean
}

export class MirrorTool implements Tool {
  readonly id = 'mirror' as const
  private snapshot: MirrorSnapshot = initial()
  private readonly listeners = new Set<() => void>()
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => this.listeners.delete(listener) }
  getSnapshot = () => this.snapshot
  activate() { this.set(initial()) }
  deactivate() { this.set(initial()) }
  placeFirst(point: Point, snap: SnapCandidate | null) {
    if (this.snapshot.phase !== 'waitingFirst') return
    this.set({ ...this.snapshot, phase: 'choosingSecond', axisA: { ...point }, pointer: { ...point }, snap })
  }
  updatePointer(point: Point, snap: SnapCandidate | null) {
    if (this.snapshot.phase !== 'waitingFirst' && this.snapshot.phase !== 'choosingSecond') return
    this.set({ ...this.snapshot, pointer: { ...point }, snap })
  }
  placeSecond(point: Point, snap: SnapCandidate | null) {
    if (this.snapshot.phase !== 'choosingSecond' || !this.snapshot.axisA) return false
    if (Math.hypot(point.x - this.snapshot.axisA.x, point.y - this.snapshot.axisA.y) <= Number.EPSILON) return false
    this.set({ ...this.snapshot, phase: 'ready', axisB: { ...point }, pointer: { ...point }, snap })
    return true
  }
  setKeepOriginal(keepOriginal: boolean) { this.set({ ...this.snapshot, keepOriginal }) }
  back() { if (this.snapshot.phase === 'ready') this.set({ ...this.snapshot, phase: 'choosingSecond', axisB: null }) }
  confirm() { return this.snapshot.phase === 'ready' && this.snapshot.axisA && this.snapshot.axisB ? { axisA: { ...this.snapshot.axisA }, axisB: { ...this.snapshot.axisB }, keepOriginal: this.snapshot.keepOriginal } : null }
  private set(snapshot: MirrorSnapshot) { this.snapshot = snapshot; this.listeners.forEach((listener) => listener()) }
}

function initial(): MirrorSnapshot { return { phase: 'waitingFirst', axisA: null, axisB: null, pointer: null, snap: null, keepOriginal: true } }
