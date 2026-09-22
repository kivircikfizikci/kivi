import type { Tool } from './Tool.ts'

export class SelectTool implements Tool {
  readonly id = 'select' as const
  private selectedId: string | null = null
  private readonly listeners = new Set<() => void>()

  subscribe = (listener: () => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  getSnapshot = () => this.selectedId

  activate() {}

  deactivate() {}

  select(id: string | null) {
    if (this.selectedId === id) return
    this.selectedId = id
    this.listeners.forEach((listener) => listener())
  }
}
