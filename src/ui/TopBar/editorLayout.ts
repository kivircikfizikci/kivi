import type { ToolId } from '../../tools/Tool.ts'
import type { IconName } from '../Icon/Icon.tsx'

export const editorToolGroups: { id: 'draw' | 'dimensionTools' | 'modify'; tools: { id: ToolId; icon: IconName }[] }[] = [
  { id: 'draw', tools: [{ id: 'line', icon: 'line' }, { id: 'rectangle', icon: 'rectangle' }, { id: 'circle', icon: 'circle' }, { id: 'arc', icon: 'arc' }] },
  { id: 'dimensionTools', tools: [{ id: 'dimension', icon: 'dimension' }] },
  { id: 'modify', tools: [{ id: 'select', icon: 'cursor' }, { id: 'move', icon: 'move' }, { id: 'copy', icon: 'copy' }, { id: 'repeat', icon: 'repeat' }, { id: 'rotate', icon: 'rotate' }, { id: 'mirror', icon: 'mirror' }, { id: 'offset', icon: 'offset' }, { id: 'trim', icon: 'trim' }, { id: 'extend', icon: 'extend' }] },
]

export const editorPrimaryLayout = { center: ['undo', 'redo'], right: ['share', 'layers', 'settings', 'help', 'account'] } as const
export const editorHeaderRows = ['primary', 'tools'] as const
