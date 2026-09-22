import { createContext } from 'react'
import type { AppSettings } from '../types/settings'

export interface SettingsContextValue {
  settings: AppSettings
  ready: boolean
  updateSettings: (updates: Partial<Omit<AppSettings, 'id' | 'updatedAt'>>) => void
}

export const SettingsContext = createContext<SettingsContextValue | null>(null)
