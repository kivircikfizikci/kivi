import 'fake-indexeddb/auto'
import test from 'node:test'
import assert from 'node:assert/strict'
import { defaultSettings, type AppSettings } from '../src/types/settings.ts'
import { projectRepository } from '../src/storage/ProjectRepository.ts'
import { ProjectService } from '../src/project/ProjectService.ts'
import { ProjectSession } from '../src/project/ProjectSession.ts'
import { AutosaveManager } from '../src/project/AutosaveManager.ts'
import { migrateProject } from '../src/project/projectMigrations.ts'
import { CURRENT_PROJECT_VERSION, type Project } from '../src/types/project.ts'
import type { LineEntity } from '../src/drawing/entities/LineEntity.ts'
import { appSettingsRepository } from '../src/storage/AppSettingsRepository.ts'

const service = new ProjectService(projectRepository)

function settings(overrides: Partial<AppSettings> = {}): AppSettings {
  return { ...defaultSettings, ...overrides }
}

function line(id: string): LineEntity {
  return {
    id,
    type: 'line',
    start: { x: 0, y: 0 },
    end: { x: 30, y: 40 },
    style: { color: '#123456', width: 2 },
  }
}

test('app theme preference persists in settings', async () => {
  await appSettingsRepository.save(settings({ theme: 'dark' }))
  assert.equal((await appSettingsRepository.get()).theme, 'dark')
})

test('repository creates, loads, lists, updates, and deletes a project', async () => {
  const project = await service.createProject(settings(), 'Repository test')
  assert.deepEqual(await service.getProject(project.id), project)
  assert.ok((await service.listProjects()).some((item) => item.id === project.id))

  const updated = { ...project, name: 'Updated name', updatedAt: new Date().toISOString() }
  await service.updateProject(updated)
  assert.equal((await service.getProject(project.id))?.name, 'Updated name')

  await service.deleteProject(project.id)
  assert.equal(await service.getProject(project.id), undefined)
})

test('new project copies user defaults and remains independent from later changes', async () => {
  const defaults = settings({
    defaultBackground: '#111111',
    defaultGridColor: '#222222',
    gridEnabled: false,
    gridSpacing: 25,
  })
  const project = await service.createProject(defaults, 'Defaults test')

  defaults.defaultBackground = '#ffffff'
  defaults.defaultGridColor = '#eeeeee'
  defaults.gridSpacing = 5

  const loaded = await service.getProject(project.id)
  assert.equal(loaded?.projectSettings.backgroundColor, '#111111')
  assert.equal(loaded?.projectSettings.gridColor, '#222222')
  assert.equal(loaded?.projectSettings.gridEnabled, false)
  assert.equal(loaded?.projectSettings.gridSpacing, 25)
  await service.deleteProject(project.id)
})

test('drawing survives IndexedDB serialization and deserialization', async () => {
  const project = await service.createProject(settings(), 'Serialization test')
  const session = new ProjectSession(project, (value) => service.updateProject(value), 1)
  session.store.addLine(line('serialized-line'))
  await session.flush()

  const loaded = await service.getProject(project.id)
  assert.deepEqual(loaded?.drawing.entities, [line('serialized-line')])
  assert.equal(loaded?.version, CURRENT_PROJECT_VERSION)
  await service.deleteProject(project.id)
})

test('undo and redo results are each autosaved', async () => {
  const project = await service.createProject(settings(), 'History autosave test')
  const session = new ProjectSession(project, (value) => service.updateProject(value), 1)
  session.store.addLine(line('history-line'))
  await session.flush()
  assert.equal((await service.getProject(project.id))?.drawing.entities.length, 1)

  session.store.undo()
  await session.flush()
  assert.equal((await service.getProject(project.id))?.drawing.entities.length, 0)

  session.store.redo()
  await session.flush()
  assert.equal((await service.getProject(project.id))?.drawing.entities.length, 1)
  await service.deleteProject(project.id)
})

test('project migration boundary accepts legacy version 1 and rejects unknown versions', () => {
  const migrated = migrateProject({
    id: 'legacy',
    name: 'Legacy',
    version: 1,
    createdAt: '2020-01-01T00:00:00.000Z',
    updatedAt: '2020-01-01T00:00:00.000Z',
    data: { version: 1, entities: [] },
  })
  assert.equal(migrated.version, CURRENT_PROJECT_VERSION)
  assert.deepEqual(migrated.drawing.entities, [])
  assert.throws(() => migrateProject({ version: 99 }), /Unsupported project version/)
})

test('failed persistence keeps the project dirty and exposes an error state', async () => {
  const project = await service.createProject(settings(), 'Failure test')
  const autosave = new AutosaveManager(async () => Promise.reject(new Error('IndexedDB unavailable')), 1)
  autosave.markDirty(project as Project)
  await autosave.flush()
  assert.deepEqual(autosave.getSnapshot(), { status: 'error', dirty: true })
  await service.deleteProject(project.id)
})
