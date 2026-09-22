import 'fake-indexeddb/auto'
import test from 'node:test'
import assert from 'node:assert/strict'
import { dimensionGeometry, dimensionPlacement } from '../src/drawing/geometry/dimension.ts'
import { formatDimension } from '../src/drawing/geometry/formatDimension.ts'
import { distance } from '../src/drawing/geometry/distance.ts'
import { DrawingStore } from '../src/project/DrawingStore.ts'
import { ProjectService } from '../src/project/ProjectService.ts'
import { ProjectSession } from '../src/project/ProjectSession.ts'
import { projectRepository } from '../src/storage/ProjectRepository.ts'
import { defaultSettings } from '../src/types/settings.ts'
import type { LineEntity } from '../src/drawing/entities/LineEntity.ts'
import type { DimensionEntity } from '../src/drawing/entities/DimensionEntity.ts'
import { DimensionTool } from '../src/tools/DimensionTool.ts'
import { SelectionManager } from '../src/drawing/selection/SelectionManager.ts'

const horizontal: LineEntity = { id: 'h', type: 'line', start: { x: 0, y: 0 }, end: { x: 275, y: 0 }, style: { color: '#333333', width: 2 } }
const vertical: LineEntity = { ...horizontal, id: 'v', end: { x: 0, y: 275 } }
const diagonal: LineEntity = { ...horizontal, id: 'd', end: { x: 3, y: 4 } }
const dimension: DimensionEntity = { id: 'dim-1', type: 'dimension', targetEntityId: 'h', side: 1, offset: 20, style: {} }

test('horizontal dimension is parallel and offset above its line', () => {
  const result = dimensionGeometry(horizontal, dimension)!
  assert.deepEqual(result.start, { x: 0, y: 20 })
  assert.deepEqual(result.end, { x: 275, y: 20 })
  assert.deepEqual(result.text, { x: 137.5, y: 20 })
  assert.equal(result.length, 275)
  assert.equal(result.rotation, 0)
})

test('vertical dimension is parallel and offset to the left', () => {
  const result = dimensionGeometry(vertical, dimension)!
  assert.deepEqual(result.start, { x: -20, y: 0 })
  assert.deepEqual(result.end, { x: -20, y: 275 })
  assert.equal(result.length, 275)
  assert.ok(Math.abs(result.rotation) === 90)
})

test('diagonal dimension remains aligned and retains exact length', () => {
  const result = dimensionGeometry(diagonal, { side: 1, offset: 10 })!
  assert.deepEqual(result.start, { x: -8, y: 6 })
  assert.deepEqual(result.end, { x: -5, y: 10 })
  assert.equal(result.length, 5)
  assert.equal(distance(result.start, result.end), 5)
})

test('pointer crossing the measured line switches sides', () => {
  assert.deepEqual(dimensionPlacement(horizontal, { x: 100, y: 35 }), { side: 1, offset: 35 })
  assert.deepEqual(dimensionPlacement(horizontal, { x: 100, y: -35 }), { side: -1, offset: 35 })
  assert.deepEqual(dimensionPlacement(horizontal, { x: 100, y: 1 }, 5), { side: 1, offset: 5 })
})

test('formatting handles cm and mm with and without suffix', () => {
  assert.equal(formatDimension(275, { dimensionDisplayUnit: 'cm', showDimensionUnit: false }), '275')
  assert.equal(formatDimension(275, { dimensionDisplayUnit: 'cm', showDimensionUnit: true }), '275 cm')
  assert.equal(formatDimension(275, { dimensionDisplayUnit: 'mm', showDimensionUnit: false }), '2750')
  assert.equal(formatDimension(275, { dimensionDisplayUnit: 'mm', showDimensionUnit: true }), '2750 mm')
  assert.equal(formatDimension(275.5, { dimensionDisplayUnit: 'cm', showDimensionUnit: false }), '275.5')
})

test('upside-down text is corrected to a readable rotation', () => {
  const reversed = { ...horizontal, end: { x: -275, y: 0 } }
  const geometry = dimensionGeometry(reversed, dimension)!
  assert.ok(geometry.rotation > -90 && geometry.rotation <= 90)
  assert.equal(geometry.rotation, 0)
})

test('dimension tool keeps preview transient and returns to target selection after placement', () => {
  const tool = new DimensionTool()
  tool.activate()
  tool.chooseTarget(horizontal)
  tool.position({ x: 80, y: 30 }, 5)
  assert.equal(tool.getSnapshot().preview?.offset, 30)
  const placed = tool.place()!
  assert.equal(placed.targetEntityId, horizontal.id)
  assert.equal(placed.offset, 30)
  assert.equal(tool.getSnapshot().target, null)
  assert.equal(tool.getSnapshot().preview, null)
})

test('create and delete dimension each undo and redo', () => {
  const store = new DrawingStore()
  store.addLine(horizontal)
  assert.equal(store.addDimension(dimension), true)
  assert.equal(store.getSnapshot().state.entities.length, 2)
  store.undo()
  assert.equal(store.getSnapshot().state.entities.length, 1)
  store.redo()
  assert.equal(store.getSnapshot().state.entities.length, 2)
  store.deleteEntity(dimension.id)
  assert.equal(store.getSnapshot().state.entities.length, 1)
  store.undo()
  assert.equal(store.getSnapshot().state.entities.length, 2)
  store.redo()
  assert.equal(store.getSnapshot().state.entities.length, 1)
})

test('deleting measured line removes linked dimensions in one history action', () => {
  const store = new DrawingStore()
  store.addLine(horizontal)
  store.addDimension(dimension)
  store.addDimension({ ...dimension, id: 'dim-2', side: -1 })
  store.addLine(vertical)
  store.deleteEntity(horizontal.id)
  assert.deepEqual(store.getSnapshot().state.entities.map((entity) => entity.id), [vertical.id])
  store.undo()
  assert.deepEqual(store.getSnapshot().state.entities.map((entity) => entity.id), [horizontal.id, dimension.id, 'dim-2', vertical.id])
  store.redo()
  assert.deepEqual(store.getSnapshot().state.entities.map((entity) => entity.id), [vertical.id])
})

test('dimension entity is JSON serializable and display changes do not mutate geometry', () => {
  assert.deepEqual(JSON.parse(JSON.stringify(dimension)), dimension)
  const before = JSON.stringify(horizontal)
  assert.equal(formatDimension(dimensionGeometry(horizontal, dimension)!.length, { dimensionDisplayUnit: 'mm', showDimensionUnit: false }), '2750')
  assert.equal(JSON.stringify(horizontal), before)
  const resized = { ...horizontal, end: { x: 300, y: 0 } }
  assert.equal(formatDimension(dimensionGeometry(resized, dimension)!.length, { dimensionDisplayUnit: 'cm', showDimensionUnit: false }), '300')
})

test('dimension line and label can be selected with pixel tolerance', () => {
  const selection = new SelectionManager()
  const entities = [horizontal, dimension]
  assert.equal(selection.findEntity({ x: 100, y: 21 }, entities, 4, 8)?.id, dimension.id)
  assert.equal(selection.findEntity({ x: 137.5, y: 27 }, entities, 4, 8)?.id, dimension.id)
  assert.equal(selection.findEntity({ x: 100, y: 25 }, entities, 4, 8), null)
})

test('dimension operations autosave and reload through IndexedDB', async () => {
  const service = new ProjectService(projectRepository)
  const project = await service.createProject(defaultSettings, 'Dimension persistence')
  const session = new ProjectSession(project, (updated) => service.updateProject(updated), 1)
  session.store.addLine(horizontal)
  session.store.addDimension(dimension)
  await session.flush()
  let restored = await service.getProject(project.id)
  assert.deepEqual(restored?.drawing.entities, [horizontal, dimension])
  assert.equal(restored?.drawing.entities.find((entity) => entity.type === 'dimension')?.type, 'dimension')
  session.store.deleteEntity(horizontal.id)
  await session.flush()
  restored = await service.getProject(project.id)
  assert.deepEqual(restored?.drawing.entities, [])
  session.store.undo()
  await session.flush()
  restored = await service.getProject(project.id)
  assert.deepEqual(restored?.drawing.entities, [horizontal, dimension])
  await service.deleteProject(project.id)
})
