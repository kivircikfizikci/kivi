import type { Entity } from '../drawing/entities/Entity.ts'
import { inspectNearbyGeometry, type LiveMeasureInspection } from '../drawing/geometry/measure.ts'
import type { Point } from '../drawing/geometry/Point.ts'
import type { Tool } from './Tool.ts'

export interface MeasureToolSnapshot {
  phase: 'inactive' | 'ready'
  inspection: LiveMeasureInspection | null
  source: 'pointer' | 'tap' | null
}

const initial = (phase: MeasureToolSnapshot['phase']): MeasureToolSnapshot => ({ phase, inspection: null, source: null })

export class MeasureTool implements Tool {
  readonly id = 'measure' as const
  private snapshot = initial('inactive')
  private readonly listeners = new Set<() => void>()
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => this.listeners.delete(listener) }
  getSnapshot = () => this.snapshot
  activate() { this.set(initial('ready')) }
  deactivate() { this.set(initial('inactive')) }
  clear() { this.set(initial(this.snapshot.phase)) }

  inspect(anchor: Point, entities: readonly Entity[], zoom: number, radiusPixels: number, source: 'pointer' | 'tap') {
    if (this.snapshot.phase !== 'ready') return
    const previousKeys = this.snapshot.inspection?.candidates.map((candidate) => candidate.primitive.key) ?? []
    this.set({ phase: 'ready', inspection: inspectNearbyGeometry(anchor, entities, zoom, radiusPixels, previousKeys), source })
  }

  private set(snapshot: MeasureToolSnapshot) { this.snapshot = snapshot; this.listeners.forEach((listener) => listener()) }
}
