import 'fake-indexeddb/auto'
import test from 'node:test'
import assert from 'node:assert/strict'
import { parseCoordinate } from '../src/commands/coordinateParser.ts'
import { createPointDimension, type DimensionEntity } from '../src/drawing/entities/DimensionEntity.ts'
import type { LineEntity } from '../src/drawing/entities/LineEntity.ts'
import { buildDimensionGeometry, resolveDimensionSegment } from '../src/drawing/geometry/dimension.ts'
import { formatDimension } from '../src/drawing/geometry/formatDimension.ts'
import { SelectionManager } from '../src/drawing/selection/SelectionManager.ts'
import { SnapManager } from '../src/drawing/snap/SnapManager.ts'
import { DrawingStore } from '../src/project/DrawingStore.ts'
import { createDrawingExportModel } from '../src/export/DrawingExportModel.ts'
import { createBuiltInLayers, DEFAULT_LAYER_ID } from '../src/project/layers.ts'
import { defaultProjectSettings, defaultSyncMetadata, migrateProject } from '../src/project/projectMigrations.ts'
import { ProjectService } from '../src/project/ProjectService.ts'
import { ProjectSession } from '../src/project/ProjectSession.ts'
import { projectRepository } from '../src/storage/ProjectRepository.ts'
import { LineTool } from '../src/tools/LineTool.ts'
import { DimensionTool } from '../src/tools/DimensionTool.ts'
import { CURRENT_PROJECT_VERSION } from '../src/types/project.ts'
import { defaultSettings } from '../src/types/settings.ts'
import { snapQuickControlItems, toggledSnapSetting } from '../src/ui/SnapQuickControls/snapQuickControls.ts'

const line: LineEntity = { id: 'line', type: 'line', start: { x: 0, y: 0 }, end: { x: 100, y: 0 }, style: { color: '#123', width: 2 }, layerId: DEFAULT_LAYER_ID }

test('coordinate parser accepts only one finite X,Y pair', () => {
  assert.deepEqual(parseCoordinate('120,45'), { x: 120, y: 45 })
  assert.deepEqual(parseCoordinate('100, 100'), { x: 100, y: 100 })
  assert.deepEqual(parseCoordinate('-50,200'), { x: -50, y: 200 })
  assert.deepEqual(parseCoordinate('0,0'), { x: 0, y: 0 })
  assert.deepEqual(parseCoordinate('12.5,30.25'), { x: 12.5, y: 30.25 })
  assert.deepEqual(parseCoordinate(' -2.5, +.75 '), { x: -2.5, y: 0.75 })
  for (const invalid of ['', '100', '100,', ',100', 'abc,100', '100,abc', '100,100,100', '1+1,20', 'Infinity,0', '1 2']) {
    assert.equal(parseCoordinate(invalid), null)
  }
})

test('exact command coordinate and click starts use the same line flow', () => {
  const exact = new LineTool()
  exact.activate()
  exact.placePoint(parseCoordinate('25,-10')!, null)
  exact.placePoint({ x: 28, y: -6 }, null)
  exact.updateLength('10')
  const created = exact.confirm({ color: '#123', width: 2 })!
  assert.deepEqual(created.start, { x: 25, y: -10 })
  assert.deepEqual(created.end, { x: 31, y: -2 })

  const clicked = new LineTool()
  clicked.activate()
  clicked.placePoint({ x: 4, y: 7 }, null)
  assert.deepEqual(clicked.getSnapshot().start, { x: 4, y: 7 })
})

test('free dimensions support horizontal, vertical and diagonal geometry and unit formatting', () => {
  const cases = [
    [{ x: 0, y: 0 }, { x: 20, y: 0 }, 20],
    [{ x: 0, y: 0 }, { x: 0, y: 30 }, 30],
    [{ x: 0, y: 0 }, { x: 3, y: 4 }, 5],
  ] as const
  for (const [start, end, length] of cases) {
    const dimension = createPointDimension(start, end, 10, 1)
    assert.equal(dimension.layerId, 'dimensions')
    const segment = resolveDimensionSegment(dimension, [])!
    const geometry = buildDimensionGeometry(segment, dimension)!
    assert.equal(geometry.length, length)
    assert.equal(formatDimension(length, { dimensionDisplayUnit: 'cm', showDimensionUnit: true }), `${length} cm`)
    assert.equal(formatDimension(length, { dimensionDisplayUnit: 'mm', showDimensionUnit: true }), `${length * 10} mm`)
  }
})

test('free dimensions use the shared export model', () => {
  const dimension = createPointDimension({ x: 0, y: 0 }, { x: 30, y: 40 }, 10, 1)
  const model = createDrawingExportModel({
    drawing: { version: 1, entities: [dimension] },
    projectSettings: { ...defaultProjectSettings(), showDimensionUnit: true },
    layers: createBuiltInLayers(),
  })
  assert.equal(model.labels[0]?.text, '50 cm')
  assert.equal(model.strokes.length, 3)
  assert.equal(model.polygons.length, 2)
})

test('dimension tool infers entity targets and otherwise completes the two-point flow', () => {
  const tool = new DimensionTool()
  tool.activate()
  tool.begin(line, { x: 50, y: 1 }, null)
  assert.equal(tool.getSnapshot().source?.type, 'entity')
  tool.position({ x: 50, y: 20 }, 5)
  assert.equal(tool.place()?.source.type, 'entity')

  tool.begin(null, { x: 10, y: 10 }, { kind: 'grid', point: { x: 10, y: 10 }, distancePixels: 1 })
  tool.updateSecondPoint({ x: 40, y: 10 }, { kind: 'endpoint', point: { x: 40, y: 10 }, distancePixels: 1 })
  assert.equal(tool.chooseSecondPoint({ x: 40, y: 10 }, tool.getSnapshot().snap), true)
  tool.position({ x: 20, y: 25 }, 5)
  const pointDimension = tool.place()!
  assert.deepEqual(pointDimension.source, { type: 'points', start: { x: 10, y: 10 }, end: { x: 40, y: 10 } })
})

test('free dimensions select, persist through history, and survive deletion of unrelated lines', () => {
  const pointDimension = createPointDimension({ x: 0, y: 0 }, { x: 30, y: 0 }, 10, 1)
  const linked: DimensionEntity = { ...pointDimension, id: 'linked', source: { type: 'entity', targetEntityId: line.id }, offset: 20 }
  const store = new DrawingStore({ version: 1, entities: [line] })
  assert.equal(store.addDimension(pointDimension), true)
  assert.equal(store.addDimension(linked), true)
  assert.equal(new SelectionManager().findEntity({ x: 15, y: 10 }, store.getSnapshot().state.entities, 2, 8)?.id, pointDimension.id)
  store.deleteEntity(line.id)
  assert.deepEqual(store.getSnapshot().state.entities.map((entity) => entity.id), [pointDimension.id])
  store.undo()
  assert.equal(store.getSnapshot().state.entities.length, 3)
  store.redo()
  assert.deepEqual(JSON.parse(JSON.stringify(store.getSnapshot().state.entities)), [pointDimension])
})

test('committed free dimensions autosave and reload through the existing project session', async () => {
  const service = new ProjectService(projectRepository)
  const project = await service.createProject(defaultSettings, 'Free dimension autosave')
  const session = new ProjectSession(project, (updated) => service.updateProject(updated), 1)
  const dimension = createPointDimension({ x: 5, y: 6 }, { x: 8, y: 10 }, 12, -1)
  session.store.addDimension(dimension)
  await session.flush()
  assert.deepEqual((await service.getProject(project.id))?.drawing.entities, [dimension])
  await service.deleteProject(project.id)
})

test('version 3 entity dimensions migrate to the discriminated version 4 source', () => {
  const migrated = migrateProject({
    id: 'legacy-v3', name: 'Legacy v3', version: 3,
    createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
    drawing: { version: 1, entities: [line, { id: 'dim', type: 'dimension', targetEntityId: line.id, offset: 20, side: 1, style: {}, layerId: 'dimensions' }] },
    projectSettings: defaultProjectSettings(), layers: createBuiltInLayers(), activeLayerId: DEFAULT_LAYER_ID,
    sync: defaultSyncMetadata(),
  })
  assert.equal(migrated.version, CURRENT_PROJECT_VERSION)
  const dimension = migrated.drawing.entities.find((entity) => entity.type === 'dimension')
  assert.equal(dimension?.type, 'dimension')
  if (dimension?.type === 'dimension') assert.deepEqual(dimension.source, { type: 'entity', targetEntityId: line.id })
})

test('quick snap controls cover all settings and toggles affect snap resolution immediately', () => {
  assert.deepEqual(snapQuickControlItems.map((item) => item.key), ['endpointSnapEnabled', 'midpointSnapEnabled', 'gridSnapEnabled', 'angleSnapEnabled'])
  for (const item of snapQuickControlItems) {
    assert.equal({ ...defaultSettings, ...toggledSnapSetting(defaultSettings, item.key) }[item.key], false)
  }
  const disabledEndpoint = { ...defaultSettings, ...toggledSnapSetting(defaultSettings, 'endpointSnapEnabled') }
  assert.equal(disabledEndpoint.endpointSnapEnabled, false)
  const manager = new SnapManager()
  const context = { pointer: { x: 1, y: 0 }, entities: [line], zoom: 1, settings: { endpoint: true, midpoint: false, grid: false, angle: false, gridSpacing: 10, pixelTolerance: 5 } }
  assert.equal(manager.find(context)?.kind, 'endpoint')
  assert.equal(manager.find({ ...context, settings: { ...context.settings, endpoint: disabledEndpoint.endpointSnapEnabled } }), null)
  assert.equal(manager.find({ ...context, pointer: { x: 51, y: 0 }, settings: { ...context.settings, endpoint: false, midpoint: true } })?.kind, 'midpoint')
  assert.equal(manager.find({ ...context, pointer: { x: 9, y: 11 }, entities: [], settings: { ...context.settings, endpoint: false, grid: true } })?.kind, 'grid')
  assert.equal(manager.find({ ...context, pointer: { x: 10, y: 9 }, entities: [], angleOrigin: { x: 0, y: 0 }, settings: { ...context.settings, endpoint: false, angle: true } })?.kind, 'angle')
})

test('free dimension points consume endpoint, midpoint, and grid snap results', () => {
  const manager = new SnapManager()
  const settings = { endpoint: true, midpoint: true, grid: true, angle: false, gridSpacing: 10, pixelTolerance: 5 }
  const a = manager.resolve({ pointer: { x: 1, y: 0 }, entities: [line], zoom: 1, settings })
  const b = manager.resolve({ pointer: { x: 51, y: 0 }, entities: [line], zoom: 1, settings: { ...settings, endpoint: false } })
  const c = manager.resolve({ pointer: { x: 79, y: 21 }, entities: [], zoom: 1, settings })
  assert.deepEqual([a.snap?.kind, b.snap?.kind, c.snap?.kind], ['endpoint', 'midpoint', 'grid'])
  const tool = new DimensionTool()
  tool.begin(null, a.point, a.snap)
  tool.chooseSecondPoint(b.point, b.snap)
  assert.deepEqual(tool.getSnapshot().source, { type: 'points', start: { x: 0, y: 0 }, end: { x: 50, y: 0 } })
})
