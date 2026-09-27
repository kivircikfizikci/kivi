import { getDatabase } from './database.ts'
import {
  defaultSettings,
  normalizeDesktopToolbarShortcuts,
  normalizeMobileToolbarShortcuts,
  type AppSettings,
} from '../types/settings.ts'

export const appSettingsRepository = {
  async get(): Promise<AppSettings> {
    const database = await getDatabase()
    const saved = await database.get('settings', 'app')
    return saved
      ? {
          ...defaultSettings,
          ...saved,
          id: 'app',
          mobileToolbarShortcuts: normalizeMobileToolbarShortcuts(saved.mobileToolbarShortcuts),
          desktopToolbarShortcuts: normalizeDesktopToolbarShortcuts(saved.desktopToolbarShortcuts),
        }
      : defaultSettings
  },

  async save(settings: AppSettings): Promise<void> {
    const database = await getDatabase()
    await database.put('settings', settings)
  },
}
