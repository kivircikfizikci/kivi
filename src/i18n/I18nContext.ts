import { createContext, useContext } from 'react'
import type { TranslationKey } from './types'

export interface I18nValue {
  t: (key: TranslationKey) => string
}

export const I18nContext = createContext<I18nValue | null>(null)

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) throw new Error('useI18n must be used within I18nProvider')
  return context
}
