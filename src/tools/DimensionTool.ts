import type { LineEntity } from '../drawing/entities/LineEntity.ts'
import { createEntityDimension, createPointDimension, type DimensionEntity, type DimensionSource } from '../drawing/entities/DimensionEntity.ts'
import type { Point } from '../drawing/geometry/Point.ts'
import { dimensionPlacement, type MeasuredSegment } from '../drawing/geometry/dimension.ts'
import { distance } from '../drawing/geometry/distance.ts'
import type { SnapCandidate } from '../drawing/snap/types.ts'
import type { Tool } from './Tool.ts'

export type DimensionToolPhase = 'waitingFirst' | 'waitingSecond' | 'positioning'

export interface DimensionToolSnapshot {
  phase: DimensionToolPhase
  source: DimensionSource | null
  segment: MeasuredSegment | null
  firstPoint: Point | null
  secondPoint: Point | null
  snap: SnapCandidate | null
  preview: DimensionEntity | null
}

export class DimensionTool implements Tool {
  readonly id = 'dimension' as const
  private snapshot: DimensionToolSnapshot = initialSnapshot()
  private readonly listeners = new Set<() => void>()

  subscribe = (listener: () => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  getSnapshot = () => this.snapshot

  activate() { this.reset() }
  deactivate() { this.reset() }

  begin(line: LineEntity | null, point: Point, snap: SnapCandidate | null) {
    if (this.snapshot.phase !== 'waitingFirst') return
    if (line) {
      this.setSnapshot({ ...initialSnapshot(), phase: 'positioning', source: { type: 'entity', targetEntityId: line.id }, segment: { start: line.start, end: line.end } })
    } else {
      this.setSnapshot({ ...initialSnapshot(), phase: 'waitingSecond', firstPoint: { ...point }, secondPoint: { ...point }, snap })
    }
  }

  chooseTarget(line: LineEntity) {
    this.begin(line, line.start, null)
  }

  updateSecondPoint(point: Point, snap: SnapCandidate | null) {
    if (this.snapshot.phase !== 'waitingSecond') return
    this.setSnapshot({ ...this.snapshot, secondPoint: { ...point }, snap })
  }

  chooseSecondPoint(point: Point, snap: SnapCandidate | null) {
    if (this.snapshot.phase !== 'waitingSecond' || !this.snapshot.firstPoint) return false
    if (distance(this.snapshot.firstPoint, point) <= Number.EPSILON) return false
    const source = { type: 'points' as const, start: { ...this.snapshot.firstPoint }, end: { ...point } }
    this.setSnapshot({ ...this.snapshot, phase: 'positioning', source, segment: source, secondPoint: { ...point }, snap, preview: null })
    return true
  }

  position(pointer: Point, minimumOffset: number) {
    const { segment, source } = this.snapshot
    if (this.snapshot.phase !== 'positioning' || !segment || !source) return
    const placement = dimensionPlacement(segment, pointer, minimumOffset)
    if (!placement) return
    this.setSnapshot({
      ...this.snapshot,
      preview: { id: 'preview-dimension', type: 'dimension', source, ...placement, style: {}, layerId: 'dimensions' },
    })
  }

  place(): DimensionEntity | null {
    const preview = this.snapshot.preview
    if (!preview) return null
    const committed = preview.source.type === 'entity'
      ? createEntityDimension(preview.source.targetEntityId, preview.offset, preview.side)
      : createPointDimension(preview.source.start, preview.source.end, preview.offset, preview.side)
    this.reset()
    return committed
  }

  private reset() { this.setSnapshot(initialSnapshot()) }

  private setSnapshot(snapshot: DimensionToolSnapshot) {
    this.snapshot = snapshot
    this.listeners.forEach((listener) => listener())
  }
}

function initialSnapshot(): DimensionToolSnapshot {
  return { phase: 'waitingFirst', source: null, segment: null, firstPoint: null, secondPoint: null, snap: null, preview: null }
}
