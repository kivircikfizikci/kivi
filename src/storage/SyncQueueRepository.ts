import { getDatabase } from './database'
import type { SyncQueueItem } from '../types/project'

export const syncQueueRepository = {
  async list(): Promise<SyncQueueItem[]> {
    return (await getDatabase()).getAllFromIndex('syncQueue', 'by-created')
  },

  async listForProject(projectId: string): Promise<SyncQueueItem[]> {
    return (await getDatabase()).getAllFromIndex('syncQueue', 'by-project', projectId)
  },

  async enqueue(item: SyncQueueItem): Promise<void> {
    await (await getDatabase()).put('syncQueue', item)
  },

  async remove(id: string): Promise<void> {
    await (await getDatabase()).delete('syncQueue', id)
  },
}
