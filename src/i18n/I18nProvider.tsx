import { useEffect, useMemo, type ReactNode } from 'react'
import en from './en.json'
import tr from './tr.json'
import { useSettings } from '../settings/useSettings'
import type { Translations } from './types'
import { I18nContext, type I18nValue } from './I18nContext'

const translations: Record<string, Translations> = { en, tr }

export function I18nProvider({ children }: { children: ReactNode }) {
  const { settings } = useSettings()
  const messages = translations[settings.language] ?? en

  useEffect(() => {
    document.documentElement.lang = settings.language
  }, [settings.language])

  const value = useMemo<I18nValue>(
    () => ({ t: (key) => messages[key] ?? en[key] }),
    [messages],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}
