import type { Entity } from '../drawing/entities/Entity.ts'
import type { Tool } from './Tool.ts'

export interface SelectToolSnapshot {
  selectedIds: ReadonlySet<string>
  multiMode: boolean
}

const EMPTY_SELECTION: SelectToolSnapshot = { selectedIds: new Set(), multiMode: false }

export class SelectTool implements Tool {
  readonly id = 'select' as const
  private snapshot: SelectToolSnapshot = EMPTY_SELECTION
  private readonly listeners = new Set<() => void>()

  subscribe = (listener: () => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  getSnapshot = () => this.snapshot
  getSelectedIds = () => this.snapshot.selectedIds
  getSelectedEntities = (entities: readonly Entity[]) => entities.filter((entity) => this.snapshot.selectedIds.has(entity.id))

  activate() {}
  deactivate() {}

  select(id: string | null) { this.setSelection(id ? [id] : []) }

  setSelection(ids: Iterable<string>) {
    const selectedIds = new Set(ids)
    if (setsEqual(selectedIds, this.snapshot.selectedIds)) return
    this.setSnapshot({ ...this.snapshot, selectedIds })
  }

  toggleSelection(id: string) {
    const selectedIds = new Set(this.snapshot.selectedIds)
    if (selectedIds.has(id)) selectedIds.delete(id)
    else selectedIds.add(id)
    this.setSnapshot({ ...this.snapshot, selectedIds })
  }

  clearSelection() { this.setSelection([]) }

  setMultiMode(enabled: boolean) {
    if (enabled === this.snapshot.multiMode) return
    this.setSnapshot({ ...this.snapshot, multiMode: enabled })
  }

  toggleMultiMode() { this.setMultiMode(!this.snapshot.multiMode) }

  private setSnapshot(snapshot: SelectToolSnapshot) {
    this.snapshot = snapshot
    this.listeners.forEach((listener) => listener())
  }
}

function setsEqual(a: ReadonlySet<string>, b: ReadonlySet<string>) {
  return a.size === b.size && [...a].every((id) => b.has(id))
}
