import { LineTool } from './LineTool.ts'
import { SelectTool } from './SelectTool.ts'
import { DimensionTool } from './DimensionTool.ts'
import type { ToolId } from './Tool.ts'

export class ToolManager {
  readonly line = new LineTool()
  readonly select = new SelectTool()
  readonly dimension = new DimensionTool()
  private activeId: ToolId = 'select'
  private readonly listeners = new Set<() => void>()

  subscribe = (listener: () => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  getSnapshot = () => this.activeId

  activate(id: ToolId) {
    if (this.activeId === id) return
    this.getTool(this.activeId).deactivate()
    this.activeId = id
    this.getTool(id).activate()
    this.listeners.forEach((listener) => listener())
  }

  finishActiveTool() {
    if (this.activeId === 'select') return
    this.getTool(this.activeId).deactivate()
    this.activeId = 'select'
    this.select.activate()
    this.listeners.forEach((listener) => listener())
  }

  finishLine() { this.finishActiveTool() }

  private getTool(id: ToolId) {
    return id === 'line' ? this.line : id === 'dimension' ? this.dimension : this.select
  }
}
