import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { AppSettings } from '../types/settings.ts'
import type { Project, SyncQueueItem } from '../types/project.ts'

interface KiviDatabase extends DBSchema {
  settings: {
    key: AppSettings['id']
    value: AppSettings
  }
  projects: {
    key: string
    value: Project
    indexes: { 'by-updated': string }
  }
  syncQueue: {
    key: string
    value: SyncQueueItem
    indexes: { 'by-created': string; 'by-project': string }
  }
}

let databasePromise: Promise<IDBPDatabase<KiviDatabase>> | undefined

export function getDatabase() {
  databasePromise ??= openDB<KiviDatabase>('kivi-draw', 1, {
    upgrade(database) {
      if (!database.objectStoreNames.contains('settings')) {
        database.createObjectStore('settings', { keyPath: 'id' })
      }

      if (!database.objectStoreNames.contains('projects')) {
        const projects = database.createObjectStore('projects', { keyPath: 'id' })
        projects.createIndex('by-updated', 'updatedAt')
      }

      if (!database.objectStoreNames.contains('syncQueue')) {
        const queue = database.createObjectStore('syncQueue', { keyPath: 'id' })
        queue.createIndex('by-created', 'createdAt')
        queue.createIndex('by-project', 'projectId')
      }
    },
  })

  return databasePromise
}
