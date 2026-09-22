export type ToolId = 'select' | 'line' | 'dimension'

export interface Tool {
  readonly id: ToolId
  activate(): void
  deactivate(): void
}
