export type ToolId = 'select' | 'line' | 'rectangle' | 'circle' | 'arc' | 'dimension'

export interface Tool {
  readonly id: ToolId
  activate(): void
  deactivate(): void
}
