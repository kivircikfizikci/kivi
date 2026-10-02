export type ToolId = 'select' | 'line' | 'rectangle' | 'circle' | 'arc' | 'polygon' | 'dimension' | 'measure' | 'move' | 'copy' | 'repeat' | 'rotate' | 'mirror' | 'offset' | 'trim' | 'extend'

export interface Tool {
  readonly id: ToolId
  activate(): void
  deactivate(): void
}
