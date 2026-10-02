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
import { RotateTool } from './RotateTool.ts'
import { MirrorTool } from './MirrorTool.ts'
import { ExtendTool } from './ExtendTool.ts'
import { PolygonTool } from './PolygonTool.ts'
import { MeasureTool } from './MeasureTool.ts'
import { TextTool } from './TextTool.ts'
import { ScaleTool } from './ScaleTool.ts'

export class ToolManager {
  readonly line = new LineTool()
  readonly select = new SelectTool()
  readonly dimension = new DimensionTool()
  readonly rectangle = new RectangleTool()
  readonly circle = new CircleTool()
  readonly arc = new ArcTool()
  readonly polygon = new PolygonTool()
  readonly measure = new MeasureTool()
  readonly text = new TextTool()
  readonly move = new MoveTool()
  readonly copy = new CopyTool()
  readonly repeat = new RepeatTool()
  readonly offset = new OffsetTool()
  readonly trim = new TrimTool()
  readonly rotate = new RotateTool()
  readonly mirror = new MirrorTool()
  readonly scale = new ScaleTool()
  readonly extend = new ExtendTool()
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
      case 'polygon': return this.polygon
      case 'dimension': return this.dimension
      case 'measure': return this.measure
      case 'text': return this.text
      case 'move': return this.move
      case 'copy': return this.copy
      case 'repeat': return this.repeat
      case 'offset': return this.offset
      case 'trim': return this.trim
      case 'rotate': return this.rotate
      case 'mirror': return this.mirror
      case 'scale': return this.scale
      case 'extend': return this.extend
      case 'select': return this.select
    }
  }
}
