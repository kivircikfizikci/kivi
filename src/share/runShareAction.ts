import { exportProjectPdf } from '../export/pdfExport.ts'
import { exportProjectPng } from '../export/pngExport.ts'
import type { Project } from '../types/project.ts'
import { shareService, type ShareService } from './ShareService.ts'

export type ShareAction = 'png' | 'pdf' | 'link'

export interface ShareActionDependencies {
  png: (project: Project) => Promise<void>
  pdf: (project: Project) => void
  sharing: ShareService
}

const defaultDependencies: ShareActionDependencies = {
  png: exportProjectPng,
  pdf: exportProjectPdf,
  sharing: shareService,
}

export async function runShareAction(action: ShareAction, project: Project, dependencies: ShareActionDependencies = defaultDependencies) {
  if (action === 'png') return dependencies.png(project)
  if (action === 'pdf') return dependencies.pdf(project)
  return dependencies.sharing.createPublicLink(project.id)
}
