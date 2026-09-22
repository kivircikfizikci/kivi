import { getDatabase } from './database.ts'
import { defaultSettings, type AppSettings } from '../types/settings.ts'

export const appSettingsRepository = {
  async get(): Promise<AppSettings> {
    const database = await getDatabase()
    const saved = await database.get('settings', 'app')
    return saved ? { ...defaultSettings, ...saved, id: 'app' } : defaultSettings
  },

  async save(settings: AppSettings): Promise<void> {
    const database = await getDatabase()
    await database.put('settings', settings)
  },
}
