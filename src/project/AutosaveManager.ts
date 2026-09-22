import type { Project } from '../types/project.ts'

export type AutosaveStatus = 'saved' | 'saving' | 'error'

export interface AutosaveSnapshot {
  status: AutosaveStatus
  dirty: boolean
}

export class AutosaveManager {
  private readonly saveProject: (project: Project) => Promise<void>
  private readonly delayMilliseconds: number
  private latestProject: Project | null = null
  private revision = 0
  private timer: ReturnType<typeof setTimeout> | null = null
  private savePromise: Promise<void> | null = null
  private snapshot: AutosaveSnapshot = { status: 'saved', dirty: false }
  private readonly listeners = new Set<() => void>()

  constructor(saveProject: (project: Project) => Promise<void>, delayMilliseconds = 400) {
    this.saveProject = saveProject
    this.delayMilliseconds = delayMilliseconds
  }

  subscribe = (listener: () => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  getSnapshot = () => this.snapshot

  markDirty(project: Project) {
    this.latestProject = project
    this.revision += 1
    this.setSnapshot({ ...this.snapshot, dirty: true })
    this.schedule()
  }

  async flush(): Promise<void> {
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }
    if (this.savePromise) {
      await this.savePromise
      return
    }
    if (!this.snapshot.dirty || !this.latestProject) return

    const project = this.latestProject
    const savingRevision = this.revision
    this.setSnapshot({ status: 'saving', dirty: true })
    this.savePromise = this.saveProject(project)
      .then(() => {
        if (this.revision === savingRevision) {
          this.setSnapshot({ status: 'saved', dirty: false })
        } else {
          this.setSnapshot({ status: 'saved', dirty: true })
        }
      })
      .catch(() => {
        this.setSnapshot({ status: 'error', dirty: true })
      })
      .finally(() => {
        this.savePromise = null
        if (this.snapshot.dirty && this.revision !== savingRevision) this.schedule()
      })

    await this.savePromise
  }

  private schedule() {
    if (this.timer) clearTimeout(this.timer)
    this.timer = setTimeout(() => {
      this.timer = null
      void this.flush()
    }, this.delayMilliseconds)
  }

  private setSnapshot(snapshot: AutosaveSnapshot) {
    if (this.snapshot.status === snapshot.status && this.snapshot.dirty === snapshot.dirty) return
    this.snapshot = snapshot
    this.listeners.forEach((listener) => listener())
  }
}
