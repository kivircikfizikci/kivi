import type { Camera } from '../drawing/camera/Camera.ts'
import type { Project, ProjectSettings } from '../types/project.ts'
import { AutosaveManager, type AutosaveStatus } from './AutosaveManager.ts'
import { DrawingStore } from './DrawingStore.ts'
import type { Layer } from '../types/project.ts'
import { DEFAULT_LAYER_ID, isEditableLayer } from './layers.ts'

export type WorkspaceMode = 'edit' | 'view'

export interface ProjectSessionSnapshot {
  project: Project
  saveStatus: AutosaveStatus
  dirty: boolean
}

export class ProjectSession {
  readonly store: DrawingStore
  private project: Project
  private snapshot: ProjectSessionSnapshot
  private readonly autosave: AutosaveManager
  private readonly listeners = new Set<() => void>()
  private readonly unsubscribeStore: () => void
  private readonly unsubscribeAutosave: () => void

  constructor(project: Project, saveProject: (project: Project) => Promise<void>, autosaveDelay = 400, mode: WorkspaceMode = 'edit') {
    this.project = project
    this.store = new DrawingStore(project.drawing, mode === 'view')
    this.autosave = new AutosaveManager(saveProject, autosaveDelay)
    this.snapshot = this.createSnapshot()
    this.unsubscribeStore = this.store.subscribe(() => {
      this.applyChange({ drawing: this.store.getSnapshot().state })
    })
    this.unsubscribeAutosave = this.autosave.subscribe(() => this.emit())
  }

  subscribe = (listener: () => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  getSnapshot = () => this.snapshot

  updateProjectSettings(updates: Partial<ProjectSettings>) {
    this.applyChange({ projectSettings: { ...this.project.projectSettings, ...updates } })
  }

  createLayer(name: string) {
    const trimmed = name.trim()
    if (!trimmed) return null
    const layer: Layer = { id: globalThis.crypto.randomUUID(), name: trimmed, visible: true, locked: false }
    this.applyChange({ layers: [...this.project.layers, layer] })
    return layer
  }

  renameLayer(id: string, name: string) {
    const trimmed = name.trim()
    const target = this.project.layers.find((layer) => layer.id === id)
    if (!trimmed || !target || target.builtIn) return false
    this.applyChange({ layers: this.project.layers.map((layer) => layer.id === id ? { ...layer, name: trimmed } : layer) })
    return true
  }

  updateLayer(id: string, updates: Partial<Pick<Layer, 'visible' | 'locked'>>) {
    const target = this.project.layers.find((layer) => layer.id === id)
    if (!target) return false
    const layers = this.project.layers.map((layer) => layer.id === id ? { ...layer, ...updates } : layer)
    let activeLayerId = this.project.activeLayerId
    if (id === activeLayerId && !isEditableLayer(layers.find((layer) => layer.id === id))) {
      const fallback = layers.find(isEditableLayer)
      if (!fallback) return false
      activeLayerId = fallback.id
    }
    this.applyChange({ layers, activeLayerId })
    return true
  }

  setActiveLayer(id: string) {
    if (!isEditableLayer(this.project.layers.find((layer) => layer.id === id))) return false
    this.applyChange({ activeLayerId: id })
    return true
  }

  deleteLayer(id: string) {
    const target = this.project.layers.find((layer) => layer.id === id)
    if (!target || target.builtIn) return false
    const layers = this.project.layers.filter((layer) => layer.id !== id)
    const activeFallback = layers.find(isEditableLayer)
    if (this.project.activeLayerId === id && !activeFallback) return false
    this.store.reassignDeletedLayer(id, DEFAULT_LAYER_ID)
    this.applyChange({
      layers,
      activeLayerId: this.project.activeLayerId === id ? activeFallback!.id : this.project.activeLayerId,
    })
    return true
  }

  updateCamera(camera: Camera) {
    const current = this.project.view?.camera
    if (
      current &&
      current.zoom === camera.zoom &&
      current.center.x === camera.center.x &&
      current.center.y === camera.center.y
    ) return
    this.applyChange({ view: { camera: structuredClone(camera) } })
  }

  flush() {
    return this.autosave.flush()
  }

  dispose() {
    this.unsubscribeStore()
    this.unsubscribeAutosave()
    return this.autosave.flush()
  }

  private applyChange(changes: Partial<Pick<Project, 'drawing' | 'projectSettings' | 'view' | 'layers' | 'activeLayerId'>>) {
    this.project = {
      ...this.project,
      ...changes,
      updatedAt: new Date().toISOString(),
      sync: {
        ...this.project.sync,
        status: 'local',
        localRevision: this.project.sync.localRevision + 1,
      },
    }
    this.autosave.markDirty(this.project)
    this.emit()
  }

  private createSnapshot(): ProjectSessionSnapshot {
    const autosave = this.autosave.getSnapshot()
    return { project: this.project, saveStatus: autosave.status, dirty: autosave.dirty }
  }

  private emit() {
    this.snapshot = this.createSnapshot()
    this.listeners.forEach((listener) => listener())
  }
}
