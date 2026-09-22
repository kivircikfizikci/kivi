import en from './en.json'

export type Locale = 'en' | 'tr'
export type TranslationKey = keyof typeof en
export type Translations = Record<TranslationKey, string>
