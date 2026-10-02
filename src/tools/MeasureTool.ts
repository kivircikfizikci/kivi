import type { Entity } from '../drawing/entities/Entity.ts'
import type { Point } from '../drawing/geometry/Point.ts'
import { nearestEntityMeasureSegment } from '../drawing/geometry/measure.ts'
import type { LineSegment } from '../drawing/geometry/intersections.ts'
import type { SnapCandidate } from '../drawing/snap/types.ts'
import type { Tool } from './Tool.ts'

export interface MeasureEntitySelection { entityId: string; segment: LineSegment | null }
export interface MeasureToolSnapshot {
  phase: 'inactive' | 'ready'
  firstEntity: MeasureEntitySelection | null
  secondEntity: MeasureEntitySelection | null
  firstPoint: Point | null
  secondPoint: Point | null
  snap: SnapCandidate | null
}

const initial = (phase: MeasureToolSnapshot['phase']): MeasureToolSnapshot => ({ phase, firstEntity: null, secondEntity: null, firstPoint: null, secondPoint: null, snap: null })

export class MeasureTool implements Tool {
  readonly id = 'measure' as const
  private snapshot = initial('inactive')
  private readonly listeners = new Set<() => void>()
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => this.listeners.delete(listener) }
  getSnapshot = () => this.snapshot
  activate() { this.set(initial('ready')) }
  deactivate() { this.set(initial('inactive')) }
  clear() { this.set(initial(this.snapshot.phase)) }

  updatePointer(snap: SnapCandidate | null) {
    if (this.snapshot.phase !== 'ready') return
    this.set({ ...this.snapshot, snap })
  }

  selectEntity(entity: Entity, pointer: Point) {
    if (this.snapshot.phase !== 'ready' || entity.type === 'dimension') return
    const selection = { entityId: entity.id, segment: nearestEntityMeasureSegment(entity, pointer) }
    const first = this.snapshot.firstEntity
    if (first?.segment && selection.segment && !sameSegment(first.segment, selection.segment)) {
      this.set({ ...initial('ready'), firstEntity: first, secondEntity: selection })
    } else {
      this.set({ ...initial('ready'), firstEntity: selection })
    }
  }

  selectPoint(point: Point, snap: SnapCandidate | null) {
    if (this.snapshot.phase !== 'ready') return
    if (!this.snapshot.firstPoint || this.snapshot.secondPoint || this.snapshot.firstEntity) {
      this.set({ ...initial('ready'), firstPoint: { ...point }, snap })
    } else {
      this.set({ ...this.snapshot, secondPoint: { ...point }, snap })
    }
  }

  private set(snapshot: MeasureToolSnapshot) { this.snapshot = snapshot; this.listeners.forEach((listener) => listener()) }
}

function sameSegment(a: LineSegment, b: LineSegment) {
  const sameDirection = samePoint(a.start, b.start) && samePoint(a.end, b.end)
  const reverseDirection = samePoint(a.start, b.end) && samePoint(a.end, b.start)
  return sameDirection || reverseDirection
}

function samePoint(a: Point, b: Point) {
  return Math.hypot(a.x - b.x, a.y - b.y) <= 1e-8
}
