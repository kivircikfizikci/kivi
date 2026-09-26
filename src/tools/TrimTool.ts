import type { TrimPlan } from '../drawing/geometry/trim.ts'
import type { Tool } from './Tool.ts'

export interface TrimToolSnapshot { active: boolean; candidate: TrimPlan | null }

export class TrimTool implements Tool {
  readonly id = 'trim' as const
  private snapshot: TrimToolSnapshot = { active: false, candidate: null }
  private readonly listeners = new Set<() => void>()
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => this.listeners.delete(listener) }
  getSnapshot = () => this.snapshot
  activate() { this.set({ active: true, candidate: null }) }
  deactivate() { this.set({ active: false, candidate: null }) }
  updateCandidate(candidate: TrimPlan | null) {
    if (!this.snapshot.active) return
    this.set({ ...this.snapshot, candidate })
  }
  private set(snapshot: TrimToolSnapshot) { this.snapshot = snapshot; this.listeners.forEach((listener) => listener()) }
}
