import type { LineStyle } from '../drawing/entities/LineEntity.ts'
import { createLineEntity, type LineEntity } from '../drawing/entities/LineEntity.ts'
import type { Point } from '../drawing/geometry/Point.ts'
import { distance } from '../drawing/geometry/distance.ts'
import { normalize, pointAlong, vector, type Vector } from '../drawing/geometry/Vector.ts'
import type { SnapCandidate } from '../drawing/snap/types.ts'
import type { Tool } from './Tool.ts'

export type LineToolPhase = 'inactive' | 'placing' | 'length'

export interface LineToolSnapshot {
  phase: LineToolPhase
  start: Point | null
  end: Point | null
  snap: SnapCandidate | null
  lengthInput: string
  exactLength: number | null
  canConfirm: boolean
}

const INITIAL_SNAPSHOT: LineToolSnapshot = {
  phase: 'inactive',
  start: null,
  end: null,
  snap: null,
  lengthInput: '',
  exactLength: null,
  canConfirm: false,
}

export class LineTool implements Tool {
  readonly id = 'line' as const
  private snapshot: LineToolSnapshot = INITIAL_SNAPSHOT
  private direction: Vector | null = null
  private readonly listeners = new Set<() => void>()

  subscribe = (listener: () => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  getSnapshot = () => this.snapshot

  activate() {
    this.direction = null
    this.setSnapshot({ ...INITIAL_SNAPSHOT, phase: 'placing' })
  }

  deactivate() {
    this.direction = null
    this.setSnapshot(INITIAL_SNAPSHOT)
  }

  updatePointer(point: Point, snap: SnapCandidate | null) {
    if (this.snapshot.phase !== 'placing') return
    this.setSnapshot({ ...this.snapshot, end: { ...point }, snap })
  }

  placePoint(point: Point, snap: SnapCandidate | null) {
    if (this.snapshot.phase !== 'placing') return

    if (!this.snapshot.start) {
      this.setSnapshot({ ...this.snapshot, start: { ...point }, end: { ...point }, snap })
      return
    }

    const direction = normalize(vector(this.snapshot.start, point))
    if (!direction) return

    const initialLength = distance(this.snapshot.start, point)
    this.direction = direction
    this.setSnapshot({
      ...this.snapshot,
      phase: 'length',
      end: { ...point },
      snap,
      lengthInput: formatLength(initialLength),
      exactLength: initialLength,
      canConfirm: initialLength > 0,
    })
  }

  updateLength(value: string) {
    if (this.snapshot.phase !== 'length' || !this.snapshot.start || !this.direction) return
    const parsed = Number(value.replace(',', '.'))
    const validLength = Number.isFinite(parsed) && parsed > 0 ? parsed : null
    const end = validLength ? pointAlong(this.snapshot.start, this.direction, validLength) : this.snapshot.end
    const snap = this.snapshot.snap?.kind === 'angle' && end
      ? { ...this.snapshot.snap, point: end }
      : null
    this.setSnapshot({
      ...this.snapshot,
      lengthInput: value,
      exactLength: validLength,
      end,
      snap,
      canConfirm: validLength !== null,
    })
  }

  back() {
    if (this.snapshot.phase !== 'length') return
    this.direction = null
    this.setSnapshot({
      ...this.snapshot,
      phase: 'placing',
      lengthInput: '',
      exactLength: null,
      canConfirm: false,
    })
  }

  confirm(style: LineStyle): LineEntity | null {
    if (
      this.snapshot.phase !== 'length' ||
      !this.snapshot.start ||
      !this.snapshot.end ||
      !this.snapshot.canConfirm
    ) return null

    const line = createLineEntity(this.snapshot.start, this.snapshot.end, style)
    const nextStart = { ...this.snapshot.end }
    this.direction = null
    this.setSnapshot({
      phase: 'placing',
      start: nextStart,
      end: nextStart,
      snap: null,
      lengthInput: '',
      exactLength: null,
      canConfirm: false,
    })
    return line
  }

  private setSnapshot(snapshot: LineToolSnapshot) {
    this.snapshot = snapshot
    this.listeners.forEach((listener) => listener())
  }
}

function formatLength(value: number) {
  return String(Math.round(value * 10) / 10)
}
