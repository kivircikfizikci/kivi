import test from 'node:test'
import assert from 'node:assert/strict'
import type { ArcEntity } from '../src/drawing/entities/ArcEntity.ts'
import type { CircleEntity } from '../src/drawing/entities/CircleEntity.ts'
import type { Entity } from '../src/drawing/entities/Entity.ts'
import type { LineEntity } from '../src/drawing/entities/LineEntity.ts'
import type { RectangleEntity } from '../src/drawing/entities/RectangleEntity.ts'
import { arcArcIntersections, arcCircleIntersections, lineArcIntersections, lineCircleIntersections, lineLineIntersections } from '../src/drawing/geometry/intersections.ts'
import { offsetEntity } from '../src/drawing/geometry/offset.ts'
import { createTrimPlan } from '../src/drawing/geometry/trim.ts'
import { DrawingStore } from '../src/project/DrawingStore.ts'
import { createBuiltInLayers, entitiesOnSelectableLayers, entitiesOnVisibleLayers } from '../src/project/layers.ts'
import { executeCommand, getCommandSuggestions, resolveCommand, type CommandContext } from '../src/commands/commandRegistry.ts'
import type { ToolId } from '../src/tools/Tool.ts'
import { ProjectSession } from '../src/project/ProjectSession.ts'
import { CURRENT_PROJECT_VERSION, type Project } from '../src/types/project.ts'
import { defaultProjectSettings, defaultSyncMetadata } from '../src/project/projectMigrations.ts'
import { createDrawingExportModel } from '../src/export/DrawingExportModel.ts'
import { createDrawingSvg } from '../src/export/svgExport.ts'
import { createDrawingPdf } from '../src/export/pdfExport.ts'

const style = { color: '#234f41', width: 2 }
const horizontal: LineEntity = { id: 'line', type: 'line', start: { x: 0, y: 0 }, end: { x: 10, y: 0 }, style, layerId: 'steel' }
const rectangle: RectangleEntity = { id: 'rect', type: 'rectangle', origin: { x: 0, y: 0 }, width: 200, height: 100, style, layerId: 'steel' }
const circle: CircleEntity = { id: 'circle', type: 'circle', center: { x: 0, y: 0 }, radius: 50, style, layerId: 'steel' }
const arc: ArcEntity = { id: 'arc', type: 'arc', center: { x: 0, y: 0 }, radius: 50, startAngle: 10, endAngle: 130, direction: 'ccw', style, layerId: 'steel' }

test('line offset supports horizontal, vertical, diagonal, both sides, exact distance and preserves metadata', () => {
  const above = offsetEntity(horizontal, { x: 5, y: 2 }, 10, () => 'above')
  const below = offsetEntity(horizontal, { x: 5, y: -2 }, 10, () => 'below')
  assert.ok(above?.type === 'line' && below?.type === 'line')
  if (above?.type !== 'line' || below?.type !== 'line') return
  assert.deepEqual(above.start, { x: 0, y: 10 })
  assert.deepEqual(below.start, { x: 0, y: -10 })
  assert.equal(above.id, 'above')
  assert.equal(above.layerId, horizontal.layerId)
  assert.deepEqual(above.style, horizontal.style)

  const vertical: LineEntity = { ...horizontal, id: 'vertical', end: { x: 0, y: 10 } }
  const right = offsetEntity(vertical, { x: 2, y: 5 }, 3, () => 'right')
  assert.ok(right?.type === 'line')
  if (right?.type === 'line') assert.deepEqual(right.start, { x: 3, y: 0 })

  const diagonal: LineEntity = { ...horizontal, id: 'diagonal', end: { x: 10, y: 10 } }
  const diagonalOffset = offsetEntity(diagonal, { x: 0, y: 10 }, 5, () => 'diagonal-offset')
  assert.ok(diagonalOffset?.type === 'line')
  if (diagonalOffset?.type === 'line') assert.ok(Math.abs(Math.hypot(diagonalOffset.start.x, diagonalOffset.start.y) - 5) < 1e-9)
})

test('rectangle offset expands outward, contracts inward and rejects invalid inward geometry', () => {
  const outward = offsetEntity(rectangle, { x: -1, y: 50 }, 10, () => 'out')
  const inward = offsetEntity(rectangle, { x: 50, y: 50 }, 10, () => 'in')
  assert.ok(outward?.type === 'rectangle' && inward?.type === 'rectangle')
  if (outward?.type === 'rectangle') assert.deepEqual([outward.origin, outward.width, outward.height], [{ x: -10, y: -10 }, 220, 120])
  if (inward?.type === 'rectangle') assert.deepEqual([inward.origin, inward.width, inward.height], [{ x: 10, y: 10 }, 180, 80])
  assert.equal(offsetEntity(rectangle, { x: 50, y: 50 }, 50, () => 'invalid'), null)
})

test('circle and arc offset change only radius and reject non-positive results', () => {
  const outerCircle = offsetEntity(circle, { x: 60, y: 0 }, 10, () => 'outer-circle')
  const innerCircle = offsetEntity(circle, { x: 40, y: 0 }, 10, () => 'inner-circle')
  assert.ok(outerCircle?.type === 'circle' && innerCircle?.type === 'circle')
  if (outerCircle?.type === 'circle') assert.equal(outerCircle.radius, 60)
  if (innerCircle?.type === 'circle') assert.equal(innerCircle.radius, 40)
  assert.equal(offsetEntity(circle, { x: 1, y: 0 }, 50, () => 'invalid'), null)
  const outerArc = offsetEntity(arc, { x: 60, y: 0 }, 5, () => 'outer-arc')
  assert.ok(outerArc?.type === 'arc')
  if (outerArc?.type === 'arc') assert.deepEqual([outerArc.radius, outerArc.startAngle, outerArc.endAngle, outerArc.direction], [55, 10, 130, 'ccw'])
})

test('offset commit is one undoable and redoable history action', () => {
  const store = new DrawingStore({ version: 1, entities: [horizontal] })
  const result = offsetEntity(horizontal, { x: 0, y: 1 }, 10, () => 'offset')!
  assert.equal(store.addEntity(result), true)
  assert.deepEqual(store.getSnapshot().state.entities.map((entity) => entity.id), ['line', 'offset'])
  assert.equal(store.undo(), true)
  assert.deepEqual(store.getSnapshot().state.entities, [horizontal])
  assert.equal(store.redo(), true)
  assert.deepEqual(store.getSnapshot().state.entities.map((entity) => entity.id), ['line', 'offset'])
})

test('line-line intersections handle crossing, endpoints, parallel and finite misses', () => {
  const base = { start: { x: 0, y: 0 }, end: { x: 10, y: 0 } }
  assert.deepEqual(lineLineIntersections(base, { start: { x: 5, y: -5 }, end: { x: 5, y: 5 } })[0]?.point, { x: 5, y: 0 })
  assert.deepEqual(lineLineIntersections(base, { start: { x: 10, y: 0 }, end: { x: 10, y: 5 } })[0]?.point, { x: 10, y: 0 })
  assert.equal(lineLineIntersections(base, { start: { x: 0, y: 1 }, end: { x: 10, y: 1 } }).length, 0)
  assert.equal(lineLineIntersections(base, { start: { x: 12, y: -1 }, end: { x: 12, y: 1 } }).length, 0)
})

test('line-circle intersections handle two points, tangent and none without duplicates', () => {
  const unit = { center: { x: 0, y: 0 }, radius: 5 }
  assert.deepEqual(lineCircleIntersections({ start: { x: -10, y: 0 }, end: { x: 10, y: 0 } }, unit).map((item) => item.point), [{ x: -5, y: 0 }, { x: 5, y: 0 }])
  assert.equal(lineCircleIntersections({ start: { x: -10, y: 5 }, end: { x: 10, y: 5 } }, unit).length, 1)
  assert.equal(lineCircleIntersections({ start: { x: -10, y: 6 }, end: { x: 10, y: 6 } }, unit).length, 0)
})

test('line-arc and arc intersections accept only visible sweep points', () => {
  const upper: ArcEntity = { ...arc, id: 'upper', radius: 10, startAngle: 0, endAngle: 180 }
  const lower: ArcEntity = { ...upper, id: 'lower', startAngle: 180, endAngle: 0 }
  const vertical = { start: { x: 0, y: -20 }, end: { x: 0, y: 20 } }
  assert.equal(lineArcIntersections(vertical, upper).length, 1)
  assert.equal(lineArcIntersections(vertical, lower).length, 1)
  assert.ok(lineArcIntersections(vertical, upper)[0]!.point.y > 0)
  assert.ok(lineArcIntersections(vertical, lower)[0]!.point.y < 0)
  const cutterCircle = { center: { x: 10, y: 0 }, radius: 10 }
  assert.equal(arcCircleIntersections(upper, cutterCircle).length, 1)
  const cutterArc: ArcEntity = { ...upper, id: 'cutter', center: { x: 10, y: 0 }, startAngle: 0, endAngle: 180 }
  assert.equal(arcArcIntersections(upper, cutterArc).length, 1)
})

test('line trim chooses endpoint, middle, split and 3+ intersection intervals deterministically', () => {
  const cutter = (id: string, x: number): LineEntity => ({ id, type: 'line', start: { x, y: -5 }, end: { x, y: 5 }, style, layerId: 'default' })
  const one = createTrimPlan(horizontal, [cutter('a', 4)], { x: 1, y: 0 }, () => 'new')
  assert.ok(one)
  assert.deepEqual(one?.replacements.map((item) => item.type === 'line' ? [item.start.x, item.end.x] : []), [[4, 10]])
  const middle = createTrimPlan(horizontal, [cutter('a', 3), cutter('b', 7)], { x: 5, y: 0 }, () => 'split')
  assert.deepEqual(middle?.replacements.map((item) => item.type === 'line' ? [item.id, item.start.x, item.end.x] : []), [['line', 0, 3], ['split', 7, 10]])
  const many = createTrimPlan(horizontal, [cutter('a', 2), cutter('b', 5), cutter('c', 8)], { x: 6, y: 0 }, () => 'right')
  assert.deepEqual(many?.replacements.map((item) => item.type === 'line' ? [item.start.x, item.end.x] : []), [[0, 5], [8, 10]])
  const endpoint = createTrimPlan(horizontal, [cutter('a', 4)], { x: 9, y: 0 })
  assert.deepEqual(endpoint?.replacements.map((item) => item.type === 'line' ? [item.start.x, item.end.x] : []), [[0, 4]])
  const fullyBounded = createTrimPlan(horizontal, [cutter('start', 0), cutter('end', 10)], { x: 5, y: 0 })
  assert.deepEqual(fullyBounded?.replacements, [])
  assert.equal(createTrimPlan(horizontal, [], { x: 5, y: 0 }), null)
})

test('rectangle edges cut a line without modifying the rectangle entity', () => {
  const target: LineEntity = { ...horizontal, start: { x: -5, y: 5 }, end: { x: 15, y: 5 }, layerId: 'default' }
  const cutter: RectangleEntity = { ...rectangle, origin: { x: 0, y: 0 }, width: 10, height: 10, layerId: 'default' }
  const plan = createTrimPlan(target, [cutter], { x: 5, y: 5 }, () => 'right')
  assert.deepEqual(plan?.replacements.map((item) => item.type === 'line' ? [item.start.x, item.end.x] : []), [[-5, 0], [10, 15]])
  assert.deepEqual(cutter, { ...rectangle, origin: { x: 0, y: 0 }, width: 10, height: 10, layerId: 'default' })
})

test('arc trim preserves sweep direction and removes only the clicked visible portion', () => {
  const target: ArcEntity = { ...arc, id: 'target-arc', radius: 10, startAngle: 0, endAngle: 180, layerId: 'default' }
  const left: LineEntity = { ...horizontal, id: 'left', start: { x: -5, y: -20 }, end: { x: -5, y: 20 }, layerId: 'default' }
  const right: LineEntity = { ...left, id: 'right', start: { x: 5, y: -20 }, end: { x: 5, y: 20 } }
  const plan = createTrimPlan(target, [left, right], { x: 0, y: 10 }, () => 'second-arc')
  assert.ok(plan)
  assert.equal(plan?.replacements.length, 2)
  assert.ok(Math.abs((plan?.replacements[0] as ArcEntity).endAngle - 60) < 1e-7)
  assert.ok(Math.abs((plan?.replacements[1] as ArcEntity).startAngle - 120) < 1e-7)
  assert.ok(plan?.replacements.every((item) => item.type === 'arc' && item.direction === 'ccw'))
})

test('visible locked geometry can cut, hidden geometry is ignored, and locked geometry is not a target', () => {
  const layers = [...createBuiltInLayers(), { id: 'locked', name: 'Locked', visible: true, locked: true }, { id: 'hidden', name: 'Hidden', visible: false, locked: false }]
  const lockedCutter: LineEntity = { ...horizontal, id: 'locked-cutter', start: { x: 3, y: -5 }, end: { x: 3, y: 5 }, layerId: 'locked' }
  const hiddenCutter: LineEntity = { ...lockedCutter, id: 'hidden-cutter', start: { x: 7, y: -5 }, end: { x: 7, y: 5 }, layerId: 'hidden' }
  const entities: Entity[] = [{ ...horizontal, layerId: 'default' }, lockedCutter, hiddenCutter]
  const visible = entitiesOnVisibleLayers(entities, layers)
  const selectable = entitiesOnSelectableLayers(entities, layers)
  assert.deepEqual(visible.map((entity) => entity.id), ['line', 'locked-cutter'])
  assert.deepEqual(selectable.map((entity) => entity.id), ['line'])
  assert.ok(createTrimPlan(selectable[0] as LineEntity, visible, { x: 1, y: 0 }))
})

test('trim mutation removes linked dimensions in the same history action and keeps free dimensions', () => {
  const cutter: LineEntity = { ...horizontal, id: 'cutter', start: { x: 4, y: -5 }, end: { x: 4, y: 5 }, layerId: 'default' }
  const target = { ...horizontal, layerId: 'default' }
  const linked: Entity = { id: 'linked', type: 'dimension', source: { type: 'entity', targetEntityId: target.id }, offset: 2, side: 1, style: {}, layerId: 'dimensions' }
  const free: Entity = { id: 'free', type: 'dimension', source: { type: 'points', start: { x: 0, y: 2 }, end: { x: 10, y: 2 } }, offset: 2, side: 1, style: {}, layerId: 'dimensions' }
  const initial = { version: 1 as const, entities: [target, cutter, linked, free] }
  const store = new DrawingStore(initial)
  const plan = createTrimPlan(target, [cutter], { x: 1, y: 0 })!
  assert.equal(store.applyTrim(plan.targetId, plan.replacements), true)
  assert.equal(store.getSnapshot().state.entities.some((entity) => entity.id === 'linked'), false)
  assert.equal(store.getSnapshot().state.entities.some((entity) => entity.id === 'free'), true)
  assert.equal(store.undo(), true)
  assert.deepEqual(store.getSnapshot().state, initial)
  assert.equal(store.redo(), true)
  assert.equal(store.getSnapshot().state.entities.some((entity) => entity.id === 'linked'), false)
})

test('offset and trim commits autosave and export only final committed geometry', async () => {
  const cutter: LineEntity = { ...horizontal, id: 'cutter', start: { x: 4, y: -5 }, end: { x: 4, y: 5 }, layerId: 'default' }
  const target = { ...horizontal, layerId: 'default' }
  const now = '2026-01-01T00:00:00.000Z'
  const project: Project = {
    id: 'offset-trim', name: 'Offset Trim', version: CURRENT_PROJECT_VERSION, createdAt: now, updatedAt: now,
    drawing: { version: 1, entities: [target, cutter] }, layers: createBuiltInLayers(), activeLayerId: 'default',
    projectSettings: defaultProjectSettings(), sync: defaultSyncMetadata(),
  }
  let saved: Project | null = null
  const session = new ProjectSession(project, async (value) => { saved = structuredClone(value) }, 1)
  const offset = offsetEntity(target, { x: 2, y: 2 }, 2, () => 'offset-line')!
  session.store.addEntity(offset)
  const plan = createTrimPlan(target, [cutter], { x: 1, y: 0 })!
  session.store.applyTrim(plan.targetId, plan.replacements)
  await session.flush()
  assert.ok(saved)
  const committed = saved as unknown as Project
  assert.ok(committed.drawing.entities.some((entity) => entity.id === 'offset-line'))
  assert.equal(committed.drawing.entities.some((entity) => entity.id.startsWith('trim-preview-')), false)
  const model = createDrawingExportModel(committed)
  assert.equal(model.transparent, true)
  assert.equal(model.includesGrid, false)
  assert.match(createDrawingSvg(model).svg, /<line /)
  assert.match(new TextDecoder().decode(createDrawingPdf(model)), /^%PDF-/)
})

test('offset and trim commands, aliases and autocomplete stay registry-driven', () => {
  const activated: ToolId[] = []
  const noop = () => {}
  const context: CommandContext = { activateTool: (tool) => activated.push(tool), deleteSelection: noop, undo: noop, redo: noop, openProjects: noop, openSettings: noop, openLayers: noop, enterFullscreen: noop, openShare: noop }
  assert.equal(executeCommand('of', context), true)
  assert.equal(executeCommand('tr', context), true)
  assert.deepEqual(activated, ['offset', 'trim'])
  assert.equal(resolveCommand('offset')?.id, 'offset')
  assert.equal(resolveCommand('trim')?.id, 'trim')
  assert.equal(getCommandSuggestions('off')[0]?.id, 'offset')
  assert.equal(getCommandSuggestions('tri')[0]?.id, 'trim')
})
