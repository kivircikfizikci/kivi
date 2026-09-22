import { getDatabase } from './database.ts'
import type { Project } from '../types/project.ts'
import { migrateProject } from '../project/projectMigrations.ts'

export const projectRepository = {
  async createProject(project: Project): Promise<void> {
    await (await getDatabase()).add('projects', project)
  },

  async getProject(id: string): Promise<Project | undefined> {
    const project = await (await getDatabase()).get('projects', id)
    return project ? migrateProject(project) : undefined
  },

  async listProjects(): Promise<Project[]> {
    const projects = await (await getDatabase()).getAllFromIndex('projects', 'by-updated')
    return projects.map(migrateProject).reverse()
  },

  async updateProject(project: Project): Promise<void> {
    await (await getDatabase()).put('projects', project)
  },

  async deleteProject(id: string): Promise<void> {
    await (await getDatabase()).delete('projects', id)
  },
}
