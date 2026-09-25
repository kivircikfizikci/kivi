import type { LineEntity } from '../drawing/entities/LineEntity.ts'
import type { DimensionEntity } from '../drawing/entities/DimensionEntity.ts'
import type { RectangleEntity } from '../drawing/entities/RectangleEntity.ts'
import type { CircleEntity } from '../drawing/entities/CircleEntity.ts'
import type { ArcEntity } from '../drawing/entities/ArcEntity.ts'
import type { Entity } from '../drawing/entities/Entity.ts'
import { EMPTY_DRAWING_STATE, type DrawingState } from './DrawingState.ts'
import { HistoryManager } from './HistoryManager.ts'

export interface DrawingSnapshot {
  state: DrawingState
  canUndo: boolean
  canRedo: boolean
}

export class DrawingStore {
  private state: DrawingState
  private snapshot: DrawingSnapshot
  private readonly history = new HistoryManager<DrawingState>()
  private readonly listeners = new Set<() => void>()
  private readonly readOnly: boolean

  constructor(initialState: DrawingState = EMPTY_DRAWING_STATE, readOnly = false) {
    this.state = initialState
    this.readOnly = readOnly
    this.snapshot = this.createSnapshot()
  }

  subscribe = (listener: () => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  getSnapshot = () => this.snapshot

  addLine(line: LineEntity, layerId?: string) {
    return this.addEntity(layerId ? { ...line, layerId } : line)
  }

  addDimension(dimension: DimensionEntity) {
    if (this.readOnly) return false
    const targetEntityId = dimension.source.type === 'entity' ? dimension.source.targetEntityId : null
    if (targetEntityId && !this.state.entities.some((entity) => entity.type === 'line' && entity.id === targetEntityId)) return false
    this.commit({ ...this.state, entities: [...this.state.entities, dimension] })
    return true
  }

  addRectangle(rectangle: RectangleEntity, layerId?: string) { return this.addEntity(layerId ? { ...rectangle, layerId } : rectangle) }

  addCircle(circle: CircleEntity, layerId?: string) { return this.addEntity(layerId ? { ...circle, layerId } : circle) }

  addArc(arc: ArcEntity, layerId?: string) { return this.addEntity(layerId ? { ...arc, layerId } : arc) }

  addEntity(entity: Entity) {
    if (this.readOnly) return false
    this.commit({ ...this.state, entities: [...this.state.entities, entity] })
    return true
  }

  deleteEntity(id: string) {
    return this.deleteEntities([id])
  }

  deleteEntities(ids: Iterable<string>) {
    if (this.readOnly) return false
    const requested = new Set(ids)
    if (requested.size === 0) return false
    const lineIds = new Set(this.state.entities
      .filter((entity) => entity.type === 'line' && requested.has(entity.id))
      .map((entity) => entity.id))
    const entities = this.state.entities.filter((entity) =>
      !requested.has(entity.id) && !(entity.type === 'dimension' && entity.source.type === 'entity' && lineIds.has(entity.source.targetEntityId)),
    )
    if (entities.length === this.state.entities.length) return false
    this.commit({ ...this.state, entities })
    return true
  }

  moveEntitiesToLayer(ids: Iterable<string>, layerId: string) {
    if (this.readOnly) return false
    const requested = new Set(ids)
    let changed = false
    const entities = this.state.entities.map((entity) => {
      if (!requested.has(entity.id) || entity.type === 'dimension' || entity.layerId === layerId) return entity
      changed = true
      return { ...entity, layerId }
    })
    if (!changed) return false
    this.commit({ ...this.state, entities })
    return true
  }

  reassignDeletedLayer(layerId: string, fallbackLayerId: string) {
    if (this.readOnly) return false
    const rewrite = (state: DrawingState): DrawingState => ({
      ...state,
      entities: state.entities.map((entity) => entity.layerId === layerId ? { ...entity, layerId: fallbackLayerId } : entity),
    })
    if (!this.state.entities.some((entity) => entity.layerId === layerId)) return false
    this.state = rewrite(this.state)
    this.history.rewrite(rewrite)
    this.emit()
    return true
  }

  undo() {
    if (this.readOnly) return false
    const previous = this.history.undo(this.state)
    if (!previous) return false
    this.state = previous
    this.emit()
    return true
  }

  redo() {
    if (this.readOnly) return false
    const next = this.history.redo(this.state)
    if (!next) return false
    this.state = next
    this.emit()
    return true
  }

  private commit(next: DrawingState) {
    this.history.push(this.state)
    this.state = next
    this.emit()
  }

  private createSnapshot(): DrawingSnapshot {
    return { state: this.state, canUndo: this.history.canUndo, canRedo: this.history.canRedo }
  }

  private emit() {
    this.snapshot = this.createSnapshot()
    this.listeners.forEach((listener) => listener())
  }
}
