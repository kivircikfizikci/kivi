import test from 'node:test'
import assert from 'node:assert/strict'
import { SelectTool } from '../src/tools/SelectTool.ts'
import { DrawingStore } from '../src/project/DrawingStore.ts'
import type { LineEntity } from '../src/drawing/entities/LineEntity.ts'
import type { DimensionEntity } from '../src/drawing/entities/DimensionEntity.ts'
import { RectangleTool } from '../src/tools/RectangleTool.ts'
import { CircleTool } from '../src/tools/CircleTool.ts'
import { ArcTool } from '../src/tools/ArcTool.ts'
import type { RectangleEntity } from '../src/drawing/entities/RectangleEntity.ts'
import type { CircleEntity } from '../src/drawing/entities/CircleEntity.ts'
import type { ArcEntity } from '../src/drawing/entities/ArcEntity.ts'
import { SelectionManager } from '../src/drawing/selection/SelectionManager.ts'
import { angleIsOnArc, arcSweep, arcToSvgPath } from '../src/drawing/geometry/arc.ts'
import { calculateDrawingBounds } from '../src/export/drawingBounds.ts'
import { defaultProjectSettings, defaultSyncMetadata, migrateProject } from '../src/project/projectMigrations.ts'
import { createDrawingExportModel } from '../src/export/DrawingExportModel.ts'
import { createDrawingSvg } from '../src/export/svgExport.ts'
import { createDrawingPdf } from '../src/export/pdfExport.ts'
import { CURRENT_PROJECT_VERSION, type Project } from '../src/types/project.ts'
import { resolveDimensionColor } from '../src/drawing/geometry/dimensionColor.ts'
import { ProjectSession } from '../src/project/ProjectSession.ts'

const style = { color: '#234f41', width: 2 }
const line: LineEntity = { id: 'line', type: 'line', start: { x: 0, y: 0 }, end: { x: 100, y: 0 }, style }
const dimension: DimensionEntity = { id: 'dim', type: 'dimension', targetEntityId: 'line', offset: 20, side: 1, style: {} }
const rectangle: RectangleEntity = { id: 'rect', type: 'rectangle', origin: { x: 10, y: 10 }, width: 80, height: 40, style }
const circle: CircleEntity = { id: 'circle', type: 'circle', center: { x: 160, y: 40 }, radius: 30, style }
const arc: ArcEntity = { id: 'arc', type: 'arc', center: { x: 250, y: 40 }, radius: 30, startAngle: 0, endAngle: 90, direction: 'ccw', style }

function project(entities: Project['drawing']['entities'], settings = defaultProjectSettings()): Project {
  return { id: 'geometry', name: 'Geometry', version: CURRENT_PROJECT_VERSION, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z', drawing: { version: 1, entities }, projectSettings: settings, sync: defaultSyncMetadata() }
}

test('single selection clears previous items while toggle supports Ctrl, Shift, and mobile multi semantics', () => {
  const select = new SelectTool()
  select.select('line')
  select.toggleSelection('rect')
  assert.deepEqual([...select.getSelectedIds()], ['line', 'rect'])
  select.toggleSelection('line')
  assert.deepEqual([...select.getSelectedIds()], ['rect'])
  select.select('circle')
  assert.deepEqual([...select.getSelectedIds()], ['circle'])
  select.clearSelection()
  assert.equal(select.getSelectedIds().size, 0)
  select.toggleMultiMode()
  assert.equal(select.getSnapshot().multiMode, true)
})

test('multi-delete is one history action and dependent dimensions are removed once', () => {
  const store = new DrawingStore({ version: 1, entities: [line, dimension, rectangle, circle] })
  assert.equal(store.deleteEntities(['line', 'rect', 'line']), true)
  assert.deepEqual(store.getSnapshot().state.entities.map((entity) => entity.id), ['circle'])
  assert.equal(store.undo(), true)
  assert.deepEqual(store.getSnapshot().state.entities.map((entity) => entity.id), ['line', 'dim', 'rect', 'circle'])
  assert.equal(store.redo(), true)
  assert.deepEqual(store.getSnapshot().state.entities.map((entity) => entity.id), ['circle'])
})

test('rectangle tool creates semantic width and height and selection only uses edges', () => {
  const tool = new RectangleTool()
  tool.activate()
  tool.placePoint({ x: 100, y: 100 }, null, style)
  tool.placePoint({ x: 40, y: 20 }, null, style)
  tool.updateSize('240', '320', style)
  const created = tool.confirm(style)
  assert.ok(created)
  assert.deepEqual(created.origin, { x: -140, y: -220 })
  assert.equal(created.width, 240)
  assert.equal(created.height, 320)
  assert.equal(JSON.parse(JSON.stringify(created)).type, 'rectangle')
  const selection = new SelectionManager()
  assert.equal(selection.findEntity({ x: 10, y: 30 }, [rectangle], 4, 8)?.id, 'rect')
  assert.equal(selection.findEntity({ x: 50, y: 30 }, [rectangle], 4, 8), null)
})

test('circle radius and diameter modes update one serializable radius', () => {
  const tool = new CircleTool()
  tool.activate()
  tool.placePoint({ x: 0, y: 0 }, null, style)
  tool.placePoint({ x: 50, y: 0 }, null, style)
  tool.setInputMode('diameter', style)
  assert.equal(tool.getSnapshot().valueInput, '100')
  tool.updateValue('120', style)
  const created = tool.confirm(style)
  assert.ok(created)
  assert.equal(created.radius, 60)
  assert.equal(JSON.parse(JSON.stringify(created)).radius, 60)
  const selection = new SelectionManager()
  assert.equal(selection.findEntity({ x: 190, y: 40 }, [circle], 4, 8)?.id, 'circle')
  assert.equal(selection.findEntity(circle.center, [circle], 4, 8), null)
})

test('arc tool uses center-start-end and chooses the shortest direction', () => {
  const tool = new ArcTool()
  tool.activate()
  tool.placePoint({ x: 0, y: 0 }, null, style)
  tool.placePoint({ x: 10, y: 0 }, null, style)
  const created = tool.placePoint({ x: 0, y: 10 }, null, style)
  assert.ok(created)
  assert.equal(created.radius, 10)
  assert.equal(created.startAngle, 0)
  assert.equal(created.endAngle, 90)
  assert.equal(created.direction, 'ccw')
  assert.equal(arcSweep(0, 270, 'cw'), 90)
  assert.equal(angleIsOnArc(45, created), true)
  assert.equal(angleIsOnArc(225, created), false)
  assert.match(arcToSvgPath(created, (point) => ({ x: point.x, y: -point.y }), 1, true), /A 10 10 0 0 0/)
  const large: ArcEntity = { ...created, endAngle: 240, direction: 'ccw' }
  assert.match(arcToSvgPath(large, (point) => ({ x: point.x, y: -point.y }), 1, true), /A 10 10 0 1 0/)
})

test('selection finds only the visible arc sweep', () => {
  const selection = new SelectionManager()
  assert.equal(selection.findEntity({ x: 250 + Math.SQRT1_2 * 30, y: 40 + Math.SQRT1_2 * 30 }, [arc], 4, 8)?.id, 'arc')
  assert.equal(selection.findEntity({ x: 250 - 30, y: 40 }, [arc], 4, 8), null)
})

test('new entity bounds and transparent vector exports include rectangle, circle, and arc', () => {
  const entities = [rectangle, circle, arc]
  const bounds = calculateDrawingBounds(entities, defaultProjectSettings())
  assert.ok(bounds.minX < 10 && bounds.maxX > 280)
  assert.ok(bounds.maxY > 70)
  const model = createDrawingExportModel(project(entities))
  assert.deepEqual([model.rectangles.length, model.circles.length, model.arcs.length], [1, 1, 1])
  const svg = createDrawingSvg(model).svg
  assert.match(svg, /<rect /)
  assert.match(svg, /<circle /)
  assert.match(svg, /<path /)
  assert.doesNotMatch(svg, /<svg[^>]*style=|<rect[^>]*fill="#[0-9a-f]+"/i)
  const pdf = new TextDecoder().decode(createDrawingPdf(model))
  assert.match(pdf, / re S/)
  assert.match(pdf, / c S/)
})

test('rectangle, circle, and arc serialize through the existing autosave session', async () => {
  let saved: Project | null = null
  const session = new ProjectSession(project([]), async (value) => { saved = structuredClone(value) }, 1)
  session.store.addRectangle(rectangle)
  session.store.addCircle(circle)
  session.store.addArc(arc)
  await session.flush()
  assert.deepEqual(saved?.drawing.entities, [rectangle, circle, arc])
  assert.deepEqual(JSON.parse(JSON.stringify(saved?.drawing.entities)), [rectangle, circle, arc])
})

test('dimension color resolver is shared and export text has no halo', () => {
  const settings = { ...defaultProjectSettings(), dimensionColor: '#112233', showDimensionUnit: true }
  assert.equal(resolveDimensionColor(dimension, settings), '#112233')
  assert.equal(resolveDimensionColor({ ...dimension, style: { color: '#eeeeee' } }, settings), '#eeeeee')
  const explicit = { ...dimension, style: { color: '#123456' } }
  const model = createDrawingExportModel(project([line, explicit], settings))
  assert.equal(model.labels[0]?.color, '#123456')
  assert.ok(model.strokes.slice(-3).every((stroke) => stroke.color === model.labels[0]?.color))
  const svg = createDrawingSvg(model).svg
  assert.doesNotMatch(svg.match(/<text[^>]*>/)?.[0] ?? '', /stroke=|paint-order=/)
  const pdf = new TextDecoder().decode(createDrawingPdf(model))
  assert.match(pdf, /0\.0706 0\.2039 0\.3373 RG/)
  assert.match(pdf, /0\.0706 0\.2039 0\.3373 rg\n0 Tr/)
  assert.doesNotMatch(pdf, /2 Tr/)
  assert.match(pdf, /\(100 cm\) Tj/)
})

test('version 1 project records migrate to current version with a default dimension color', () => {
  const migrated = migrateProject({ ...project([]), version: 1, projectSettings: { backgroundColor: '#fff', gridColor: '#ddd', gridEnabled: true, gridSpacing: 10, dimensionDisplayUnit: 'cm', showDimensionUnit: false } })
  assert.equal(migrated.version, CURRENT_PROJECT_VERSION)
  assert.equal(migrated.projectSettings.dimensionColor, '#315c4c')
})
