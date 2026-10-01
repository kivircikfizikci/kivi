import type { ToolId } from '../../tools/Tool.ts'
import type { IconName } from '../Icon/Icon.tsx'

export const editorToolGroups: { id: 'draw' | 'dimensionTools' | 'modify'; tools: { id: ToolId; icon: IconName }[] }[] = [
  { id: 'draw', tools: [{ id: 'line', icon: 'line' }, { id: 'rectangle', icon: 'rectangle' }, { id: 'circle', icon: 'circle' }, { id: 'arc', icon: 'arc' }] },
  { id: 'dimensionTools', tools: [{ id: 'dimension', icon: 'dimension' }] },
  { id: 'modify', tools: [{ id: 'select', icon: 'cursor' }, { id: 'move', icon: 'move' }, { id: 'copy', icon: 'copy' }, { id: 'repeat', icon: 'repeat' }, { id: 'rotate', icon: 'rotate' }, { id: 'mirror', icon: 'mirror' }, { id: 'offset', icon: 'offset' }, { id: 'trim', icon: 'trim' }, { id: 'extend', icon: 'extend' }] },
]

export const editorModifyActions = [{ id: 'delete', icon: 'trash' }] as const

export const editorToolIcon = Object.fromEntries(editorToolGroups.flatMap((group) => group.tools.map((tool) => [tool.id, tool.icon]))) as Record<ToolId, IconName>

export const editorPrimaryLayout = { center: ['undo', 'redo'], right: ['share', 'layers', 'settings', 'help', 'account'] } as const
export const editorHeaderRows = ['primary', 'tools'] as const
export const editorResponsiveLayout = {
  desktop: { primaryZones: ['project', 'historyAndShortcuts', 'globalActions'], toolGroups: ['draw', 'dimensionTools', 'modify'], logoTarget: 'home', projectAccess: 'name' },
  mobile: { primaryZones: ['logo', 'historyAndShortcuts', 'compactActions'], fixedCenterActions: ['undo', 'redo', 'delete'], compactActions: ['settings', 'account', 'more'], moreActions: ['projects', 'share', 'layers', 'help'], toolGroups: ['draw', 'dimensionTools', 'modify'], bottomToolDrawer: false, projectAccess: 'more', logoTarget: 'home', fullscreen: 'floating' },
} as const
