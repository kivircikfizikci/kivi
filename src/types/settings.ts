import type { Locale } from '../i18n/types'

export type AppTheme = 'light' | 'dark'

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
  lastOpenProjectId: null,
  updatedAt: new Date(0).toISOString(),
}
