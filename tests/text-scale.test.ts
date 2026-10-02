import test from 'node:test'
import assert from 'node:assert/strict'
import { createTextEntity, validTextEntity, type TextEntity, type TextStyle } from '../src/drawing/entities/TextEntity.ts'
import { resizeTextBox, resizeTextBoxFromCorner, textBoxCorners, wrapText } from '../src/drawing/geometry/text.ts'
import { cloneEntitiesWithNewIds, mirrorEntity, repeatEntities, rotateEntity, scaleEntity, scalePoint, translateEntity } from '../src/drawing/geometry/entityTransforms.ts'
import type { Entity } from '../src/drawing/entities/Entity.ts'
import type { LineEntity } from '../src/drawing/entities/LineEntity.ts'
import type { RectangleEntity } from '../src/drawing/entities/RectangleEntity.ts'
import type { CircleEntity } from '../src/drawing/entities/CircleEntity.ts'
import type { ArcEntity } from '../src/drawing/entities/ArcEntity.ts'
import type { PolygonEntity } from '../src/drawing/entities/PolygonEntity.ts'
import type { DimensionEntity } from '../src/drawing/entities/DimensionEntity.ts'
import { SelectionManager } from '../src/drawing/selection/SelectionManager.ts'
import { entitiesInSelectionBox, selectionBox } from '../src/drawing/selection/boxSelection.ts'
import { DrawingStore } from '../src/project/DrawingStore.ts'
import { TextTool } from '../src/tools/TextTool.ts'
import { ScaleTool, validScaleFactor } from '../src/tools/ScaleTool.ts'
import { createDrawingExportModel } from '../src/export/DrawingExportModel.ts'
import { createDrawingSvg } from '../src/export/svgExport.ts'
import { createDrawingPdf } from '../src/export/pdfExport.ts'
import { calculateDrawingBounds } from '../src/export/drawingBounds.ts'
import { CURRENT_PROJECT_VERSION, type Project } from '../src/types/project.ts'
import { createBuiltInLayers } from '../src/project/layers.ts'
import { defaultProjectSettings, defaultSyncMetadata, migrateProject } from '../src/project/projectMigrations.ts'
import { ProjectSession } from '../src/project/ProjectSession.ts'
import { canTransformSelection } from '../src/tools/transformEligibility.ts'
import { getCommandSuggestions, resolveCommand } from '../src/commands/commandRegistry.ts'
import { entityMeasureValues } from '../src/drawing/geometry/measure.ts'

const textStyle: TextStyle = { fontFamily: 'Georgia', fontSize: 20, color: '#123456', fontWeight: 700, italic: true, underline: true, strikeThrough: true, textAlign: 'center', lineHeight: 1.2 }
const text = { ...createTextEntity({ x: 10, y: 20 }, 'Kitchen Wall\nSecond line', textStyle, 'notes'), id: 'text-1', box: { width: 120, height: 60 }, rotation: 15 }

function project(entities: readonly Entity[]): Project {
  return { id: 'text-project', name: 'Text', version: CURRENT_PROJECT_VERSION, createdAt: '2026-10-02T00:00:00.000Z', updatedAt: '2026-10-02T00:00:00.000Z', drawing: { version: 1, entities }, layers: [...createBuiltInLayers(), { id: 'notes', name: 'Notes', visible: true, locked: false }], activeLayerId: 'notes', projectSettings: defaultProjectSettings(), sync: defaultSyncMetadata() }
}

test('TextTool creates non-empty styled multiline text and edit/cancel keeps drafts transient', () => {
  const tool = new TextTool(); tool.activate(); tool.begin({ x: 5, y: 6 }, textStyle, 'notes')
  assert.equal(tool.confirm(), null)
  tool.update({ text: 'Kitchen Wall\nLevel 2', style: { fontFamily: 'Arial', fontSize: 18, color: '#abcdef', fontWeight: 400, italic: false, underline: false, strikeThrough: false, textAlign: 'right' } })
  const created = tool.confirm()!
  assert.equal(validTextEntity(created), true)
  assert.equal(created.layerId, 'notes'); assert.equal(created.text.includes('\n'), true); assert.equal(created.style.textAlign, 'right')
  tool.edit(text); assert.equal(tool.getSnapshot().editingId, text.id); assert.deepEqual(tool.getSnapshot().draft?.style, text.style)
  tool.update({ text: 'Changed' }); assert.equal(tool.getSnapshot().draft?.text, 'Changed')
  tool.deactivate(); assert.equal(tool.getSnapshot().draft, null)
})

test('text wrapping and manual box resize reflow without changing font size', () => {
  const wide = { ...text, text: 'one two three four five', box: { width: 140, height: 120 }, rotation: 0 }
  const narrow = resizeTextBox(wide, 55, 100)
  assert.ok(wrapText(narrow).length > wrapText(wide).length)
  assert.equal(narrow.style.fontSize, wide.style.fontSize)
  const cornerResize = resizeTextBoxFromCorner(wide, 2, { x: 80, y: -60 })
  assert.deepEqual(cornerResize.box, { width: 70, height: 80 })
  assert.equal(cornerResize.style.fontSize, 20)
})

test('text selection, box selection, layers and transforms preserve its serializable properties', () => {
  const selection = new SelectionManager()
  assert.equal(selection.findEntity({ x: 30, y: 5 }, [text], 1, 8)?.id, text.id)
  const corners = textBoxCorners(text)
  const minX = Math.min(...corners.map((point) => point.x)); const maxX = Math.max(...corners.map((point) => point.x))
  const minY = Math.min(...corners.map((point) => point.y)); const maxY = Math.max(...corners.map((point) => point.y))
  assert.deepEqual(entitiesInSelectionBox(selectionBox({ x: minX - 1, y: minY - 1 }, { x: maxX + 1, y: maxY + 1 }), [text]).map((entity) => entity.id), [text.id])
  assert.deepEqual((translateEntity(text, { x: 5, y: -3 }) as TextEntity).position, { x: 15, y: 17 })
  assert.equal((rotateEntity(text, { x: 10, y: 20 }, 30) as TextEntity).rotation, 45)
  assert.equal((mirrorEntity(text, { x: 0, y: -10 }, { x: 0, y: 10 }) as TextEntity).layerId, 'notes')
  assert.equal((cloneEntitiesWithNewIds([text], { x: 10, y: 0 }, () => 'copy')[0] as TextEntity).text, text.text)
  assert.equal(repeatEntities([text], { x: 1, y: 0 }, 10, 2, (() => { let id = 0; return () => `r${id++}` })()).length, 2)
  assert.doesNotThrow(() => JSON.parse(JSON.stringify(text)))
  assert.deepEqual(entityMeasureValues(text), [], 'Measure ignores text without creating a meaningless overlay')
})

test('text create, edit, resize and delete are individual undoable store actions and autosave', async () => {
  const store = new DrawingStore({ version: 1, entities: [] })
  assert.equal(store.addText(text), true); assert.equal(store.undo(), true); assert.equal(store.redo(), true)
  const edited = { ...text, text: 'Edited' }; assert.equal(store.replaceEntity(edited), true); assert.equal(store.undo(), true); assert.equal((store.getSnapshot().state.entities[0] as TextEntity).text, text.text)
  const resized = resizeTextBox(text, 80, 40); assert.equal(store.replaceEntity(resized), true); assert.equal(store.undo(), true); assert.deepEqual((store.getSnapshot().state.entities[0] as TextEntity).box, text.box)
  assert.equal(store.deleteEntity(text.id), true); assert.equal(store.undo(), true)
  let saved: Project | null = null
  const session = new ProjectSession(project([]), async (value) => { saved = structuredClone(value) }, 1)
  session.store.addText(text); await session.flush(); assert.equal(saved?.drawing.entities[0]?.type, 'text')
})

test('text exports to transparent PNG source and PDF with formatting, multiline content and rotated bounds', () => {
  const drawing = project([text])
  const model = createDrawingExportModel(drawing)
  assert.equal(model.texts.length, 1); assert.equal(model.texts[0]?.style.fontWeight, 700); assert.ok(model.texts[0]!.lines.length >= 2)
  const svg = createDrawingSvg(model).svg
  assert.match(svg, /Kitchen/); assert.match(svg, /Wall/); assert.match(svg, /font-style="italic"/); assert.match(svg, /line-through/); assert.doesNotMatch(svg, /text-selection-frame/)
  const pdf = new TextDecoder().decode(createDrawingPdf(model)); assert.match(pdf, /Helvetica-BoldOblique/); assert.match(pdf, /\(Kitchen\) Tj/); assert.match(pdf, /\(Wall\) Tj/)
  const bounds = calculateDrawingBounds([text], drawing.projectSettings); assert.ok(bounds.width >= 120); assert.ok(bounds.height >= 60)
})

test('scalePoint and scaleEntity support every required geometry around one pivot', () => {
  const style = { color: '#000000', width: 2 }; const pivot = { x: 10, y: 10 }
  assert.deepEqual(scalePoint({ x: 20, y: 15 }, pivot, 2), { x: 30, y: 20 })
  const entities: Entity[] = [
    { id: 'l', type: 'line', start: { x: 10, y: 10 }, end: { x: 20, y: 10 }, style, layerId: 'default' } as LineEntity,
    { id: 'r', type: 'rectangle', origin: { x: 20, y: 20 }, width: 30, height: 15, rotation: 25, style, layerId: 'default' } as RectangleEntity,
    { id: 'c', type: 'circle', center: { x: 20, y: 10 }, radius: 5, style, layerId: 'default' } as CircleEntity,
    { id: 'a', type: 'arc', center: { x: 10, y: 20 }, radius: 8, startAngle: 20, endAngle: 100, direction: 'ccw', style, layerId: 'default' } as ArcEntity,
    { id: 'p', type: 'polygon', center: { x: 20, y: 20 }, radius: 12, sides: 6, rotation: 30, style, layerId: 'default' } as PolygonEntity,
    text,
    { id: 'd', type: 'dimension', source: { type: 'points', start: { x: 10, y: 10 }, end: { x: 20, y: 10 } }, offset: 5, side: 1, style: {}, layerId: 'dimensions' } as DimensionEntity,
  ]
  const scaled = entities.map((entity) => scaleEntity(entity, pivot, 2))
  assert.deepEqual((scaled[0] as LineEntity).end, { x: 30, y: 10 })
  assert.deepEqual([(scaled[1] as RectangleEntity).width, (scaled[1] as RectangleEntity).height, (scaled[1] as RectangleEntity).rotation], [60, 30, 25])
  assert.equal((scaled[2] as CircleEntity).radius, 10); assert.equal((scaled[3] as ArcEntity).radius, 16); assert.equal((scaled[4] as PolygonEntity).radius, 24)
  const scaledText = scaled[5] as TextEntity; assert.equal(scaledText.style.fontSize, 40); assert.deepEqual(scaledText.box, { width: 240, height: 120 }); assert.equal(scaledText.layerId, 'notes')
  const freeDimension = scaled[6] as DimensionEntity; assert.equal(freeDimension.offset, 10); assert.deepEqual(freeDimension.source.type === 'points' ? freeDimension.source.end : null, { x: 30, y: 10 })
})

test('ScaleTool validates factors, previews transiently and a multi-scale is one undoable action', () => {
  for (const value of [0.1, 0.5, 1, 1.25, 2, 10]) assert.equal(validScaleFactor(value), true)
  for (const value of [0, -1, Number.NaN]) assert.equal(validScaleFactor(value), false)
  const tool = new ScaleTool(); tool.activate(); tool.placePivot({ x: 0, y: 0 }, null); tool.updatePointer({ x: 200, y: 0 }, null); tool.chooseFactor({ x: 200, y: 0 }, null)
  assert.equal(tool.getSnapshot().factor, 2); tool.updateFactor('0'); assert.equal(tool.getSnapshot().canConfirm, false); tool.updateFactor('0.5'); assert.equal(tool.confirm()?.factor, 0.5)
  const store = new DrawingStore({ version: 1, entities: [text, { id: 'line', type: 'line', start: { x: 0, y: 0 }, end: { x: 10, y: 0 }, style: { color: '#000', width: 1 }, layerId: 'default' }] })
  assert.equal(store.transformEntities(['text-1', 'line'], (entity) => scaleEntity(entity, { x: 0, y: 0 }, 2)), true)
  assert.equal((store.getSnapshot().state.entities[0] as TextEntity).style.fontSize, 40); assert.equal(store.undo(), true); assert.equal((store.getSnapshot().state.entities[0] as TextEntity).style.fontSize, 20); assert.equal(store.redo(), true)
})

test('linked dimensions derive from a scaled target, locks block scale, schema migrates and commands resolve', () => {
  const linked: DimensionEntity = { id: 'linked', type: 'dimension', source: { type: 'entity', targetEntityId: 'line' }, offset: 5, side: 1, style: {}, layerId: 'dimensions' }
  const line: LineEntity = { id: 'line', type: 'line', start: { x: 0, y: 0 }, end: { x: 10, y: 0 }, style: { color: '#000', width: 1 }, layerId: 'default' }
  assert.equal((scaleEntity(linked, { x: 0, y: 0 }, 2) as DimensionEntity).offset, 10)
  const layers = createBuiltInLayers(); assert.equal(canTransformSelection(new Set(['line', 'linked']), [line, linked], layers), true)
  assert.equal(canTransformSelection(new Set([text.id]), [text], [...layers, { id: 'notes', name: 'Notes', visible: true, locked: true }]), false)
  const { textFontFamily, textFontSize, textColor, ...legacySettings } = defaultProjectSettings(); void textFontFamily; void textFontSize; void textColor
  const legacy = { ...project([line]), version: 6, projectSettings: legacySettings }
  const migrated = migrateProject(legacy); assert.equal(migrated.version, 7); assert.equal(migrated.projectSettings.textFontFamily, 'Arial')
  assert.equal(resolveCommand('txt')?.id, 'text'); assert.equal(resolveCommand('sc')?.id, 'scale'); assert.equal(getCommandSuggestions('te')[0]?.id, 'text'); assert.equal(getCommandSuggestions('sca')[0]?.id, 'scale')
})
