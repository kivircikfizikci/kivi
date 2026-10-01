import test from 'node:test'
import assert from 'node:assert/strict'
import type { Entity } from '../src/drawing/entities/Entity.ts'
import type { LineEntity } from '../src/drawing/entities/LineEntity.ts'
import type { RectangleEntity } from '../src/drawing/entities/RectangleEntity.ts'
import { createLineExtendPlan } from '../src/drawing/geometry/extend.ts'
import {
  cloneTransformedEntitiesWithNewIds,
  mirrorEntity,
  mirrorPointAcrossLine,
  rotateEntity,
  rotatePoint,
} from '../src/drawing/geometry/entityTransforms.ts'
import { rectangleCorners } from '../src/drawing/geometry/rectangle.ts'
import { resolveDimensionSegment } from '../src/drawing/geometry/dimension.ts'
import { offsetEntity } from '../src/drawing/geometry/offset.ts'
import { createTrimPlan } from '../src/drawing/geometry/trim.ts'
import { SelectionManager } from '../src/drawing/selection/SelectionManager.ts'
import { DrawingStore } from '../src/project/DrawingStore.ts'
import { ProjectSession } from '../src/project/ProjectSession.ts'
import { migrateProject, defaultProjectSettings, defaultSyncMetadata } from '../src/project/projectMigrations.ts'
import { createBuiltInLayers, entitiesOnSelectableLayers, entitiesOnVisibleLayers } from '../src/project/layers.ts'
import { CURRENT_PROJECT_VERSION, type Project } from '../src/types/project.ts'
import { calculateDrawingBounds } from '../src/export/drawingBounds.ts'
import { createDrawingExportModel } from '../src/export/DrawingExportModel.ts'
import { executeCommand, getCommandSuggestions, resolveCommand, type CommandContext } from '../src/commands/commandRegistry.ts'
import { RotateTool } from '../src/tools/RotateTool.ts'
import { MirrorTool } from '../src/tools/MirrorTool.ts'

const style = { color: '#234f41', width: 2 }
const line: LineEntity = { id: 'line', type: 'line', start: { x: 0, y: 0 }, end: { x: 10, y: 0 }, style, layerId: 'default' }

function close(actual: number, expected: number) { assert.ok(Math.abs(actual - expected) < 1e-8, `${actual} != ${expected}`) }
function closePoint(actual: { x: number; y: number }, expected: { x: number; y: number }) { close(actual.x, expected.x); close(actual.y, expected.y) }

test('rotatePoint supports positive, diagonal, and negative world-space angles', () => {
  closePoint(rotatePoint({ x: 2, y: 0 }, { x: 0, y: 0 }, 90), { x: 0, y: 2 })
  closePoint(rotatePoint({ x: 2, y: 0 }, { x: 0, y: 0 }, 45), { x: Math.SQRT2, y: Math.SQRT2 })
  closePoint(rotatePoint({ x: 2, y: 0 }, { x: 0, y: 0 }, -90), { x: 0, y: -2 })
})

test('rotateEntity handles line, rectangle, circle, arc, and free dimensions', () => {
  const rectangle: RectangleEntity = { id: 'rect', type: 'rectangle', origin: { x: 10, y: 0 }, width: 4, height: 2, rotation: 0, style, layerId: 'default' }
  const entities: Entity[] = [
    line,
    rectangle,
    { id: 'circle', type: 'circle', center: { x: 10, y: 0 }, radius: 3, style, layerId: 'default' },
    { id: 'arc', type: 'arc', center: { x: 10, y: 0 }, radius: 3, startAngle: 0, endAngle: 90, direction: 'ccw', style, layerId: 'default' },
    { id: 'dimension', type: 'dimension', source: { type: 'points', start: { x: 0, y: 0 }, end: { x: 4, y: 0 } }, offset: 2, side: 1, style: {}, layerId: 'dimensions' },
  ]
  const rotated = entities.map((entity) => rotateEntity(entity, { x: 0, y: 0 }, 90))
  closePoint((rotated[0] as LineEntity).end, { x: 0, y: 10 })
  const rotatedRectangle = rotated[1] as RectangleEntity
  closePoint(rotatedRectangle.origin, { x: 0, y: 10 }); close(rotatedRectangle.rotation, 90)
  closePoint((rotated[2] as Extract<Entity, { type: 'circle' }>).center, { x: 0, y: 10 })
  const arc = rotated[3] as Extract<Entity, { type: 'arc' }>
  assert.deepEqual([arc.startAngle, arc.endAngle, arc.direction], [90, 180, 'ccw'])
  const dimension = rotated[4] as Extract<Entity, { type: 'dimension' }>
  assert.equal(dimension.source.type, 'points')
  if (dimension.source.type === 'points') closePoint(dimension.source.end, { x: 0, y: 4 })
})

test('rotated rectangle corners drive bounds and vector export without clipping', () => {
  const rectangle: RectangleEntity = { id: 'rect', type: 'rectangle', origin: { x: 0, y: 0 }, width: 10, height: 4, rotation: 90, style, layerId: 'default' }
  const corners = rectangleCorners(rectangle)
  closePoint(corners[1], { x: 0, y: 10 })
  closePoint(corners[3], { x: -4, y: 0 })
  const bounds = calculateDrawingBounds([rectangle], defaultProjectSettings())
  assert.ok(bounds.minX < -4 && bounds.maxY > 10)
  const model = createDrawingExportModel({ drawing: { version: 1, entities: [rectangle] }, projectSettings: defaultProjectSettings(), layers: createBuiltInLayers() })
  assert.equal(model.rectangles.length, 0)
  assert.equal(model.strokes.length, 4)
})

test('rotated rectangles remain selectable, offset correctly, and cut trim targets', () => {
  const rectangle: RectangleEntity = { id: 'rect', type: 'rectangle', origin: { x: 0, y: 0 }, width: 10, height: 4, rotation: 90, style, layerId: 'default' }
  const selection = new SelectionManager()
  assert.equal(selection.findEntity({ x: 0, y: 5 }, [rectangle], 1, 1)?.id, 'rect')
  const outward = offsetEntity(rectangle, { x: 2, y: 2 }, 2, () => 'offset')
  assert.ok(outward?.type === 'rectangle')
  if (outward?.type === 'rectangle') {
    assert.equal(outward.rotation, 90)
    assert.deepEqual([outward.width, outward.height], [14, 8])
  }
  const target: LineEntity = { ...line, id: 'target', start: { x: -10, y: 5 }, end: { x: 10, y: 5 } }
  const trim = createTrimPlan(target, [target, rectangle], { x: -2, y: 5 })
  assert.ok(trim)
})

test('mirrorPointAcrossLine handles vertical, horizontal, and diagonal axes', () => {
  closePoint(mirrorPointAcrossLine({ x: 3, y: 2 }, { x: 0, y: 0 }, { x: 0, y: 1 }), { x: -3, y: 2 })
  closePoint(mirrorPointAcrossLine({ x: 3, y: 2 }, { x: 0, y: 0 }, { x: 1, y: 0 }), { x: 3, y: -2 })
  closePoint(mirrorPointAcrossLine({ x: 3, y: 2 }, { x: 0, y: 0 }, { x: 1, y: 1 }), { x: 2, y: 3 })
})

test('mirrorEntity preserves circle radius, rectangle shape, and reverses arc direction', () => {
  const axisA = { x: 0, y: 0 }; const axisB = { x: 0, y: 10 }
  const circle = mirrorEntity({ id: 'circle', type: 'circle', center: { x: 4, y: 2 }, radius: 3, style, layerId: 'default' }, axisA, axisB)
  assert.equal(circle.type, 'circle'); if (circle.type === 'circle') { closePoint(circle.center, { x: -4, y: 2 }); assert.equal(circle.radius, 3) }
  const arc = mirrorEntity({ id: 'arc', type: 'arc', center: { x: 2, y: 0 }, radius: 2, startAngle: 0, endAngle: 90, direction: 'ccw', style, layerId: 'default' }, axisA, axisB)
  assert.equal(arc.type, 'arc'); if (arc.type === 'arc') assert.deepEqual([arc.startAngle, arc.endAngle, arc.direction], [180, 90, 'cw'])
  const rectangle: RectangleEntity = { id: 'rect', type: 'rectangle', origin: { x: 2, y: 1 }, width: 5, height: 3, rotation: 30, style, layerId: 'default' }
  const mirrored = mirrorEntity(rectangle, axisA, axisB) as RectangleEntity
  const expected = rectangleCorners(rectangle).map((point) => mirrorPointAcrossLine(point, axisA, axisB))
  const actual = rectangleCorners(mirrored)
  for (const point of expected) assert.ok(actual.some((candidate) => Math.hypot(candidate.x - point.x, candidate.y - point.y) < 1e-8))
})

test('mirror copy remaps a selected linked dimension and uses one undoable commit', () => {
  const dimension: Entity = { id: 'dimension', type: 'dimension', source: { type: 'entity', targetEntityId: 'line' }, offset: 2, side: 1, style: {}, layerId: 'dimensions' }
  let index = 0
  const clones = cloneTransformedEntitiesWithNewIds([line, dimension], (entity) => mirrorEntity(entity, { x: 20, y: 0 }, { x: 20, y: 10 }), () => `mirror-${index++}`)
  const clonedLine = clones.find((entity) => entity.type === 'line')!
  const clonedDimension = clones.find((entity) => entity.type === 'dimension')!
  assert.ok(clonedDimension.type === 'dimension' && clonedDimension.source.type === 'entity')
  if (clonedDimension.type === 'dimension' && clonedDimension.source.type === 'entity') assert.equal(clonedDimension.source.targetEntityId, clonedLine.id)
  const store = new DrawingStore({ version: 1, entities: [line, dimension] })
  assert.equal(store.addEntities(clones), true)
  assert.equal(store.undo(), true); assert.deepEqual(store.getSnapshot().state.entities, [line, dimension])
  assert.equal(store.redo(), true); assert.equal(store.getSnapshot().state.entities.length, 4)
})

test('rotate and mirror replacement are one history action with exact undo and redo', () => {
  const store = new DrawingStore({ version: 1, entities: [line] })
  store.transformEntities(['line'], (entity) => rotateEntity(entity, { x: 0, y: 0 }, 90))
  closePoint((store.getSnapshot().state.entities[0] as LineEntity).end, { x: 0, y: 10 })
  store.undo(); assert.deepEqual(store.getSnapshot().state.entities, [line])
  store.redo(); closePoint((store.getSnapshot().state.entities[0] as LineEntity).end, { x: 0, y: 10 })
})

test('mirror replacement flips an attached dimension side while preserving its target reference', () => {
  const dimension: Entity = { id: 'dimension', type: 'dimension', source: { type: 'entity', targetEntityId: 'line' }, offset: 2, side: 1, style: {}, layerId: 'dimensions' }
  const store = new DrawingStore({ version: 1, entities: [line, dimension] })
  store.transformEntities(['line', 'dimension'], (entity) => mirrorEntity(entity, { x: 0, y: 0 }, { x: 0, y: 1 }))
  const mirrored = store.getSnapshot().state.entities[1]
  assert.ok(mirrored?.type === 'dimension' && mirrored.source.type === 'entity')
  if (mirrored?.type === 'dimension' && mirrored.source.type === 'entity') {
    assert.equal(mirrored.source.targetEntityId, 'line')
    assert.equal(mirrored.side, -1)
  }
})

test('line extend chooses nearest forward line, rectangle, circle, and visible arc intersections', () => {
  const short: LineEntity = { ...line, end: { x: 5, y: 0 } }
  const lineBoundary: LineEntity = { ...line, id: 'line-boundary', start: { x: 12, y: -5 }, end: { x: 12, y: 5 } }
  const rectangle: RectangleEntity = { id: 'rect', type: 'rectangle', origin: { x: 20, y: -5 }, width: 5, height: 10, rotation: 0, style, layerId: 'default' }
  const circle: Entity = { id: 'circle', type: 'circle', center: { x: 35, y: 0 }, radius: 3, style, layerId: 'default' }
  const arc: Entity = { id: 'arc', type: 'arc', center: { x: 45, y: 0 }, radius: 3, startAngle: 90, endAngle: 270, direction: 'cw', style, layerId: 'default' }
  closePoint(createLineExtendPlan(short, [short, lineBoundary], { x: 5, y: 0 })!.replacement.end, { x: 12, y: 0 })
  closePoint(createLineExtendPlan(short, [short, rectangle], { x: 5, y: 0 })!.replacement.end, { x: 20, y: 0 })
  closePoint(createLineExtendPlan(short, [short, circle], { x: 5, y: 0 })!.replacement.end, { x: 32, y: 0 })
  closePoint(createLineExtendPlan(short, [short, arc], { x: 5, y: 0 })!.replacement.end, { x: 48, y: 0 })
})

test('line extend ignores boundaries behind the chosen endpoint and no boundary causes no mutation', () => {
  const behind: LineEntity = { ...line, id: 'behind', start: { x: -5, y: -5 }, end: { x: -5, y: 5 } }
  assert.equal(createLineExtendPlan(line, [line, behind], { x: 10, y: 0 }), null)
  const store = new DrawingStore({ version: 1, entities: [line] })
  const before = store.getSnapshot().state
  assert.equal(createLineExtendPlan(line, [line], { x: 10, y: 0 }), null)
  assert.equal(store.getSnapshot().state, before)
})

test('extend keeps the line id so its linked dimension updates and undo restores length', () => {
  const dimension: Entity = { id: 'dimension', type: 'dimension', source: { type: 'entity', targetEntityId: 'line' }, offset: 2, side: 1, style: {}, layerId: 'dimensions' }
  const boundary: LineEntity = { ...line, id: 'boundary', start: { x: 20, y: -5 }, end: { x: 20, y: 5 } }
  const plan = createLineExtendPlan(line, [line, boundary], { x: 10, y: 0 })!
  const store = new DrawingStore({ version: 1, entities: [line, dimension, boundary] })
  store.replaceEntity(plan.replacement)
  const current = store.getSnapshot().state.entities
  assert.equal(resolveDimensionSegment(current[1] as Extract<Entity, { type: 'dimension' }>, current)?.end.x, 20)
  store.undo(); assert.equal(resolveDimensionSegment(store.getSnapshot().state.entities[1] as Extract<Entity, { type: 'dimension' }>, store.getSnapshot().state.entities)?.end.x, 10)
})

test('layer filtering allows locked visible boundaries but blocks locked and hidden targets', () => {
  const layers = [...createBuiltInLayers(), { id: 'locked', name: 'Locked', visible: true, locked: true }, { id: 'hidden', name: 'Hidden', visible: false, locked: false }]
  const locked = { ...line, id: 'locked-line', layerId: 'locked' }
  const hidden = { ...line, id: 'hidden-line', layerId: 'hidden' }
  assert.deepEqual(entitiesOnVisibleLayers([locked, hidden], layers).map((entity) => entity.id), ['locked-line'])
  assert.deepEqual(entitiesOnSelectableLayers([locked, hidden], layers), [])
})

test('version 4 projects migrate rectangles with zero rotation', () => {
  const now = '2026-01-01T00:00:00.000Z'
  const legacyRectangle = { id: 'rect', type: 'rectangle', origin: { x: 1, y: 2 }, width: 3, height: 4, style, layerId: 'default' }
  const legacy = { id: 'legacy', name: 'Legacy', version: 4, createdAt: now, updatedAt: now, drawing: { version: 1, entities: [legacyRectangle] }, layers: createBuiltInLayers(), activeLayerId: 'default', projectSettings: defaultProjectSettings(), sync: defaultSyncMetadata() }
  const migrated = migrateProject(legacy)
  assert.equal(migrated.version, CURRENT_PROJECT_VERSION)
  assert.equal((migrated.drawing.entities[0] as RectangleEntity).rotation, 0)
})

test('RotateTool accepts exact signed angles and MirrorTool rejects a degenerate axis', () => {
  const rotate = new RotateTool(); rotate.activate(); rotate.placePivot({ x: 0, y: 0 }, null); rotate.chooseAngle({ x: 1, y: 1 }, null); rotate.updateAngle('-30')
  assert.equal(rotate.confirm()?.angle, -30)
  const mirror = new MirrorTool(); mirror.activate(); mirror.placeFirst({ x: 2, y: 2 }, null)
  assert.equal(mirror.placeSecond({ x: 2, y: 2 }, null), false)
  assert.equal(mirror.placeSecond({ x: 2, y: 5 }, null), true)
  assert.equal(mirror.confirm()?.keepOriginal, true)
})

test('MirrorTool exposes first-axis snap feedback and completes a valid axis', () => {
  const mirror = new MirrorTool()
  const snap = { kind: 'midpoint', point: { x: 3, y: 4 }, distancePixels: 2 } as const
  mirror.activate()
  mirror.updatePointer(snap.point, snap)
  assert.deepEqual(mirror.getSnapshot().snap, snap)
  mirror.placeFirst(snap.point, snap)
  assert.equal(mirror.placeSecond({ x: 8, y: 4 }, null), true)
  assert.deepEqual(mirror.confirm(), { axisA: snap.point, axisB: { x: 8, y: 4 }, keepOriginal: true })
})

test('rotate mirror and extend commands and aliases remain registry-driven', () => {
  const events: string[] = []; const noop = () => {}
  const context: CommandContext = { activateTool: (tool) => events.push(tool), deleteSelection: noop, undo: noop, redo: noop, openProjects: noop, openSettings: noop, openLayers: noop, enterFullscreen: noop, openShare: noop }
  for (const command of ['rotate', 'rot', 'mirror', 'mi', 'extend', 'ex']) assert.equal(executeCommand(command, context), true)
  assert.deepEqual(events, ['rotate', 'rotate', 'mirror', 'mirror', 'extend', 'extend'])
  assert.equal(resolveCommand('rot')?.id, 'rotate')
  assert.equal(getCommandSuggestions('mir')[0]?.id, 'mirror')
  assert.equal(getCommandSuggestions('ext')[0]?.id, 'extend')
})

test('rotate and extend commits autosave through the existing project session', async () => {
  const now = '2026-01-01T00:00:00.000Z'
  const project: Project = { id: 'transform-v2', name: 'Transform v2', version: CURRENT_PROJECT_VERSION, createdAt: now, updatedAt: now, drawing: { version: 1, entities: [line] }, layers: createBuiltInLayers(), activeLayerId: 'default', projectSettings: defaultProjectSettings(), sync: defaultSyncMetadata() }
  let saved: Project | undefined
  const session = new ProjectSession(project, async (value) => { saved = structuredClone(value) }, 1)
  session.store.transformEntities(['line'], (entity) => rotateEntity(entity, { x: 0, y: 0 }, 90))
  await session.flush()
  closePoint((saved!.drawing.entities[0] as LineEntity).end, { x: 0, y: 10 })
  const rotated = session.store.getSnapshot().state.entities[0] as LineEntity
  session.store.replaceEntity({ ...rotated, end: { x: 0, y: 20 } })
  await session.flush()
  closePoint((saved!.drawing.entities[0] as LineEntity).end, { x: 0, y: 20 })
})
