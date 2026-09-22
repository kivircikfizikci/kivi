import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { appSettingsRepository } from '../storage/AppSettingsRepository'
import { defaultSettings, type AppSettings } from '../types/settings'
import { SettingsContext } from './SettingsContext'

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState(defaultSettings)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let active = true
    void appSettingsRepository.get().then((saved) => {
      if (active) {
        setSettings(saved)
        setReady(true)
      }
    })
    return () => {
      active = false
    }
  }, [])

  const updateSettings = useCallback((updates: Partial<Omit<AppSettings, 'id' | 'updatedAt'>>) => {
    setSettings((current) => {
      const next = { ...current, ...updates, updatedAt: new Date().toISOString() }
      void appSettingsRepository.save(next)
      return next
    })
  }, [])

  const value = useMemo(() => ({ settings, ready, updateSettings }), [settings, ready, updateSettings])

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}
