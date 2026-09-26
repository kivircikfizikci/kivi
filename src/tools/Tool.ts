export type ToolId = 'select' | 'line' | 'rectangle' | 'circle' | 'arc' | 'dimension' | 'move' | 'copy' | 'repeat' | 'offset' | 'trim'

export interface Tool {
  readonly id: ToolId
  activate(): void
  deactivate(): void
}
