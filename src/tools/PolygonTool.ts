import { createPolygonEntity, MAX_POLYGON_SIDES, MIN_POLYGON_SIDES, validPolygonSides, type PolygonEntity } from '../drawing/entities/PolygonEntity.ts'
import type { LineStyle } from '../drawing/entities/LineEntity.ts'
import { angleDegrees } from '../drawing/geometry/angle.ts'
import { distance } from '../drawing/geometry/distance.ts'
import type { Point } from '../drawing/geometry/Point.ts'
import type { SnapCandidate } from '../drawing/snap/types.ts'
import type { Tool } from './Tool.ts'

export type PolygonToolPhase = 'inactive' | 'placing' | 'parameters'
export interface PolygonToolSnapshot {
  phase: PolygonToolPhase
  center: Point | null
  vertex: Point | null
  sidesInput: string
  radiusInput: string
  rotation: number
  preview: PolygonEntity | null
  snap: SnapCandidate | null
  canConfirm: boolean
}

export class PolygonTool implements Tool {
  readonly id = 'polygon' as const
  private lastSides = 6
  private snapshot = this.initial('inactive')
  private readonly listeners = new Set<() => void>()
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => this.listeners.delete(listener) }
  getSnapshot = () => this.snapshot
  activate() { this.set(this.initial('placing')) }
  deactivate() { this.set(this.initial('inactive')) }

  updatePointer(point: Point, snap: SnapCandidate | null, style: LineStyle) {
    if (this.snapshot.phase !== 'placing') return
    if (!this.snapshot.center) {
      this.set({ ...this.snapshot, vertex: { ...point }, snap })
      return
    }
    const radius = distance(this.snapshot.center, point)
    if (radius <= Number.EPSILON) return
    const rotation = angleDegrees(this.snapshot.center, point)
    this.set({ ...this.snapshot, vertex: { ...point }, rotation, snap, preview: previewPolygon(this.snapshot.center, radius, this.lastSides, rotation, style) })
  }

  placePoint(point: Point, snap: SnapCandidate | null, style: LineStyle) {
    if (this.snapshot.phase !== 'placing') return
    if (!this.snapshot.center) {
      this.set({ ...this.snapshot, center: { ...point }, vertex: { ...point }, snap })
      return
    }
    const radius = distance(this.snapshot.center, point)
    if (radius <= Number.EPSILON) return
    const rotation = angleDegrees(this.snapshot.center, point)
    this.set({ ...this.snapshot, phase: 'parameters', vertex: { ...point }, rotation, sidesInput: String(this.lastSides), radiusInput: formatNumber(radius), preview: previewPolygon(this.snapshot.center, radius, this.lastSides, rotation, style), snap, canConfirm: true })
  }

  updateParameters(sidesInput: string, radiusInput: string, style: LineStyle) {
    if (this.snapshot.phase !== 'parameters' || !this.snapshot.center) return
    const sides = parseSides(sidesInput)
    const radius = parseRadius(radiusInput)
    this.set({ ...this.snapshot, sidesInput, radiusInput, preview: sides && radius ? previewPolygon(this.snapshot.center, radius, sides, this.snapshot.rotation, style) : this.snapshot.preview, canConfirm: sides !== null && radius !== null })
  }

  back() { if (this.snapshot.phase === 'parameters') this.set({ ...this.snapshot, phase: 'placing', sidesInput: '', radiusInput: '', canConfirm: false }) }

  confirm(style: LineStyle) {
    if (!this.snapshot.center || !this.snapshot.canConfirm) return null
    const sides = parseSides(this.snapshot.sidesInput)
    const radius = parseRadius(this.snapshot.radiusInput)
    if (!sides || !radius) return null
    this.lastSides = sides
    const polygon = createPolygonEntity(this.snapshot.center, radius, sides, this.snapshot.rotation, style)
    this.set(this.initial('placing'))
    return polygon
  }

  private initial(phase: PolygonToolPhase): PolygonToolSnapshot { return { phase, center: null, vertex: null, sidesInput: '', radiusInput: '', rotation: 0, preview: null, snap: null, canConfirm: false } }
  private set(snapshot: PolygonToolSnapshot) { this.snapshot = snapshot; this.listeners.forEach((listener) => listener()) }
}

function previewPolygon(center: Point, radius: number, sides: number, rotation: number, style: LineStyle): PolygonEntity {
  return { id: 'preview-polygon', type: 'polygon', center: { ...center }, radius, sides, rotation, style, layerId: 'default' }
}
function parseSides(value: string) { const parsed = Number(value); return validPolygonSides(parsed) ? parsed : null }
function parseRadius(value: string) { const parsed = Number(value.replace(',', '.')); return Number.isFinite(parsed) && parsed > 0 ? parsed : null }
function formatNumber(value: number) { return String(Math.round(value * 10) / 10) }
export { MIN_POLYGON_SIDES, MAX_POLYGON_SIDES }
