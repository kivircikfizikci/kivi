import test from 'node:test'
import assert from 'node:assert/strict'
import { distance } from '../src/drawing/geometry/distance.ts'
import { projectPointToSegment } from '../src/drawing/geometry/projection.ts'
import { snapPointToAngles } from '../src/drawing/geometry/angle.ts'
import { DEFAULT_CAMERA } from '../src/drawing/camera/Camera.ts'
import { cameraForGesture, screenToWorld, worldToScreen, zoomCameraAt } from '../src/drawing/camera/coordinateTransforms.ts'
import { SnapManager } from '../src/drawing/snap/SnapManager.ts'
import { SelectionManager } from '../src/drawing/selection/SelectionManager.ts'
import { LineTool } from '../src/tools/LineTool.ts'
import { DrawingStore } from '../src/project/DrawingStore.ts'
import type { LineEntity } from '../src/drawing/entities/LineEntity.ts'

const line: LineEntity = {
  id: 'line-1',
  type: 'line',
  start: { x: 0, y: 0 },
  end: { x: 20, y: 0 },
  style: { color: '#000000', width: 2 },
}

test('geometry distance and segment projection are exact', () => {
  assert.equal(distance({ x: 0, y: 0 }, { x: 3, y: 4 }), 5)
  const projection = projectPointToSegment({ x: 6, y: 4 }, { x: 0, y: 0 }, { x: 10, y: 0 })
  assert.deepEqual(projection.point, { x: 6, y: 0 })
  assert.equal(projection.distanceSquared, 16)
})

test('camera transforms round-trip and zoom stays anchored at the cursor', () => {
  const viewport = { width: 800, height: 600 }
  const world = { x: 37, y: -12 }
  assert.deepEqual(screenToWorld(worldToScreen(world, DEFAULT_CAMERA, viewport), DEFAULT_CAMERA, viewport), world)

  const focus = { x: 170, y: 220 }
  const before = screenToWorld(focus, DEFAULT_CAMERA, viewport)
  const zoomed = zoomCameraAt(DEFAULT_CAMERA, focus, 12, viewport)
  const after = screenToWorld(focus, zoomed, viewport)
  assert.ok(distance(before, after) < 1e-10)
})

test('two-finger gesture preserves its world focus while scaling and panning', () => {
  const viewport = { width: 600, height: 500 }
  const initialFocus = { x: 200, y: 200 }
  const currentFocus = { x: 240, y: 230 }
  const anchored = screenToWorld(initialFocus, DEFAULT_CAMERA, viewport)
  const camera = cameraForGesture(DEFAULT_CAMERA, initialFocus, currentFocus, 2, viewport)
  assert.ok(distance(anchored, screenToWorld(currentFocus, camera, viewport)) < 1e-10)
  assert.equal(camera.zoom, 8)
})

test('45 degree angle snap preserves pointer distance', () => {
  const origin = { x: 0, y: 0 }
  const pointer = { x: 10, y: 9 }
  const snapped = snapPointToAngles(origin, pointer)
  assert.equal(snapped?.angle, 45)
  assert.ok(snapped)
  assert.ok(Math.abs(distance(origin, snapped.point) - distance(origin, pointer)) < 1e-10)
  assert.ok(Math.abs(snapped.point.x - snapped.point.y) < 1e-10)
})

test('snap priority is endpoint, midpoint, grid, then angle', () => {
  const manager = new SnapManager()
  const base = {
    entities: [line],
    zoom: 4,
    angleOrigin: { x: 0, y: 0 },
    settings: {
      endpoint: true,
      midpoint: true,
      grid: true,
      angle: true,
      gridSpacing: 10,
      pixelTolerance: 8,
    },
  }

  assert.equal(manager.find({ ...base, pointer: { x: 0.5, y: 0.2 } })?.kind, 'endpoint')
  assert.equal(manager.find({ ...base, pointer: { x: 10.5, y: 0.2 } })?.kind, 'midpoint')
  assert.equal(manager.find({ ...base, entities: [], pointer: { x: 9.5, y: 10.2 } })?.kind, 'grid')
  assert.equal(manager.find({ ...base, entities: [], pointer: { x: 14, y: 13 }, settings: { ...base.settings, grid: false } })?.kind, 'angle')
})

test('exact length entry wins and continuous line starts at the committed endpoint', () => {
  const tool = new LineTool()
  tool.activate()
  tool.placePoint({ x: 0, y: 0 }, null)
  tool.placePoint({ x: 10, y: 10 }, { kind: 'angle', point: { x: 10, y: 10 }, distancePixels: 0, angle: 45 })
  tool.updateLength('275')
  const preview = tool.getSnapshot()
  assert.ok(preview.start && preview.end)
  assert.ok(Math.abs(distance(preview.start, preview.end) - 275) < 1e-10)
  assert.ok(Math.abs(preview.end.x - preview.end.y) < 1e-10)

  const committed = tool.confirm({ color: '#000000', width: 2 })
  assert.ok(committed)
  assert.deepEqual(tool.getSnapshot().start, committed.end)
  assert.equal(tool.getSnapshot().phase, 'placing')
})

test('line selection tolerance remains screen-pixel based', () => {
  const selection = new SelectionManager()
  assert.equal(selection.findLine({ x: 5, y: 1 }, [line], 8, 8)?.id, line.id)
  assert.equal(selection.findLine({ x: 5, y: 1.1 }, [line], 8, 8), null)
  assert.equal(selection.findLine({ x: 5, y: 2 }, [line], 4, 8)?.id, line.id)
})

test('history records create and delete but supports undo and redo', () => {
  const store = new DrawingStore()
  store.addLine(line)
  assert.equal(store.getSnapshot().state.entities.length, 1)
  assert.equal(store.deleteEntity(line.id), true)
  assert.equal(store.getSnapshot().state.entities.length, 0)
  assert.equal(store.undo(), true)
  assert.equal(store.getSnapshot().state.entities.length, 1)
  assert.equal(store.undo(), true)
  assert.equal(store.getSnapshot().state.entities.length, 0)
  assert.equal(store.redo(), true)
  assert.equal(store.getSnapshot().state.entities.length, 1)
})
