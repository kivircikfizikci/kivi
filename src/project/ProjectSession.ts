import type { Camera } from '../drawing/camera/Camera.ts'
import type { Project, ProjectSettings } from '../types/project.ts'
import { AutosaveManager, type AutosaveStatus } from './AutosaveManager.ts'
import { DrawingStore } from './DrawingStore.ts'

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

  constructor(project: Project, saveProject: (project: Project) => Promise<void>, autosaveDelay = 400) {
    this.project = project
    this.store = new DrawingStore(project.drawing)
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

  private applyChange(changes: Partial<Pick<Project, 'drawing' | 'projectSettings' | 'view'>>) {
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
