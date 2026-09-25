import test from 'node:test'
import assert from 'node:assert/strict'
import { generateProjectId, generateShareId, type RandomValuesSource } from '../src/ids/secureId.ts'
import { ProjectService, type ProjectRepositoryContract } from '../src/project/ProjectService.ts'
import { defaultSettings } from '../src/types/settings.ts'
import { CURRENT_PROJECT_VERSION, type Project } from '../src/types/project.ts'
import { defaultProjectSettings, defaultSyncMetadata } from '../src/project/projectMigrations.ts'
import { DrawingStore } from '../src/project/DrawingStore.ts'
import type { LineEntity } from '../src/drawing/entities/LineEntity.ts'
import type { DimensionEntity } from '../src/drawing/entities/DimensionEntity.ts'
import { calculateDrawingBounds } from '../src/export/drawingBounds.ts'
import { createDrawingExportModel } from '../src/export/DrawingExportModel.ts'
import { createDrawingSvg } from '../src/export/svgExport.ts'
import { createDrawingPdf } from '../src/export/pdfExport.ts'
import { ToolManager } from '../src/tools/ToolManager.ts'
import { activateToolFromMenu } from '../src/ui/ToolsMenu/toolMenuActions.ts'
import { toggleDrawer } from '../src/ui/BottomDrawer/drawerActions.ts'
import { CloudBackupRequiredError, LocalOnlyShareService, type ShareService } from '../src/share/ShareService.ts'
import { runShareAction } from '../src/share/runShareAction.ts'

function deterministicRandom(seed = 0): RandomValuesSource {
  let value = seed
  return (buffer) => {
    buffer.fill(value % 200)
    value += 1
    return buffer
  }
}

function line(id = 'line-1'): LineEntity {
  return { id, type: 'line', start: { x: 0, y: 0 }, end: { x: 100, y: 0 }, style: { color: '#123456', width: 2 } }
}

function dimension(): DimensionEntity {
  return { id: 'dim-1', type: 'dimension', source: { type: 'entity', targetEntityId: 'line-1' }, offset: 25, side: 1, style: {} }
}

function project(id = '7Kf3mQab'): Project {
  const now = '2026-01-01T00:00:00.000Z'
  return {
    id,
    name: 'Export test',
    version: CURRENT_PROJECT_VERSION,
    createdAt: now,
    updatedAt: now,
    drawing: { version: 1, entities: [line(), dimension()] },
    projectSettings: { ...defaultProjectSettings(), gridEnabled: true },
    view: { camera: { center: { x: 0, y: 0 }, zoom: 1 } },
    sync: defaultSyncMetadata(),
  }
}

class MemoryProjects implements ProjectRepositoryContract {
  readonly records = new Map<string, Project>()
  async createProject(value: Project) { this.records.set(value.id, value) }
  async getProject(id: string) { return this.records.get(id) }
  async updateProject(value: Project) { this.records.set(value.id, value) }
  async deleteProject(id: string) { this.records.delete(id) }
  async listProjects() { return [...this.records.values()] }
}

test('project IDs are short, URL-safe, and non-sequential-looking', () => {
  const id = generateProjectId(deterministicRandom(7))
  assert.match(id, /^[A-Za-z0-9]{8}$/)
})

test('project creation retries ID collisions', async () => {
  const repository = new MemoryProjects()
  repository.records.set('COLLIDE1', project('COLLIDE1'))
  const candidates = ['COLLIDE1', 'UNIQUE99']
  const service = new ProjectService(repository, () => candidates.shift()!)
  const created = await service.createProject(defaultSettings, 'Unique')
  assert.equal(created.id, 'UNIQUE99')
})

test('share IDs use the secure randomness abstraction and remain separate from project IDs', () => {
  let calls = 0
  const source: RandomValuesSource = (buffer) => {
    calls += 1
    buffer.fill(11)
    return buffer
  }
  const projectId = generateProjectId(source)
  const shareId = generateShareId(source)
  assert.ok(calls >= 2)
  assert.match(shareId, /^[A-Za-z0-9]{16}$/)
  assert.notEqual(projectId, shareId)
})

test('legacy UUID project IDs continue loading without migration', async () => {
  const repository = new MemoryProjects()
  const oldId = '550e8400-e29b-41d4-a716-446655440000'
  repository.records.set(oldId, project(oldId))
  const service = new ProjectService(repository)
  assert.equal((await service.getProject(oldId))?.id, oldId)
})

test('drawing bounds include committed dimension geometry and label space', () => {
  const value = project()
  const bounds = calculateDrawingBounds(value.drawing.entities, value.projectSettings)
  assert.ok(bounds.minX < 0)
  assert.ok(bounds.maxX > 100)
  assert.ok(bounds.maxY > 25)
})

test('read-only drawing store rejects every mutation', () => {
  const initial = { version: 1 as const, entities: [line()] }
  const store = new DrawingStore(initial, true)
  assert.equal(store.addLine(line('other')), false)
  assert.equal(store.addDimension(dimension()), false)
  assert.equal(store.deleteEntity('line-1'), false)
  assert.equal(store.undo(), false)
  assert.equal(store.redo(), false)
  assert.deepEqual(store.getSnapshot().state, initial)
})

test('PNG source model contains drawing content without transient UI', () => {
  const model = createDrawingExportModel(project())
  const rendered = createDrawingSvg(model, 1200)
  assert.equal(model.strokes.length, 4)
  assert.equal(model.labels.length, 1)
  assert.equal(model.transparent, true)
  assert.equal(model.includesGrid, false)
  assert.doesNotMatch(rendered.svg, /<rect|#f8faf9/)
  assert.match(rendered.svg, /<text/)
  assert.doesNotMatch(rendered.svg, /selection|toolbar|snap-indicator|preview/)
})

test('PDF export uses the same drawing-only model and emits a valid PDF document', () => {
  const bytes = createDrawingPdf(createDrawingExportModel(project()))
  const content = new TextDecoder().decode(bytes)
  assert.match(content, /^%PDF-1\.4/)
  assert.match(content, /\/Type \/Page/)
  assert.doesNotMatch(content, /toolbar|selection|preview/)
})

test('desktop tools menu actions activate Line and Dim through ToolManager', () => {
  const tools = new ToolManager()
  let closes = 0
  activateToolFromMenu(tools, 'line', () => { closes += 1 })
  assert.equal(tools.getSnapshot(), 'line')
  activateToolFromMenu(tools, 'dimension', () => { closes += 1 })
  assert.equal(tools.getSnapshot(), 'dimension')
  assert.equal(closes, 2)
})

test('mobile drawer toggle opens and closes', () => {
  const events: string[] = []
  toggleDrawer(false, () => events.push('open'), () => events.push('close'))
  toggleDrawer(true, () => events.push('open'), () => events.push('close'))
  assert.deepEqual(events, ['open', 'close'])
})

test('Share actions delegate PNG and PDF exports while local links stay unavailable', async () => {
  const events: string[] = []
  const sharing: ShareService = new LocalOnlyShareService()
  const dependencies = {
    png: async () => { events.push('png') },
    pdf: () => { events.push('pdf') },
    sharing,
  }
  await runShareAction('png', project(), dependencies)
  await runShareAction('pdf', project(), dependencies)
  await assert.rejects(() => runShareAction('link', project(), dependencies), CloudBackupRequiredError)
  assert.deepEqual(events, ['png', 'pdf'])
})
