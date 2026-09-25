import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createLineEntity } from '../src/drawing/entities/LineEntity.ts'
import { createRectangleEntity } from '../src/drawing/entities/RectangleEntity.ts'
import { createCircleEntity } from '../src/drawing/entities/CircleEntity.ts'
import { createArcEntity } from '../src/drawing/entities/ArcEntity.ts'
import { createDimensionEntity } from '../src/drawing/entities/DimensionEntity.ts'
import { DrawingStore } from '../src/project/DrawingStore.ts'
import { ProjectSession } from '../src/project/ProjectSession.ts'
import { createBuiltInLayers, DEFAULT_LAYER_ID, DIMENSIONS_LAYER_ID, entitiesOnSelectableLayers, entitiesOnVisibleLayers } from '../src/project/layers.ts'
import { defaultProjectSettings, defaultSyncMetadata, migrateProject } from '../src/project/projectMigrations.ts'
import { CURRENT_PROJECT_VERSION, type Project } from '../src/types/project.ts'
import { createDrawingExportModel } from '../src/export/DrawingExportModel.ts'
import { selectionForContextTarget } from '../src/drawing/selection/contextSelection.ts'
import { executeCommand, getCommandSuggestions, resolveCommand, type CommandContext } from '../src/commands/commandRegistry.ts'
import { geometryStyleFromProject } from '../src/drawing/entities/geometryStyle.ts'

const oldStyle = { color: '#111111', width: 2 }
const newStyle = { color: '#3a7d5d', width: 3 }
const line = createLineEntity({ x: 0, y: 0 }, { x: 100, y: 0 }, oldStyle)
const dimension = createDimensionEntity(line.id, 20, 1)

function project(entities: Project['drawing']['entities'] = []): Project {
  const timestamp = '2026-01-01T00:00:00.000Z'
  return {
    id: 'layers-test', name: 'Layers', version: CURRENT_PROJECT_VERSION,
    createdAt: timestamp, updatedAt: timestamp, drawing: { version: 1, entities },
    projectSettings: defaultProjectSettings(), layers: createBuiltInLayers(), activeLayerId: DEFAULT_LAYER_ID,
    sync: defaultSyncMetadata(),
  }
}

test('new project layer primitives and geometry defaults are stable and independent', () => {
  assert.deepEqual(createBuiltInLayers().map((layer) => layer.id), [DEFAULT_LAYER_ID, DIMENSIONS_LAYER_ID])
  const oldLine = createLineEntity({ x: 0, y: 0 }, { x: 10, y: 0 }, oldStyle)
  const newLine = createLineEntity({ x: 0, y: 1 }, { x: 10, y: 1 }, newStyle)
  const rectangle = createRectangleEntity({ x: 0, y: 0 }, 5, 4, newStyle)
  const circle = createCircleEntity({ x: 0, y: 0 }, 5, newStyle)
  const arc = createArcEntity({ x: 0, y: 0 }, 5, 0, 90, 'ccw', newStyle)
  assert.equal(oldLine.style.color, '#111111')
  assert.deepEqual([newLine, rectangle, circle, arc].map((entity) => entity.style.color), Array(4).fill('#3a7d5d'))
  assert.equal(dimension.layerId, DIMENSIONS_LAYER_ID)
  assert.equal(defaultProjectSettings().gridColor, '#d8dfdc')
  assert.deepEqual(geometryStyleFromProject({ lineColor: '#8a4f3d', lineWidth: 4 }), { color: '#8a4f3d', width: 4 })
})

test('version 2 projects migrate entities to built-in layers without changing geometry or styles', () => {
  const rawLine = { ...line } as Record<string, unknown>
  delete rawLine.layerId
  const rawDimension = { ...dimension } as Record<string, unknown>
  rawDimension.targetEntityId = line.id
  delete rawDimension.source
  delete rawDimension.layerId
  const migrated = migrateProject({ ...project(), version: 2, layers: undefined, activeLayerId: undefined, drawing: { version: 1, entities: [rawLine, rawDimension] } })
  assert.equal(migrated.version, CURRENT_PROJECT_VERSION)
  assert.deepEqual(migrated.layers.map((layer) => layer.id), [DEFAULT_LAYER_ID, DIMENSIONS_LAYER_ID])
  assert.deepEqual(migrated.drawing.entities.map((entity) => entity.layerId), [DEFAULT_LAYER_ID, DIMENSIONS_LAYER_ID])
  assert.deepEqual(migrated.drawing.entities[0]?.style, oldStyle)
  assert.equal(migrated.activeLayerId, DEFAULT_LAYER_ID)
})

test('visibility and lock share centralized render/select/export behavior', () => {
  const layers = createBuiltInLayers().map((layer) => layer.id === DIMENSIONS_LAYER_ID ? { ...layer, visible: false } : layer)
  assert.deepEqual(entitiesOnVisibleLayers([line, dimension], layers).map((entity) => entity.id), [line.id])
  const restored = layers.map((layer) => layer.id === DIMENSIONS_LAYER_ID ? { ...layer, visible: true, locked: true } : layer)
  assert.deepEqual(entitiesOnVisibleLayers([line, dimension], restored).map((entity) => entity.id), [line.id, dimension.id])
  assert.deepEqual(entitiesOnSelectableLayers([line, dimension], restored).map((entity) => entity.id), [line.id])
  const exported = createDrawingExportModel({ ...project([line, dimension]), layers: restored })
  assert.equal(exported.labels.length, 1)
})

test('layer transfer is one history action and dimensions remain reserved', () => {
  const custom = 'steel'
  const store = new DrawingStore({ version: 1, entities: [line, dimension] })
  assert.equal(store.moveEntitiesToLayer([line.id, dimension.id], custom), true)
  assert.equal(store.getSnapshot().state.entities[0]?.layerId, custom)
  assert.equal(store.getSnapshot().state.entities[1]?.layerId, DIMENSIONS_LAYER_ID)
  assert.equal(store.undo(), true)
  assert.equal(store.getSnapshot().state.entities[0]?.layerId, DEFAULT_LAYER_ID)
  assert.equal(store.redo(), true)
  assert.equal(store.getSnapshot().state.entities[0]?.layerId, custom)
})

test('layer session mutations autosave and invalid layers cannot stay active', async () => {
  let saved: Project | undefined
  const session = new ProjectSession(project(), async (value) => { saved = structuredClone(value) }, 1)
  const steel = session.createLayer('Steel')
  assert.ok(steel)
  assert.equal(session.setActiveLayer(steel.id), true)
  assert.equal(session.renameLayer(steel.id, 'Frame'), true)
  assert.equal(session.updateLayer(steel.id, { locked: true }), true)
  assert.equal(session.getSnapshot().project.activeLayerId, DEFAULT_LAYER_ID)
  assert.equal(session.setActiveLayer(steel.id), false)
  await session.flush()
  assert.equal(saved?.layers.find((layer) => layer.id === steel.id)?.name, 'Frame')
})

test('deleting a populated custom layer reassigns current and history states safely', () => {
  const session = new ProjectSession(project([line]), async () => {}, 1)
  const steel = session.createLayer('Steel')
  assert.ok(steel)
  session.store.moveEntitiesToLayer([line.id], steel.id)
  assert.equal(session.deleteLayer(steel.id), true)
  assert.equal(session.store.getSnapshot().state.entities[0]?.layerId, DEFAULT_LAYER_ID)
  session.store.undo()
  assert.equal(session.store.getSnapshot().state.entities[0]?.layerId, DEFAULT_LAYER_ID)
  assert.equal(session.getSnapshot().project.layers.some((layer) => layer.id === steel.id), false)
})

test('context target preserves a selected group but replaces selection for an unselected target', () => {
  const selected = new Set(['a', 'b', 'c'])
  assert.deepEqual([...selectionForContextTarget(selected, 'b')], ['a', 'b', 'c'])
  assert.deepEqual([...selectionForContextTarget(selected, 'd')], ['d'])
})

test('Layers command and aliases are registry-driven and keep stable command IDs', () => {
  let opened = false
  const noop = () => {}
  const context: CommandContext = { activateTool: noop, deleteSelection: noop, undo: noop, redo: noop, openProjects: noop, openSettings: noop, openLayers: () => { opened = true }, enterFullscreen: noop, openShare: noop }
  assert.equal(resolveCommand('layer')?.id, 'layers')
  assert.equal(getCommandSuggestions('lay', () => 'Katmanlar')[0]?.id, 'layers')
  assert.equal(getCommandSuggestions('rec')[0]?.id, 'rectangle')
  assert.equal(getCommandSuggestions('ci')[0]?.id, 'circle')
  assert.equal(getCommandSuggestions('ar')[0]?.id, 'arc')
  assert.equal(executeCommand('layers', context), true)
  assert.equal(opened, true)
})

test('desktop settings backdrop is transparent and project background remains data-driven', () => {
  const css = readFileSync(new URL('../src/styles/panels.css', import.meta.url), 'utf8')
  assert.match(css, /\.panel-backdrop\s*\{\s*background:\s*transparent;/)
  const value = project()
  value.projectSettings.backgroundColor = '#DDE8DF'
  const session = new ProjectSession(value, async () => {}, 1)
  assert.equal(session.getSnapshot().project.projectSettings.backgroundColor, '#DDE8DF')
})
