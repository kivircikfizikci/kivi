import type { Project } from '../types/project.ts'

export interface PublicShare {
  shareId: string
  project: Project
  access: 'view'
}

export interface ShareService {
  createPublicLink(projectId: string): Promise<{ shareId: string; url: string }>
  disablePublicLink(projectId: string): Promise<void>
  getPublicShare(shareId: string): Promise<PublicShare | null>
}

export class CloudBackupRequiredError extends Error {
  constructor() {
    super('Cloud backup required')
    this.name = 'CloudBackupRequiredError'
  }
}

export class LocalOnlyShareService implements ShareService {
  async createPublicLink(projectId: string): Promise<never> {
    void projectId
    throw new CloudBackupRequiredError()
  }

  async disablePublicLink(projectId: string): Promise<void> {
    void projectId
    throw new CloudBackupRequiredError()
  }

  async getPublicShare(shareId: string): Promise<PublicShare | null> {
    void shareId
    throw new CloudBackupRequiredError()
  }
}

export const shareService: ShareService = new LocalOnlyShareService()
