import type { Locale } from '../i18n/types'

export interface AppSettings {
  id: 'app'
  language: Locale
  defaultBackground: string
  defaultGridColor: string
  gridEnabled: boolean
  gridSpacing: number
  defaultLineColor: string
  defaultLineWidth: number
  angleSnapEnabled: boolean
  endpointSnapEnabled: boolean
  midpointSnapEnabled: boolean
  gridSnapEnabled: boolean
  lastOpenProjectId: string | null
  updatedAt: string
}

export const defaultSettings: AppSettings = {
  id: 'app',
  language: 'en',
  defaultBackground: '#f8faf9',
  defaultGridColor: '#d8dfdc',
  gridEnabled: true,
  gridSpacing: 10,
  defaultLineColor: '#2f4940',
  defaultLineWidth: 2,
  angleSnapEnabled: true,
  endpointSnapEnabled: true,
  midpointSnapEnabled: true,
  gridSnapEnabled: true,
  lastOpenProjectId: null,
  updatedAt: new Date(0).toISOString(),
}
