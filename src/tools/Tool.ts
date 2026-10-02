export type ToolId = 'select' | 'line' | 'rectangle' | 'circle' | 'arc' | 'polygon' | 'text' | 'dimension' | 'measure' | 'move' | 'copy' | 'repeat' | 'rotate' | 'mirror' | 'scale' | 'offset' | 'trim' | 'extend'

export interface Tool {
  readonly id: ToolId
  activate(): void
  deactivate(): void
}
