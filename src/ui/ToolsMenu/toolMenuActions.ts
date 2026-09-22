import type { ToolManager } from '../../tools/ToolManager.ts'
import type { ToolId } from '../../tools/Tool.ts'

export function activateToolFromMenu(tools: ToolManager, tool: ToolId, close: () => void) {
  tools.activate(tool)
  close()
}
