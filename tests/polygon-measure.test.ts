import test from 'node:test'
import assert from 'node:assert/strict'
import { createPolygonEntity, validPolygonSides, type PolygonEntity } from '../src/drawing/entities/PolygonEntity.ts'
import type { LineEntity } from '../src/drawing/entities/LineEntity.ts'
import type { RectangleEntity } from '../src/drawing/entities/RectangleEntity.ts'
import type { CircleEntity } from '../src/drawing/entities/CircleEntity.ts'
import type { ArcEntity } from '../src/drawing/entities/ArcEntity.ts'
import { getPolygonVertices, pointNearPolygonEdge, polygonBounds, polygonInteriorAngle, polygonPerimeter, polygonSideLength } from '../src/drawing/geometry/polygon.ts'
import { angleBetweenVectors, entityMeasureValues, formatMeasureAngle, getEntityMeasureSegments, intersectionAngleGeometry, pointMeasurement, supplementaryAngle } from '../src/drawing/geometry/measure.ts'
import { SelectionManager } from '../src/drawing/selection/SelectionManager.ts'
import { entitiesInSelectionBox, selectionBox } from '../src/drawing/selection/boxSelection.ts'
import { SnapManager } from '../src/drawing/snap/SnapManager.ts'
import { cloneEntitiesWithNewIds, mirrorEntity, repeatEntities, rotateEntity, translateEntity } from '../src/drawing/geometry/entityTransforms.ts'
import { DrawingStore } from '../src/project/DrawingStore.ts'
import { createDrawingExportModel } from '../src/export/DrawingExportModel.ts'
import { createDrawingSvg } from '../src/export/svgExport.ts'
import { createDrawingPdf } from '../src/export/pdfExport.ts'
import { createBuiltInLayers, entitiesOnSelectableLayers, entitiesOnVisibleLayers } from '../src/project/layers.ts'
import { CURRENT_PROJECT_VERSION, type Project } from '../src/types/project.ts'
import { defaultProjectSettings, defaultSyncMetadata, migrateProject } from '../src/project/projectMigrations.ts'
import { PolygonTool } from '../src/tools/PolygonTool.ts'
import { MeasureTool } from '../src/tools/MeasureTool.ts'
import { ToolManager } from '../src/tools/ToolManager.ts'
import { ProjectSession } from '../src/project/ProjectSession.ts'
import { getCommandSuggestions, resolveCommand } from '../src/commands/commandRegistry.ts'
import { formatDimension } from '../src/drawing/geometry/formatDimension.ts'

const style = { color: '#315c4c', width: 2 }
const polygon = createPolygonEntity({ x: 10, y: 20 }, 10, 6, 0, style)
const line = (id: string, start = { x: 0, y: 0 }, end = { x: 10, y: 0 }): LineEntity => ({ id, type: 'line', start, end, style, layerId: 'default' })

function project(entities: Project['drawing']['entities']): Project {
  return { id: 'polygon-project', name: 'Polygon', version: CURRENT_PROJECT_VERSION, createdAt: '2026-10-02T00:00:00.000Z', updatedAt: '2026-10-02T00:00:00.000Z', drawing: { version: 1, entities }, projectSettings: defaultProjectSettings(), layers: createBuiltInLayers(), activeLayerId: 'default', sync: defaultSyncMetadata() }
}

test('regular polygon helpers cover triangle, pentagon, hexagon, rotation, bounds and validation', () => {
  assert.equal(validPolygonSides(3), true)
  assert.equal(validPolygonSides(50), true)
  for (const invalid of [2, 51, 3.5, Number.NaN]) assert.equal(validPolygonSides(invalid), false)
  assert.equal(getPolygonVertices({ center: { x: 0, y: 0 }, radius: 10, sides: 3, rotation: 90 }).length, 3)
  assert.equal(getPolygonVertices({ center: { x: 0, y: 0 }, radius: 10, sides: 5, rotation: 0 }).length, 5)
  const vertices = getPolygonVertices(polygon)
  assert.equal(vertices.length, 6)
  assert.deepEqual(vertices[0], { x: 20, y: 20 })
  assert.ok(Math.abs(polygonSideLength(10, 6) - 10) < 1e-10)
  assert.ok(Math.abs(polygonPerimeter(10, 6) - 60) < 1e-10)
  assert.equal(polygonInteriorAngle(6), 120)
  const bounds = polygonBounds(polygon)
  assert.deepEqual([bounds.minX, bounds.maxX], [0, 20])
  assert.ok(Math.abs(bounds.minY - (20 - Math.sqrt(75))) < 1e-10)
  assert.ok(Math.abs(bounds.maxY - (20 + Math.sqrt(75))) < 1e-10)
  assert.equal(pointNearPolygonEdge({ x: 17.5, y: 20 + Math.sqrt(75) / 2 }, polygon, 0.01), true)
  assert.equal(pointNearPolygonEdge(polygon.center, polygon, 0.01), false)
})

test('PolygonTool validates inputs, preserves orientation and remembers the last side count in-session', () => {
  const tool = new PolygonTool()
  tool.activate()
  tool.placePoint({ x: 0, y: 0 }, null, style)
  tool.placePoint({ x: 0, y: 10 }, { kind: 'angle', point: { x: 0, y: 10 }, distancePixels: 1, angle: 90 }, style)
  assert.equal(tool.getSnapshot().sidesInput, '6')
  assert.equal(tool.getSnapshot().rotation, 90)
  tool.updateParameters('2', '100', style); assert.equal(tool.getSnapshot().canConfirm, false)
  tool.updateParameters('51', '100', style); assert.equal(tool.getSnapshot().canConfirm, false)
  tool.updateParameters('5', '100', style)
  const created = tool.confirm(style)!
  assert.deepEqual([created.sides, created.radius, created.rotation], [5, 100, 90])
  tool.placePoint({ x: 0, y: 0 }, null, style)
  tool.placePoint({ x: 20, y: 0 }, null, style)
  assert.equal(tool.getSnapshot().sidesInput, '5')
})

test('polygon selection, box selection, endpoint and midpoint snaps use derived edges', () => {
  const selection = new SelectionManager()
  const edgePoint = { x: 17.5, y: 20 + Math.sqrt(75) / 2 }
  assert.equal(selection.findEntity(edgePoint, [polygon], 2, 8)?.id, polygon.id)
  assert.equal(selection.findEntity(polygon.center, [polygon], 2, 8), null)
  assert.deepEqual(entitiesInSelectionBox(selectionBox({ x: 19, y: 19 }, { x: 21, y: 21 }), [polygon]).map((entity) => entity.id), [polygon.id])
  const manager = new SnapManager()
  const settings = { endpoint: true, midpoint: true, grid: false, angle: false, gridSpacing: 10, pixelTolerance: 5 }
  assert.equal(manager.find({ pointer: { x: 20.5, y: 20 }, entities: [polygon], zoom: 1, settings })?.kind, 'endpoint')
  assert.equal(manager.find({ pointer: edgePoint, entities: [polygon], zoom: 1, settings: { ...settings, endpoint: false } })?.kind, 'midpoint')
})

test('polygon supports layers, move, copy, repeat, rotate and mirror', () => {
  const custom = { ...polygon, layerId: 'custom' }
  const layers = [...createBuiltInLayers(), { id: 'custom', name: 'Custom', visible: true, locked: false }]
  assert.deepEqual(entitiesOnVisibleLayers([custom], layers), [custom])
  assert.deepEqual(entitiesOnSelectableLayers([custom], layers), [custom])
  const lockedLayers = layers.map((layer) => layer.id === 'custom' ? { ...layer, locked: true } : layer)
  assert.deepEqual(entitiesOnVisibleLayers([custom], lockedLayers), [custom])
  assert.deepEqual(entitiesOnSelectableLayers([custom], lockedLayers), [])
  const hiddenLayers = layers.map((layer) => layer.id === 'custom' ? { ...layer, visible: false } : layer)
  assert.deepEqual(entitiesOnVisibleLayers([custom], hiddenLayers), [])
  const store = new DrawingStore({ version: 1, entities: [custom] })
  assert.equal(store.moveEntitiesToLayer([custom.id], 'default'), true)
  assert.equal(store.getSnapshot().state.entities[0]?.layerId, 'default')
  assert.equal(store.undo(), true)
  assert.equal(store.getSnapshot().state.entities[0]?.layerId, 'custom')
  const moved = translateEntity(custom, { x: 5, y: -5 }) as PolygonEntity
  assert.deepEqual(moved.center, { x: 15, y: 15 })
  const copied = cloneEntitiesWithNewIds([custom], { x: 10, y: 0 }, () => 'copy')[0] as PolygonEntity
  assert.equal(copied.id, 'copy'); assert.deepEqual(copied.center, { x: 20, y: 20 }); assert.equal(copied.layerId, 'custom')
  assert.equal(repeatEntities([custom], { x: 1, y: 0 }, 20, 3, (() => { let id = 0; return () => `r${id++}` })()).length, 3)
  const rotated = rotateEntity(custom, custom.center, 30) as PolygonEntity
  assert.equal(rotated.rotation, 30)
  const mirrored = mirrorEntity(custom, { x: 0, y: -10 }, { x: 0, y: 10 }) as PolygonEntity
  assert.deepEqual(mirrored.center, { x: -10, y: 20 })
  assert.equal(Math.round(mirrored.rotation), 180)
})

test('polygon is serializable, undoable, autosaved, reloadable and exported as vector edges', async () => {
  const store = new DrawingStore({ version: 1, entities: [] })
  assert.equal(store.addPolygon(polygon, 'default'), true)
  assert.equal(store.undo(), true); assert.equal(store.getSnapshot().state.entities.length, 0)
  assert.equal(store.redo(), true); assert.equal(store.getSnapshot().state.entities[0]?.type, 'polygon')
  let saved: Project | null = null
  const session = new ProjectSession(project([]), async (value) => { saved = structuredClone(value) }, 1)
  session.store.addPolygon(polygon)
  await session.flush()
  assert.equal(saved?.drawing.entities[0]?.type, 'polygon')
  assert.equal(JSON.parse(JSON.stringify(saved)).drawing.entities[0].sides, 6)
  const model = createDrawingExportModel(project([polygon]))
  assert.equal(model.strokes.length, 6)
  assert.equal((createDrawingSvg(model).svg.match(/<line /g) ?? []).length, 6)
  assert.match(new TextDecoder().decode(createDrawingPdf(model)), / l S/)
})

test('version 5 projects migrate safely to the polygon-capable schema version', () => {
  const legacy = { ...project([line('legacy')]), version: 5 }
  const migrated = migrateProject(legacy)
  assert.equal(migrated.version, CURRENT_PROJECT_VERSION)
  assert.equal(migrated.drawing.entities[0]?.type, 'line')
})

test('entity measurement reports line, rectangle, circle, arc and polygon values', () => {
  const diagonal = line('diagonal', { x: 0, y: 0 }, { x: 3, y: 4 })
  const lineValues = entityMeasureValues(diagonal).map((item) => item.value)
  assert.equal(lineValues[0], 5); assert.ok(Math.abs(lineValues[1]! - 53.13010235415598) < 1e-10)
  const rectangle: RectangleEntity = { id: 'rectangle', type: 'rectangle', origin: { x: 0, y: 0 }, width: 20, height: 10, rotation: 30, style, layerId: 'default' }
  assert.deepEqual(entityMeasureValues(rectangle).map((item) => item.value), [20, 10, 30])
  assert.equal(getEntityMeasureSegments(rectangle).length, 4)
  const circle: CircleEntity = { id: 'circle', type: 'circle', center: { x: 0, y: 0 }, radius: 25, style, layerId: 'default' }
  assert.deepEqual(entityMeasureValues(circle).map((item) => item.value), [25, 50])
  const arc: ArcEntity = { id: 'arc', type: 'arc', center: { x: 0, y: 0 }, radius: 10, startAngle: 0, endAngle: 90, direction: 'ccw', style, layerId: 'default' }
  assert.deepEqual(entityMeasureValues(arc).map((item) => Number(item.value.toFixed(4))), [10, 90, 15.708])
  assert.deepEqual(entityMeasureValues(polygon).map((item) => Number(item.value.toFixed(4))), [6, 10, 10, 120])
  assert.equal(getEntityMeasureSegments(polygon).length, 6)
})

test('point and angle measurement centralize distance, deltas, acute, obtuse, parallel and connected cases', () => {
  const points = pointMeasurement({ x: 0, y: 0 }, { x: 3, y: 4 })
  assert.deepEqual({ distance: points.distance, deltaX: points.deltaX, deltaY: points.deltaY }, { distance: 5, deltaX: 3, deltaY: 4 })
  assert.ok(Math.abs(points.angle - 53.13010235415598) < 1e-10)
  assert.equal(angleBetweenVectors({ x: 1, y: 0 }, { x: 0, y: 1 }), 90)
  assert.equal(supplementaryAngle(77), 103)
  const perpendicular = intersectionAngleGeometry({ start: { x: -1, y: 0 }, end: { x: 1, y: 0 } }, { start: { x: 0, y: -1 }, end: { x: 0, y: 1 } })
  assert.equal(perpendicular.angle, 90); assert.equal(perpendicular.supplementary, 90); assert.deepEqual(perpendicular.intersection, { x: 0, y: 0 })
  const acute = intersectionAngleGeometry({ start: { x: 0, y: 0 }, end: { x: 1, y: 0 } }, { start: { x: 0, y: 0 }, end: { x: 1, y: 1 } })
  assert.ok(Math.abs(acute.angle - 45) < 1e-10); assert.equal(acute.supplementary, 135)
  const obtuseRelation = intersectionAngleGeometry({ start: { x: 0, y: 0 }, end: { x: 1, y: 0 } }, { start: { x: 0, y: 0 }, end: { x: -1, y: 1 } })
  assert.equal(Math.round(obtuseRelation.angle), 45); assert.equal(Math.round(obtuseRelation.supplementary), 135)
  assert.equal(intersectionAngleGeometry({ start: { x: 0, y: 0 }, end: { x: 1, y: 0 } }, { start: { x: 0, y: 2 }, end: { x: 1, y: 2 } }).parallel, true)
})

test('measurement formatting respects units and concise degree precision', () => {
  assert.equal(formatDimension(12.5, { dimensionDisplayUnit: 'cm', showDimensionUnit: true }), '12.5 cm')
  assert.equal(formatDimension(12.5, { dimensionDisplayUnit: 'mm', showDimensionUnit: true }), '125 mm')
  assert.equal(formatDimension(12.5, { dimensionDisplayUnit: 'cm', showDimensionUnit: false }), '12.5')
  assert.equal(formatMeasureAngle(77), '77°')
  assert.equal(formatMeasureAngle(77.1234), '77.12°')
})

test('MeasureTool remains transient and clears without drawing, history, autosave or export changes', async () => {
  const drawingProject = project([line('measured')])
  let saves = 0
  const session = new ProjectSession(drawingProject, async () => { saves += 1 }, 1)
  const tools = new ToolManager()
  tools.activate('measure')
  tools.measure.selectEntity(drawingProject.drawing.entities[0]!, { x: 5, y: 0 })
  assert.equal(tools.measure.getSnapshot().firstEntity?.entityId, 'measured')
  tools.measure.selectEntity(line('second', { x: 0, y: 0 }, { x: 0, y: 10 }), { x: 0, y: 5 })
  assert.equal(tools.measure.getSnapshot().secondEntity?.entityId, 'second')
  tools.measure.clear()
  tools.measure.selectPoint({ x: 0, y: 0 }, null)
  tools.measure.selectPoint({ x: 3, y: 4 }, null)
  assert.deepEqual(tools.measure.getSnapshot().secondPoint, { x: 3, y: 4 })
  assert.equal(session.store.getSnapshot().state.entities.length, 1)
  assert.equal(session.store.getSnapshot().canUndo, false)
  await session.flush()
  assert.equal(saves, 0)
  assert.equal(createDrawingExportModel(drawingProject).strokes.length, 1)
  tools.activate('select')
  assert.deepEqual(tools.measure.getSnapshot(), { phase: 'inactive', firstEntity: null, secondEntity: null, firstPoint: null, secondPoint: null, snap: null })
})

test('MeasureTool can compare two different edges of one rectangle or polygon', () => {
  const rectangle: RectangleEntity = { id: 'rectangle-edges', type: 'rectangle', origin: { x: 0, y: 0 }, width: 20, height: 10, rotation: 0, style, layerId: 'default' }
  const tool = new MeasureTool(); tool.activate()
  tool.selectEntity(rectangle, { x: 10, y: 0 })
  tool.selectEntity(rectangle, { x: 20, y: 5 })
  assert.ok(tool.getSnapshot().firstEntity?.segment)
  assert.ok(tool.getSnapshot().secondEntity?.segment)
  assert.equal(intersectionAngleGeometry(tool.getSnapshot().firstEntity!.segment!, tool.getSnapshot().secondEntity!.segment!).angle, 90)
})

test('polygon and measure commands resolve aliases and autocomplete prefixes', () => {
  assert.equal(resolveCommand('poly')?.id, 'polygon')
  assert.equal(resolveCommand('me')?.id, 'measure')
  assert.equal(getCommandSuggestions('pol')[0]?.id, 'polygon')
  assert.equal(getCommandSuggestions('mea')[0]?.id, 'measure')
})
