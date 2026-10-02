import { createTextEntity, validTextEntity, type TextEntity, type TextStyle } from '../drawing/entities/TextEntity.ts'
import type { Point } from '../drawing/geometry/Point.ts'
import type { Tool } from './Tool.ts'

export interface TextToolSnapshot {
  phase: 'inactive' | 'placing' | 'editing'
  draft: TextEntity | null
  editingId: string | null
}
export type TextDraftUpdate = Omit<Partial<TextEntity>, 'style'> & { style?: Partial<TextStyle> }

const initial = (phase: TextToolSnapshot['phase']): TextToolSnapshot => ({ phase, draft: null, editingId: null })

export class TextTool implements Tool {
  readonly id = 'text' as const
  private snapshot = initial('inactive')
  private readonly listeners = new Set<() => void>()
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => this.listeners.delete(listener) }
  getSnapshot = () => this.snapshot
  activate() { this.set(initial('placing')) }
  deactivate() { this.set(initial('inactive')) }
  begin(position: Point, style: TextStyle, layerId: string) { if (this.snapshot.phase === 'placing') this.set({ phase: 'editing', draft: createTextEntity(position, '', style, layerId), editingId: null }) }
  edit(entity: TextEntity) { this.set({ phase: 'editing', draft: structuredClone(entity), editingId: entity.id }) }
  update(updates: TextDraftUpdate) {
    if (this.snapshot.phase !== 'editing' || !this.snapshot.draft) return
    this.set({ ...this.snapshot, draft: { ...this.snapshot.draft, ...updates, box: updates.box ? { ...updates.box } : this.snapshot.draft.box, style: { ...this.snapshot.draft.style, ...updates.style } } })
  }
  confirm() { return this.snapshot.draft && validTextEntity(this.snapshot.draft) ? structuredClone(this.snapshot.draft) : null }
  cancel() { this.set(initial('placing')) }
  private set(snapshot: TextToolSnapshot) { this.snapshot = snapshot; this.listeners.forEach((listener) => listener()) }
}
