import type { Locale } from '../i18n/types'
import type { ToolId } from '../tools/Tool.ts'

export type AppTheme = 'light' | 'dark'

export const toolbarShortcutIds = ['select', 'line', 'rectangle', 'circle', 'arc', 'polygon', 'text', 'dimension', 'measure', 'move', 'copy', 'repeat', 'rotate', 'mirror', 'scale', 'offset', 'trim', 'extend'] as const satisfies readonly ToolId[]
export type ToolbarShortcut = ToolId
export const MAX_MOBILE_TOOLBAR_SHORTCUTS = 3
export const MAX_DESKTOP_TOOLBAR_SHORTCUTS = 5

const defaultToolbarShortcuts: ToolbarShortcut[] = ['select', 'move', 'copy']

export function normalizeMobileToolbarShortcuts(value: unknown): ToolbarShortcut[] {
  if (!Array.isArray(value)) return [...defaultToolbarShortcuts]
  const allowed = new Set<string>(toolbarShortcutIds)
  const normalized = [...new Set(value.filter((item): item is ToolbarShortcut => typeof item === 'string' && allowed.has(item)))].slice(0, MAX_MOBILE_TOOLBAR_SHORTCUTS)
  return normalized.length === 0 && value.some((item) => item === 'undo' || item === 'redo') ? [...defaultToolbarShortcuts] : normalized
}

export function normalizeDesktopToolbarShortcuts(value: unknown): ToolbarShortcut[] {
  if (!Array.isArray(value)) return [...defaultToolbarShortcuts]
  const allowed = new Set<string>(toolbarShortcutIds)
  const normalized = [...new Set(value.filter((item): item is ToolbarShortcut => typeof item === 'string' && allowed.has(item)))].slice(0, MAX_DESKTOP_TOOLBAR_SHORTCUTS)
  return normalized.length === 0 && value.some((item) => item === 'undo' || item === 'redo') ? [...defaultToolbarShortcuts] : normalized
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
  defaultTextFontFamily: string
  defaultTextFontSize: number
  defaultTextColor: string
  defaultDimensionColor: string
  defaultDimensionDisplayUnit: 'cm' | 'mm'
  defaultShowDimensionUnit: boolean
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
  defaultTextFontFamily: 'Arial',
  defaultTextFontSize: 16,
  defaultTextColor: '#2f4940',
  defaultDimensionColor: '#315c4c',
  defaultDimensionDisplayUnit: 'cm',
  defaultShowDimensionUnit: false,
  angleSnapEnabled: true,
  angleSnapIncrement: 15,
  endpointSnapEnabled: true,
  midpointSnapEnabled: true,
  gridSnapEnabled: true,
  mobileToolbarShortcuts: ['select', 'move', 'copy'],
  desktopToolbarShortcuts: ['select', 'move', 'copy'],
  lastOpenProjectId: null,
  updatedAt: new Date(0).toISOString(),
}
