import { LineTool } from './LineTool.ts'
import { SelectTool } from './SelectTool.ts'
import { DimensionTool } from './DimensionTool.ts'
import type { ToolId } from './Tool.ts'
import type { Tool } from './Tool.ts'
import { RectangleTool } from './RectangleTool.ts'
import { CircleTool } from './CircleTool.ts'
import { ArcTool } from './ArcTool.ts'
import { RepeatTool } from './RepeatTool.ts'
import { MoveTool } from './MoveTool.ts'
import { CopyTool } from './CopyTool.ts'
import { OffsetTool } from './OffsetTool.ts'
import { TrimTool } from './TrimTool.ts'

export class ToolManager {
  readonly line = new LineTool()
  readonly select = new SelectTool()
  readonly dimension = new DimensionTool()
  readonly rectangle = new RectangleTool()
  readonly circle = new CircleTool()
  readonly arc = new ArcTool()
  readonly move = new MoveTool()
  readonly copy = new CopyTool()
  readonly repeat = new RepeatTool()
  readonly offset = new OffsetTool()
  readonly trim = new TrimTool()
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

  private getTool(id: ToolId): Tool {
    switch (id) {
      case 'line': return this.line
      case 'rectangle': return this.rectangle
      case 'circle': return this.circle
      case 'arc': return this.arc
      case 'dimension': return this.dimension
      case 'move': return this.move
      case 'copy': return this.copy
      case 'repeat': return this.repeat
      case 'offset': return this.offset
      case 'trim': return this.trim
      case 'select': return this.select
    }
  }
}
