import test from 'node:test'
import assert from 'node:assert/strict'
import type { Entity } from '../src/drawing/entities/Entity.ts'
import { buildDimensionGeometry, resolveDimensionSegment } from '../src/drawing/geometry/dimension.ts'
import { cloneEntitiesWithNewIds, MAX_REPEAT_COPIES, repeatEntities, translateEntity, validRepeatCount } from '../src/drawing/geometry/entityTransforms.ts'
import { SnapManager } from '../src/drawing/snap/SnapManager.ts'
import { DrawingStore } from '../src/project/DrawingStore.ts'
import { createBuiltInLayers } from '../src/project/layers.ts'
import { commandRegistry, executeCommand, getCommandSuggestions, resolveCommand, type CommandContext } from '../src/commands/commandRegistry.ts'
import { MoveTool } from '../src/tools/MoveTool.ts'
import { CopyTool } from '../src/tools/CopyTool.ts'
import { RepeatTool } from '../src/tools/RepeatTool.ts'
import { canTransformSelection } from '../src/tools/transformEligibility.ts'
import { ProjectSession } from '../src/project/ProjectSession.ts'
import { CURRENT_PROJECT_VERSION, type Project } from '../src/types/project.ts'
import { defaultProjectSettings, defaultSyncMetadata } from '../src/project/projectMigrations.ts'
import { transformContextActions } from '../src/ui/ContextMenu/contextActions.ts'
import { createDrawingExportModel } from '../src/export/DrawingExportModel.ts'

const entities: Entity[] = [
  { id: 'line', type: 'line', start: { x: 0, y: 0 }, end: { x: 20, y: 0 }, style: { color: '#123456', width: 2 }, layerId: 'default' },
  { id: 'rect', type: 'rectangle', origin: { x: 2, y: 3 }, width: 10, height: 5, style: { color: '#223344', width: 3 }, layerId: 'steel' },
  { id: 'circle', type: 'circle', center: { x: 5, y: 6 }, radius: 4, style: { color: '#334455', width: 1 }, layerId: 'default' },
  { id: 'arc', type: 'arc', center: { x: 8, y: 9 }, radius: 6, startAngle: 0, endAngle: 90, direction: 'ccw', style: { color: '#445566', width: 2 }, layerId: 'default' },
  { id: 'free-dim', type: 'dimension', source: { type: 'points', start: { x: 0, y: 0 }, end: { x: 5, y: 0 } }, offset: 2, side: 1, style: { color: '#555' }, layerId: 'dimensions' },
  { id: 'linked-dim', type: 'dimension', source: { type: 'entity', targetEntityId: 'line' }, offset: 3, side: 1, style: {}, layerId: 'dimensions' },
]

test('translateEntity exhaustively moves geometry while preserving layers and linked dimensions', () => {
  const moved = entities.map((entity) => translateEntity(entity, { x: 10, y: -4 }))
  assert.deepEqual((moved[0] as Extract<Entity, { type: 'line' }>).start, { x: 10, y: -4 })
  assert.deepEqual((moved[1] as Extract<Entity, { type: 'rectangle' }>).origin, { x: 12, y: -1 })
  assert.deepEqual((moved[2] as Extract<Entity, { type: 'circle' }>).center, { x: 15, y: 2 })
  assert.deepEqual((moved[3] as Extract<Entity, { type: 'arc' }>).center, { x: 18, y: 5 })
  assert.deepEqual((moved[4] as Extract<Entity, { type: 'dimension' }>).source, { type: 'points', start: { x: 10, y: -4 }, end: { x: 15, y: -4 } })
  assert.deepEqual((moved[5] as Extract<Entity, { type: 'dimension' }>).source, { type: 'entity', targetEntityId: 'line' })
  assert.deepEqual(moved.map((entity) => entity.layerId), entities.map((entity) => entity.layerId))
})

test('multi-entity move is one history action and linked dimension follows its translated target once', () => {
  const store = new DrawingStore({ version: 1, entities })
  assert.equal(store.translateEntities(entities.map((entity) => entity.id), { x: 100, y: 0 }), true)
  const moved = store.getSnapshot().state.entities
  const dimension = moved.find((entity) => entity.id === 'linked-dim')!
  assert.equal(dimension.type, 'dimension')
  if (dimension.type === 'dimension') {
    const segment = resolveDimensionSegment(dimension, moved)!
    assert.deepEqual(segment.start, { x: 100, y: 0 })
    assert.deepEqual(buildDimensionGeometry(segment, dimension)?.start, { x: 100, y: 3 })
  }
  assert.equal(store.undo(), true)
  assert.deepEqual(store.getSnapshot().state.entities, entities)
  assert.equal(store.redo(), true)
  assert.deepEqual((store.getSnapshot().state.entities[0] as Extract<Entity, { type: 'line' }>).start, { x: 100, y: 0 })
})

test('MoveTool uses snapped destination and exact distance along one shared direction', () => {
  const tool = new MoveTool(); tool.activate()
  tool.placeBase({ x: 0, y: 0 }, null)
  const snap = { kind: 'grid' as const, point: { x: 30, y: 40 }, distancePixels: 1 }
  tool.updatePointer(snap.point, snap)
  assert.equal(tool.chooseDestination(snap.point, snap), true)
  tool.updateDistance('100')
  assert.deepEqual(tool.confirm(), { x: 60, y: 80 })
})

test('CopyTool shares the precise base, direction, and distance interaction without mutating sources', () => {
  const tool = new CopyTool(); tool.activate()
  tool.placeBase({ x: 10, y: 10 }, null)
  tool.chooseDestination({ x: 10, y: 30 }, null)
  tool.updateDistance('40')
  assert.deepEqual(tool.confirm(), { x: 0, y: 40 })
  assert.deepEqual(entities[0], { id: 'line', type: 'line', start: { x: 0, y: 0 }, end: { x: 20, y: 0 }, style: { color: '#123456', width: 2 }, layerId: 'default' })
})

test('clone helper creates new IDs, preserves style/layer, remaps linked dimensions and leaves source unchanged', () => {
  let next = 0
  const source = structuredClone(entities)
  const clones = cloneEntitiesWithNewIds(entities, { x: 50, y: 25 }, () => `new-${next++}`)
  assert.deepEqual(entities, source)
  assert.equal(new Set(clones.map((entity) => entity.id)).size, clones.length)
  assert.equal(clones[1]?.layerId, 'steel')
  assert.deepEqual(clones[1]?.style, entities[1]?.style)
  const copiedLine = clones.find((entity) => entity.type === 'line')!
  const copiedDimension = clones.find((entity) => entity.type === 'dimension' && entity.source.type === 'entity')
  assert.ok(copiedDimension?.type === 'dimension' && copiedDimension.source.type === 'entity')
  if (copiedDimension?.type === 'dimension' && copiedDimension.source.type === 'entity') assert.equal(copiedDimension.source.targetEntityId, copiedLine.id)
  const free = clones.find((entity) => entity.id === 'new-4')
  assert.ok(free?.type === 'dimension' && free.source.type === 'points')
  if (free?.type === 'dimension' && free.source.type === 'points') assert.deepEqual(free.source.start, { x: 50, y: 25 })
})

test('copying a line without explicitly selecting its dimension copies only the line', () => {
  const clones = cloneEntitiesWithNewIds([entities[0]!], { x: 10, y: 0 }, () => 'copy-line')
  assert.deepEqual(clones.map((entity) => entity.type), ['line'])
})

test('repeat creates exact groups with unique IDs and group-local dimension references', () => {
  let next = 0
  const source = [entities[0]!, entities[5]!]
  const repeated = repeatEntities(source, { x: 1, y: 0 }, 60, 5, () => `repeat-${next++}`)
  assert.equal(repeated.length, 10)
  assert.equal(new Set(repeated.map((entity) => entity.id)).size, 10)
  for (let group = 0; group < 5; group += 1) {
    const line = repeated[group * 2]!
    const dimension = repeated[group * 2 + 1]!
    assert.equal(line.type, 'line')
    assert.equal(line.type === 'line' ? line.start.x : 0, 60 * (group + 1))
    assert.ok(dimension.type === 'dimension' && dimension.source.type === 'entity')
    if (dimension.type === 'dimension' && dimension.source.type === 'entity') assert.equal(dimension.source.targetEntityId, line.id)
  }
})

test('repeat count validation enforces integer range 1 through 500', () => {
  assert.equal(validRepeatCount(1), true)
  assert.equal(validRepeatCount(MAX_REPEAT_COPIES), true)
  for (const invalid of [0, -1, 1.5, MAX_REPEAT_COPIES + 1, Number.NaN]) assert.equal(validRepeatCount(invalid), false)
  assert.deepEqual(repeatEntities([entities[0]!], { x: 1, y: 0 }, 10, 501), [])
})

test('RepeatTool accepts an angle-snapped direction and validates spacing/copies', () => {
  const manager = new SnapManager()
  const snapped = manager.resolve({ pointer: { x: 11, y: 9 }, entities: [], zoom: 1, angleOrigin: { x: 0, y: 0 }, settings: { endpoint: false, midpoint: false, grid: false, angle: true, gridSpacing: 10, pixelTolerance: 8 } })
  const tool = new RepeatTool(); tool.activate(); tool.setOrigin({ x: 0, y: 0 }); tool.chooseDirection(snapped.point, snapped.snap)
  tool.updateParameters('50', '4')
  const result = tool.confirm()!
  assert.equal(result.copies, 4); assert.equal(result.spacing, 50)
  assert.ok(Math.abs(result.direction.x - result.direction.y) < 1e-10)
  tool.updateParameters('50', '501'); assert.equal(tool.getSnapshot().canConfirm, false)
})

test('addEntities commits Copy/Repeat groups as one undoable action', () => {
  const store = new DrawingStore({ version: 1, entities: [entities[0]!] })
  const copies = repeatEntities([entities[0]!], { x: 1, y: 0 }, 20, 3)
  store.addEntities(copies)
  assert.equal(store.getSnapshot().state.entities.length, 4)
  store.undo(); assert.equal(store.getSnapshot().state.entities.length, 1)
  store.redo(); assert.equal(store.getSnapshot().state.entities.length, 4)
})

test('copied and repeated geometry with remapped dimensions uses the existing export pipeline', () => {
  const repeated = repeatEntities([entities[0]!, entities[5]!], { x: 1, y: 0 }, 30, 2)
  const model = createDrawingExportModel({ drawing: { version: 1, entities: repeated }, projectSettings: defaultProjectSettings(), layers: createBuiltInLayers() })
  assert.equal(model.labels.length, 2)
  assert.equal(model.strokes.length, 8)
})

test('locked selection blocks Move, Copy and Repeat eligibility without partial mutation', () => {
  const layers = [...createBuiltInLayers(), { id: 'steel', name: 'Steel', visible: true, locked: true }]
  assert.equal(canTransformSelection(new Set(['line']), entities, layers), true)
  assert.equal(canTransformSelection(new Set(['line', 'rect']), entities, layers), false)
  assert.equal(canTransformSelection(new Set(['linked-dim']), entities, layers), false)
  assert.equal(canTransformSelection(new Set(['line', 'linked-dim']), entities, layers), true)
  assert.equal(canTransformSelection(new Set(), entities, layers), false)
})

test('move copy and repeat commands and aliases remain registry driven', () => {
  const events: string[] = []; const noop = () => {}
  const context: CommandContext = { activateTool: (tool) => events.push(tool), deleteSelection: noop, undo: noop, redo: noop, openProjects: noop, openSettings: noop, openLayers: noop, enterFullscreen: noop, openShare: noop }
  for (const value of ['move', 'm', 'copy', 'cp', 'repeat', 'array']) assert.equal(executeCommand(value, context), true)
  assert.deepEqual(events, ['move', 'move', 'copy', 'copy', 'repeat', 'repeat'])
  assert.equal(resolveCommand('rep')?.id, 'repeat')
  assert.equal(getCommandSuggestions('mo')[0]?.id, 'move')
  assert.equal(getCommandSuggestions('co')[0]?.id, 'copy')
  assert.equal(getCommandSuggestions('arr')[0]?.id, 'repeat')
  assert.equal(commandRegistry.filter((command) => ['move', 'copy', 'repeat'].includes(command.id)).length, 3)
})

test('desktop context menu exposes the three selection transform actions', () => {
  assert.deepEqual(transformContextActions, ['move', 'copy', 'repeat'])
})

test('committed transformed state autosaves through ProjectSession', async () => {
  const now = '2026-01-01T00:00:00.000Z'
  const project: Project = { id: 'transform', name: 'Transform', version: CURRENT_PROJECT_VERSION, createdAt: now, updatedAt: now, drawing: { version: 1, entities: [entities[0]!] }, layers: createBuiltInLayers(), activeLayerId: 'default', projectSettings: defaultProjectSettings(), sync: defaultSyncMetadata() }
  let saved: Project | undefined
  const session = new ProjectSession(project, async (value) => { saved = structuredClone(value) }, 1)
  session.store.translateEntities(['line'], { x: 25, y: 0 }); await session.flush()
  assert.deepEqual((saved?.drawing.entities[0] as Extract<Entity, { type: 'line' }>).start, { x: 25, y: 0 })
  session.store.undo(); await session.flush(); assert.deepEqual(saved?.drawing.entities, [entities[0]])
})
