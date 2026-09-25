import { createArcEntity, type ArcEntity } from '../drawing/entities/ArcEntity.ts'
import type { LineStyle } from '../drawing/entities/LineEntity.ts'
import { angleFromCenter, pointOnCircle, shortestArcDirection } from '../drawing/geometry/arc.ts'
import { distance } from '../drawing/geometry/distance.ts'
import type { Point } from '../drawing/geometry/Point.ts'
import type { SnapCandidate } from '../drawing/snap/types.ts'
import type { Tool } from './Tool.ts'

export type ArcToolPhase = 'inactive' | 'center' | 'start' | 'end'
export interface ArcToolSnapshot {
  phase: ArcToolPhase
  center: Point | null
  start: Point | null
  end: Point | null
  preview: ArcEntity | null
  snap: SnapCandidate | null
}
const initial = (phase: ArcToolPhase): ArcToolSnapshot => ({ phase, center: null, start: null, end: null, preview: null, snap: null })

export class ArcTool implements Tool {
  readonly id = 'arc' as const
  private snapshot = initial('inactive')
  private readonly listeners = new Set<() => void>()
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => this.listeners.delete(listener) }
  getSnapshot = () => this.snapshot
  activate() { this.setSnapshot(initial('center')) }
  deactivate() { this.setSnapshot(initial('inactive')) }

  updatePointer(point: Point, snap: SnapCandidate | null, style: LineStyle) {
    if (this.snapshot.phase === 'center') {
      this.setSnapshot({ ...this.snapshot, snap })
      return
    }
    if (!this.snapshot.center) return
    if (this.snapshot.phase === 'start') {
      this.setSnapshot({ ...this.snapshot, start: { ...point }, end: { ...point }, snap })
      return
    }
    if (!this.snapshot.start) return
    const radius = distance(this.snapshot.center, this.snapshot.start)
    const end = pointOnCircle(this.snapshot.center, radius, angleFromCenter(this.snapshot.center, point))
    this.setSnapshot({ ...this.snapshot, end, snap, preview: makePreview(this.snapshot.center, this.snapshot.start, end, style) })
  }

  placePoint(point: Point, snap: SnapCandidate | null, style: LineStyle): ArcEntity | null {
    if (this.snapshot.phase === 'center') {
      this.setSnapshot({ ...this.snapshot, phase: 'start', center: { ...point }, snap })
      return null
    }
    if (this.snapshot.phase === 'start' && this.snapshot.center) {
      if (distance(this.snapshot.center, point) <= Number.EPSILON) return null
      this.setSnapshot({ ...this.snapshot, phase: 'end', start: { ...point }, end: { ...point }, snap })
      return null
    }
    if (this.snapshot.phase !== 'end' || !this.snapshot.center || !this.snapshot.start) return null
    const radius = distance(this.snapshot.center, this.snapshot.start)
    const end = pointOnCircle(this.snapshot.center, radius, angleFromCenter(this.snapshot.center, point))
    const arc = makePreview(this.snapshot.center, this.snapshot.start, end, style)
    if (!arc || Math.abs(arc.startAngle - arc.endAngle) < 1e-7) return null
    this.setSnapshot(initial('center'))
    return createArcEntity(arc.center, arc.radius, arc.startAngle, arc.endAngle, arc.direction, arc.style)
  }

  private setSnapshot(snapshot: ArcToolSnapshot) { this.snapshot = snapshot; this.listeners.forEach((listener) => listener()) }
}

function makePreview(center: Point, start: Point, end: Point, style: LineStyle): ArcEntity {
  const startAngle = angleFromCenter(center, start)
  const endAngle = angleFromCenter(center, end)
  return { id: 'preview-arc', type: 'arc', center: { ...center }, radius: distance(center, start), startAngle, endAngle, direction: shortestArcDirection(startAngle, endAngle), style, layerId: 'default' }
}
