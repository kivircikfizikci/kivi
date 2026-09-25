import test from 'node:test'
import assert from 'node:assert/strict'
import type { DimensionEntity } from '../src/drawing/entities/DimensionEntity.ts'
import type { LineEntity } from '../src/drawing/entities/LineEntity.ts'
import { worldPointToExportPoint } from '../src/export/exportCoordinates.ts'
import { createDrawingExportModel } from '../src/export/DrawingExportModel.ts'
import { createDrawingPdf } from '../src/export/pdfExport.ts'
import { createDrawingSvg } from '../src/export/svgExport.ts'
import { defaultProjectSettings, defaultSyncMetadata } from '../src/project/projectMigrations.ts'
import { CURRENT_PROJECT_VERSION, type Project } from '../src/types/project.ts'
import { commandRegistry, executeCommand, getCommandSuggestions, resolveCommand, type CommandContext } from '../src/commands/commandRegistry.ts'
import { autosaveStatusKey, displayedAutosaveStatus } from '../src/ui/CommandBar/autosaveStatus.ts'
import { positionLengthInput } from '../src/drawing/renderer/lengthInputPosition.ts'

function line(id: string, start: { x: number; y: number }, end: { x: number; y: number }): LineEntity {
  return { id, type: 'line', start, end, style: { color: '#1a2b3c', width: 2 } }
}

function dimension(id: string, targetEntityId: string, offset = 20): DimensionEntity {
  return { id, type: 'dimension', source: { type: 'entity', targetEntityId }, offset, side: 1, style: {} }
}

function exportProject(entities: Project['drawing']['entities'], settings: Partial<Project['projectSettings']> = {}): Project {
  const timestamp = '2026-01-01T00:00:00.000Z'
  return {
    id: 'export01',
    name: 'Export checks',
    version: CURRENT_PROJECT_VERSION,
    createdAt: timestamp,
    updatedAt: timestamp,
    drawing: { version: 1, entities },
    projectSettings: { ...defaultProjectSettings(), backgroundColor: '#123456', gridColor: '#abcdef', gridEnabled: true, ...settings },
    sync: defaultSyncMetadata(),
  }
}

test('world-to-export mapping converts +Y up to +Y down exactly once', () => {
  const bounds = { minX: -12, minY: -12, maxX: 212, maxY: 112, width: 224, height: 124 }
  assert.deepEqual(worldPointToExportPoint({ x: 0, y: 0 }, bounds), { x: 12, y: 112 })
  assert.deepEqual(worldPointToExportPoint({ x: 200, y: 100 }, bounds), { x: 212, y: 12 })
})

test('asymmetric exported geometry has the same screen orientation and no background or grid', () => {
  const project = exportProject([
    line('horizontal', { x: 0, y: 0 }, { x: 200, y: 0 }),
    line('vertical', { x: 200, y: 0 }, { x: 200, y: 100 }),
  ])
  const model = createDrawingExportModel(project)
  assert.equal(model.transparent, true)
  assert.equal(model.includesGrid, false)
  assert.equal(model.labels.length, 0)
  assert.deepEqual(model.strokes[0]?.start, { x: 12, y: 112 })
  assert.deepEqual(model.strokes[0]?.end, { x: 212, y: 112 })
  assert.deepEqual(model.strokes[1]?.start, { x: 212, y: 112 })
  assert.deepEqual(model.strokes[1]?.end, { x: 212, y: 12 })

  const svg = createDrawingSvg(model).svg
  assert.doesNotMatch(svg, /<rect|#123456|#abcdef/)
  assert.match(svg, /x1="212" y1="112" x2="212" y2="12"/)

  const pdf = new TextDecoder().decode(createDrawingPdf(model))
  assert.doesNotMatch(pdf, / re f|#123456|#abcdef/)
})

test('horizontal, vertical, and diagonal dimensions share geometry and formatted labels', () => {
  const entities = [
    line('h', { x: 0, y: 0 }, { x: 275, y: 0 }),
    line('v', { x: 320, y: 0 }, { x: 320, y: 275 }),
    line('d', { x: 360, y: 0 }, { x: 460, y: 100 }),
    dimension('dh', 'h'),
    dimension('dv', 'v'),
    dimension('dd', 'd'),
  ]
  const model = createDrawingExportModel(exportProject(entities, { dimensionDisplayUnit: 'cm', showDimensionUnit: true }))
  assert.deepEqual(model.labels.map((label) => label.text), ['275 cm', '275 cm', '141.42 cm'])
  assert.equal(model.labels.length, 3)
  assert.equal(model.polygons.length, 6)
  assert.ok(model.bounds.width > 460)
  assert.ok(model.bounds.height > 275)
  const pdf = new TextDecoder().decode(createDrawingPdf(model))
  assert.match(pdf, /\(275 cm\) Tj/)
  assert.match(pdf, /\(141\.42 cm\) Tj/)
})

test('dimension labels support mm suffix and no suffix in SVG and PDF', () => {
  const entities = [line('h', { x: 0, y: 0 }, { x: 275, y: 0 }), dimension('dh', 'h')]
  const millimeters = createDrawingExportModel(exportProject(entities, { dimensionDisplayUnit: 'mm', showDimensionUnit: true }))
  assert.equal(millimeters.labels[0]?.text, '2750 mm')
  assert.match(new TextDecoder().decode(createDrawingPdf(millimeters)), /\(2750 mm\) Tj/)

  const noUnit = createDrawingExportModel(exportProject(entities, { dimensionDisplayUnit: 'cm', showDimensionUnit: false }))
  assert.equal(noUnit.labels[0]?.text, '275')
  assert.match(createDrawingSvg(noUnit).svg, />275<\/text>/)
})

test('command registry matches prefixes and aliases and executes the selected command', () => {
  assert.equal(commandRegistry.some((command) => command.id === 'share'), true)
  assert.deepEqual(getCommandSuggestions('d').slice(0, 2).map((command) => command.id), ['dim', 'delete'])
  assert.equal(resolveCommand('dimension')?.id, 'dim')
  assert.equal(resolveCommand('l')?.id, 'line')
  const events: string[] = []
  const context: CommandContext = {
    activateTool: (tool) => events.push(tool),
    deleteSelection: () => events.push('delete'),
    undo: () => events.push('undo'),
    redo: () => events.push('redo'),
    openProjects: () => events.push('projects'),
    openSettings: () => events.push('settings'),
    enterFullscreen: () => events.push('fullscreen'),
    openShare: () => events.push('share'),
  }
  assert.equal(executeCommand('l', context), true)
  assert.equal(executeCommand('unknown', context), false)
  assert.deepEqual(events, ['line'])
})

test('autosave UI maps only real session states to concise status text keys', () => {
  assert.equal(autosaveStatusKey('saving'), 'savingStatus')
  assert.equal(autosaveStatusKey('saved'), 'savedStatus')
  assert.equal(autosaveStatusKey('error'), 'saveIssue')
  assert.equal(displayedAutosaveStatus('saved', true), 'saving')
  assert.equal(autosaveStatusKey('saved', true), 'savingStatus')
})

test('desktop length input flips and clamps around viewport edges', () => {
  const viewport = { width: 800, height: 600 }
  assert.deepEqual(positionLengthInput({ x: 200, y: 150 }, viewport), { x: 214, y: 164 })
  assert.deepEqual(positionLengthInput({ x: 790, y: 590 }, viewport), { x: 524, y: 458 })
  assert.deepEqual(positionLengthInput({ x: 2, y: 2 }, { width: 220, height: 100 }), { x: 10, y: 10 })
})
