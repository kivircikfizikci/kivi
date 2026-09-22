import type { AppSettings } from '../types/settings.ts'
import {
  CURRENT_PROJECT_VERSION,
  type Project,
  type ProjectSettings,
} from '../types/project.ts'
import { EMPTY_DRAWING_STATE } from './DrawingState.ts'
import { DEFAULT_CAMERA } from '../drawing/camera/Camera.ts'
import { defaultSyncMetadata } from './projectMigrations.ts'
import { projectRepository } from '../storage/ProjectRepository.ts'
import { generateProjectId } from '../ids/secureId.ts'

export interface ProjectRepositoryContract {
  createProject(project: Project): Promise<void>
  getProject(id: string): Promise<Project | undefined>
  updateProject(project: Project): Promise<void>
  deleteProject(id: string): Promise<void>
  listProjects(): Promise<Project[]>
}

export class ProjectService {
  private readonly repository: ProjectRepositoryContract
  private readonly createId: () => string

  constructor(repository: ProjectRepositoryContract = projectRepository, createId: () => string = generateProjectId) {
    this.repository = repository
    this.createId = createId
  }

  async createProject(defaults: AppSettings, name: string): Promise<Project> {
    const now = new Date().toISOString()
    const id = await this.createUniqueId()
    const project: Project = {
      id,
      name,
      version: CURRENT_PROJECT_VERSION,
      createdAt: now,
      updatedAt: now,
      drawing: EMPTY_DRAWING_STATE,
      projectSettings: projectSettingsFromDefaults(defaults),
      view: { camera: structuredClone(DEFAULT_CAMERA) },
      sync: defaultSyncMetadata(),
    }
    await this.repository.createProject(project)
    return project
  }

  private async createUniqueId() {
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const id = this.createId()
      if (!await this.repository.getProject(id)) return id
    }
    throw new Error('Unable to create a unique project ID')
  }

  getProject(id: string) {
    return this.repository.getProject(id)
  }

  listProjects() {
    return this.repository.listProjects()
  }

  updateProject(project: Project) {
    return this.repository.updateProject(project)
  }

  deleteProject(id: string) {
    return this.repository.deleteProject(id)
  }

  async renameProject(project: Project, name: string): Promise<Project> {
    const updated: Project = {
      ...project,
      name: name.trim() || project.name,
      updatedAt: new Date().toISOString(),
      sync: { ...project.sync, status: 'local', localRevision: project.sync.localRevision + 1 },
    }
    await this.repository.updateProject(updated)
    return updated
  }
}

export function projectSettingsFromDefaults(defaults: AppSettings): ProjectSettings {
  return {
    backgroundColor: defaults.defaultBackground,
    gridColor: defaults.defaultGridColor,
    gridEnabled: defaults.gridEnabled,
    gridSpacing: defaults.gridSpacing,
    dimensionDisplayUnit: 'cm',
    showDimensionUnit: false,
  }
}

export const projectService = new ProjectService()
