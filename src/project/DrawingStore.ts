import type { LineEntity } from '../drawing/entities/LineEntity.ts'
import type { DimensionEntity } from '../drawing/entities/DimensionEntity.ts'
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

  addLine(line: LineEntity) {
    if (this.readOnly) return false
    this.commit({ ...this.state, entities: [...this.state.entities, line] })
    return true
  }

  addDimension(dimension: DimensionEntity) {
    if (this.readOnly) return false
    if (!this.state.entities.some((entity) => entity.type === 'line' && entity.id === dimension.targetEntityId)) return false
    this.commit({ ...this.state, entities: [...this.state.entities, dimension] })
    return true
  }

  deleteEntity(id: string) {
    if (this.readOnly) return false
    const target = this.state.entities.find((entity) => entity.id === id)
    if (!target) return false
    const entities = this.state.entities.filter((entity) =>
      entity.id !== id && !(target.type === 'line' && entity.type === 'dimension' && entity.targetEntityId === id),
    )
    if (entities.length === this.state.entities.length) return false
    this.commit({ ...this.state, entities })
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
