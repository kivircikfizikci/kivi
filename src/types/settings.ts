import type { Locale } from '../i18n/types'

export type AppTheme = 'light' | 'dark'

export const toolbarShortcutIds = ['select', 'move', 'copy', 'undo', 'redo'] as const
export type ToolbarShortcut = (typeof toolbarShortcutIds)[number]
export const MAX_MOBILE_TOOLBAR_SHORTCUTS = 3
export const MAX_DESKTOP_TOOLBAR_SHORTCUTS = toolbarShortcutIds.length

export function normalizeMobileToolbarShortcuts(value: unknown): ToolbarShortcut[] {
  if (!Array.isArray(value)) return ['select', 'move', 'copy']
  const allowed = new Set<string>(toolbarShortcutIds)
  return [...new Set(value.filter((item): item is ToolbarShortcut => typeof item === 'string' && allowed.has(item)))]
    .slice(0, MAX_MOBILE_TOOLBAR_SHORTCUTS)
}

export function normalizeDesktopToolbarShortcuts(value: unknown): ToolbarShortcut[] {
  if (!Array.isArray(value)) return ['undo', 'redo']
  const allowed = new Set<string>(toolbarShortcutIds)
  return [...new Set(value.filter((item): item is ToolbarShortcut => typeof item === 'string' && allowed.has(item)))]
    .slice(0, MAX_DESKTOP_TOOLBAR_SHORTCUTS)
}

export function toggleToolbarShortcut(current: readonly ToolbarShortcut[], shortcut: ToolbarShortcut, limit: number): ToolbarShortcut[] {
  if (current.includes(shortcut)) return current.filter((item) => item !== shortcut)
  return current.length < limit ? [...current, shortcut] : [...current]
}

export interface AppSettings {
  id: 'app'
  language: Locale
  theme: AppTheme
  defaultBackground: string
  defaultGridColor: string
  gridEnabled: boolean
  gridSpacing: number
  defaultLineColor: string
  defaultLineWidth: number
  defaultDimensionColor: string
  angleSnapEnabled: boolean
  angleSnapIncrement: number
  endpointSnapEnabled: boolean
  midpointSnapEnabled: boolean
  gridSnapEnabled: boolean
  mobileToolbarShortcuts: ToolbarShortcut[]
  desktopToolbarShortcuts: ToolbarShortcut[]
  lastOpenProjectId: string | null
  updatedAt: string
}

export const defaultSettings: AppSettings = {
  id: 'app',
  language: 'en',
  theme: 'light',
  defaultBackground: '#f8faf9',
  defaultGridColor: '#d8dfdc',
  gridEnabled: true,
  gridSpacing: 10,
  defaultLineColor: '#2f4940',
  defaultLineWidth: 2,
  defaultDimensionColor: '#315c4c',
  angleSnapEnabled: true,
  angleSnapIncrement: 15,
  endpointSnapEnabled: true,
  midpointSnapEnabled: true,
  gridSnapEnabled: true,
  mobileToolbarShortcuts: ['select', 'move', 'copy'],
  desktopToolbarShortcuts: ['undo', 'redo'],
  lastOpenProjectId: null,
  updatedAt: new Date(0).toISOString(),
}
