import type { LineExtendPlan } from '../drawing/geometry/extend.ts'
import type { Tool } from './Tool.ts'

export interface ExtendSnapshot { candidate: LineExtendPlan | null }

export class ExtendTool implements Tool {
  readonly id = 'extend' as const
  private snapshot: ExtendSnapshot = { candidate: null }
  private readonly listeners = new Set<() => void>()
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => this.listeners.delete(listener) }
  getSnapshot = () => this.snapshot
  activate() { this.updateCandidate(null) }
  deactivate() { this.updateCandidate(null) }
  updateCandidate(candidate: LineExtendPlan | null) {
    this.snapshot = { candidate }
    this.listeners.forEach((listener) => listener())
  }
}
