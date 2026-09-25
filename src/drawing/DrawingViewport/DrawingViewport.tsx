import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
} from 'react'
import { DEFAULT_CAMERA, type Camera } from '../camera/Camera.ts'
import {
  cameraForGesture,
  panCamera,
  screenToWorld,
  worldToScreen,
  zoomCameraAt,
  type ViewportSize,
} from '../camera/coordinateTransforms.ts'
import type { Point } from '../geometry/Point.ts'
import { GridRenderer } from '../renderer/GridRenderer.tsx'
import { LengthInput } from '../renderer/LengthInput.tsx'
import { LineRenderer } from '../renderer/LineRenderer.tsx'
import { DimensionRenderer } from '../renderer/DimensionRenderer.tsx'
import { PreviewRenderer } from '../renderer/PreviewRenderer.tsx'
import { SnapIndicatorRenderer } from '../renderer/SnapIndicatorRenderer.tsx'
import { SelectionManager, SELECTION_TOLERANCE_MOUSE_PX, SELECTION_TOLERANCE_TOUCH_PX } from '../selection/SelectionManager.ts'
import { SnapManager } from '../snap/SnapManager.ts'
import { useI18n } from '../../i18n/I18nContext'
import { useSettings } from '../../settings/useSettings'
import type { DrawingStore } from '../../project/DrawingStore.ts'
import type { WorkspaceMode } from '../../project/ProjectSession.ts'
import type { ToolManager } from '../../tools/ToolManager.ts'
import type { Layer, ProjectSettings } from '../../types/project.ts'
import { Icon } from '../../ui/Icon/Icon.tsx'
import { positionLengthInput } from '../renderer/lengthInputPosition.ts'
import { RectangleRenderer } from '../renderer/RectangleRenderer.tsx'
import { CircleRenderer } from '../renderer/CircleRenderer.tsx'
import { ArcRenderer } from '../renderer/ArcRenderer.tsx'
import { RectangleInput } from '../renderer/RectangleInput.tsx'
import { CircleInput } from '../renderer/CircleInput.tsx'
import { entitiesOnSelectableLayers, entitiesOnVisibleLayers, DIMENSIONS_LAYER_ID } from '../../project/layers.ts'
import { DrawingContextMenu, type ContextMenuPosition } from '../../ui/ContextMenu/DrawingContextMenu.tsx'
import { selectionForContextTarget } from '../selection/contextSelection.ts'
import { geometryStyleFromProject } from '../entities/geometryStyle.ts'
import { resolveDimensionSegment } from '../geometry/dimension.ts'
import { SnapQuickControls } from '../../ui/SnapQuickControls/SnapQuickControls.tsx'

interface DrawingViewportProps {
  store: DrawingStore
  tools: ToolManager
  projectSettings: ProjectSettings
  layers: readonly Layer[]
  activeLayerId: string
  initialCamera?: Camera
  onCameraSettled: (camera: Camera) => void
  mode?: WorkspaceMode
  onEnterFullscreen?: () => void
  onMoveSelection: (layerId: string) => void
  onDeleteSelection: () => void
}

interface TrackedPointer extends Point {
  pointerType: string
}

interface GestureStart {
  ids: [number, number]
  first: Point
  second: Point
  camera: Camera
}

export function DrawingViewport({ store, tools, projectSettings, layers, activeLayerId, initialCamera, onCameraSettled, mode = 'edit', onEnterFullscreen, onMoveSelection, onDeleteSelection }: DrawingViewportProps) {
  const { t } = useI18n()
  const { settings } = useSettings()
  const drawing = useSyncExternalStore(store.subscribe, store.getSnapshot)
  const activeTool = useSyncExternalStore(tools.subscribe, tools.getSnapshot)
  const line = useSyncExternalStore(tools.line.subscribe, tools.line.getSnapshot)
  const dimension = useSyncExternalStore(tools.dimension.subscribe, tools.dimension.getSnapshot)
  const rectangle = useSyncExternalStore(tools.rectangle.subscribe, tools.rectangle.getSnapshot)
  const circle = useSyncExternalStore(tools.circle.subscribe, tools.circle.getSnapshot)
  const arc = useSyncExternalStore(tools.arc.subscribe, tools.arc.getSnapshot)
  const selection = useSyncExternalStore(tools.select.subscribe, tools.select.getSnapshot)
  const [camera, setCamera] = useState(initialCamera ?? DEFAULT_CAMERA)
  const [viewport, setViewport] = useState<ViewportSize>({ width: 1, height: 1 })
  const [contextMenu, setContextMenu] = useState<ContextMenuPosition | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const pointers = useRef(new Map<number, TrackedPointer>())
  const middlePointer = useRef<number | null>(null)
  const gesture = useRef<GestureStart | null>(null)
  const gestureConsumed = useRef(false)
  const snapManager = useMemo(() => new SnapManager(), [])
  const selectionManager = useMemo(() => new SelectionManager(), [])
  const visibleEntities = useMemo(() => entitiesOnVisibleLayers(drawing.state.entities, layers), [drawing.state.entities, layers])
  const selectableEntities = useMemo(() => entitiesOnSelectableLayers(drawing.state.entities, layers), [drawing.state.entities, layers])
  const lineStyle = useMemo(() => geometryStyleFromProject(projectSettings), [projectSettings])
  const targetLayers = useMemo(() => layers.filter((layer) => layer.id !== DIMENSIONS_LAYER_ID && layer.visible && !layer.locked), [layers])

  useEffect(() => {
    const allowed = new Set(selectableEntities.map((entity) => entity.id))
    const next = [...selection.selectedIds].filter((id) => allowed.has(id))
    if (next.length !== selection.selectedIds.size) tools.select.setSelection(next)
    if (dimension.source?.type === 'entity' && !allowed.has(dimension.source.targetEntityId)) tools.dimension.activate()
  }, [dimension.source, selectableEntities, selection.selectedIds, tools.dimension, tools.select])

  useEffect(() => { setContextMenu(null) }, [activeTool])

  useEffect(() => {
    const element = containerRef.current
    if (!element) return
    const updateSize = () => setViewport({ width: element.clientWidth, height: element.clientHeight })
    updateSize()
    const observer = new ResizeObserver(updateSize)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => onCameraSettled(camera), 600)
    return () => clearTimeout(timer)
  }, [camera, onCameraSettled])

  const toScreenPoint = useCallback((event: { clientX: number; clientY: number }): Point => {
    const bounds = svgRef.current!.getBoundingClientRect()
    return { x: event.clientX - bounds.left, y: event.clientY - bounds.top }
  }, [])

  const resolveSnap = useCallback((screenPoint: Point, pointerType: string) => {
    const worldPoint = screenToWorld(screenPoint, camera, viewport)
    const tolerance = pointerType === 'touch' ? SELECTION_TOLERANCE_TOUCH_PX : 10
    return snapManager.resolve({
      pointer: worldPoint,
      entities: visibleEntities,
      zoom: camera.zoom,
      angleOrigin: dimension.firstPoint ?? line.start ?? rectangle.start ?? circle.center ?? arc.center ?? undefined,
      settings: {
        endpoint: settings.endpointSnapEnabled,
        midpoint: settings.midpointSnapEnabled,
        grid: settings.gridSnapEnabled,
        angle: settings.angleSnapEnabled,
        gridSpacing: projectSettings.gridSpacing,
        pixelTolerance: tolerance,
      },
    })
  }, [arc.center, camera, circle.center, dimension.firstPoint, line.start, projectSettings.gridSpacing, rectangle.start, settings, snapManager, viewport, visibleEntities])

  const handleSinglePoint = useCallback((screenPoint: Point, pointerType: string, toggleSelection: boolean) => {
    if (mode === 'view') return
    const worldPoint = screenToWorld(screenPoint, camera, viewport)
    if (activeTool === 'line') {
      const resolved = resolveSnap(screenPoint, pointerType)
      tools.line.placePoint(resolved.point, resolved.snap)
      return
    }

    const style = lineStyle
    if (activeTool === 'rectangle') {
      const resolved = resolveSnap(screenPoint, pointerType)
      tools.rectangle.placePoint(resolved.point, resolved.snap, style)
      return
    }
    if (activeTool === 'circle') {
      const resolved = resolveSnap(screenPoint, pointerType)
      tools.circle.placePoint(resolved.point, resolved.snap, style)
      return
    }
    if (activeTool === 'arc') {
      const resolved = resolveSnap(screenPoint, pointerType)
      const placed = tools.arc.placePoint(resolved.point, resolved.snap, style)
      if (placed) store.addArc(placed, activeLayerId)
      return
    }

    if (activeTool === 'dimension') {
      const snapshot = tools.dimension.getSnapshot()
      if (snapshot.phase === 'waitingFirst') {
        const resolved = resolveSnap(screenPoint, pointerType)
        const tolerance = pointerType === 'touch' ? SELECTION_TOLERANCE_TOUCH_PX : SELECTION_TOLERANCE_MOUSE_PX
        const target = selectionManager.findLine(worldPoint, selectableEntities, camera.zoom, tolerance)
        tools.dimension.begin(target, target ? worldPoint : resolved.point, target ? null : resolved.snap)
        if (target) {
          tools.dimension.position(worldPoint, 20 / camera.zoom)
        }
      } else if (snapshot.phase === 'waitingSecond') {
        const resolved = resolveSnap(screenPoint, pointerType)
        if (tools.dimension.chooseSecondPoint(resolved.point, resolved.snap)) {
          tools.dimension.position(worldPoint, 20 / camera.zoom)
        }
      } else {
        tools.dimension.position(worldPoint, 20 / camera.zoom)
        const placed = tools.dimension.place()
        if (placed) store.addDimension(placed)
      }
      return
    }

    const tolerance = pointerType === 'touch' ? SELECTION_TOLERANCE_TOUCH_PX : SELECTION_TOLERANCE_MOUSE_PX
    const entity = selectionManager.findEntity(worldPoint, selectableEntities, camera.zoom, tolerance)
    const toggle = toggleSelection || (pointerType === 'touch' && selection.multiMode)
    if (entity && toggle) tools.select.toggleSelection(entity.id)
    else tools.select.select(entity?.id ?? null)
  }, [activeLayerId, activeTool, camera, lineStyle, mode, resolveSnap, selectableEntities, selection.multiMode, selectionManager, store, tools, viewport])

  const onPointerDown = (event: ReactPointerEvent<SVGSVGElement>) => {
    const point = toScreenPoint(event)
    event.currentTarget.setPointerCapture(event.pointerId)
    pointers.current.set(event.pointerId, { ...point, pointerType: event.pointerType })

    if (event.pointerType === 'mouse' && event.button === 1) {
      middlePointer.current = event.pointerId
      event.preventDefault()
      return
    }

    const touches = [...pointers.current.entries()].filter(([, pointer]) => pointer.pointerType === 'touch')
    if (touches.length === 2) {
      const first = touches[0]!
      const second = touches[1]!
      gesture.current = {
        ids: [first[0], second[0]],
        first: { x: first[1].x, y: first[1].y },
        second: { x: second[1].x, y: second[1].y },
        camera,
      }
      gestureConsumed.current = true
    }
  }

  const onPointerMove = (event: ReactPointerEvent<SVGSVGElement>) => {
    const point = toScreenPoint(event)
    const previous = pointers.current.get(event.pointerId)
    if (previous) pointers.current.set(event.pointerId, { ...point, pointerType: event.pointerType })

    if (middlePointer.current === event.pointerId && previous) {
      setCamera((current) => panCamera(current, { x: point.x - previous.x, y: point.y - previous.y }))
      return
    }

    if (gesture.current) {
      const first = pointers.current.get(gesture.current.ids[0])
      const second = pointers.current.get(gesture.current.ids[1])
      if (first && second) {
        const initialDistance = Math.hypot(
          gesture.current.second.x - gesture.current.first.x,
          gesture.current.second.y - gesture.current.first.y,
        )
        const currentDistance = Math.hypot(second.x - first.x, second.y - first.y)
        const initialFocus = midpoint(gesture.current.first, gesture.current.second)
        const currentFocus = midpoint(first, second)
        setCamera(cameraForGesture(gesture.current.camera, initialFocus, currentFocus, currentDistance / initialDistance, viewport))
      }
      return
    }

    if (mode === 'edit' && activeTool === 'line' && line.phase === 'placing') {
      const resolved = resolveSnap(point, event.pointerType)
      tools.line.updatePointer(resolved.point, resolved.snap)
    } else if (mode === 'edit' && activeTool === 'rectangle' && rectangle.phase === 'placing') {
      const resolved = resolveSnap(point, event.pointerType)
      tools.rectangle.updatePointer(resolved.point, resolved.snap, lineStyle)
    } else if (mode === 'edit' && activeTool === 'circle' && circle.phase === 'placing') {
      const resolved = resolveSnap(point, event.pointerType)
      tools.circle.updatePointer(resolved.point, resolved.snap, lineStyle)
    } else if (mode === 'edit' && activeTool === 'arc' && arc.phase !== 'center') {
      const resolved = resolveSnap(point, event.pointerType)
      tools.arc.updatePointer(resolved.point, resolved.snap, lineStyle)
    } else if (mode === 'edit' && activeTool === 'dimension' && dimension.phase === 'waitingSecond') {
      const resolved = resolveSnap(point, event.pointerType)
      tools.dimension.updateSecondPoint(resolved.point, resolved.snap)
    } else if (mode === 'edit' && activeTool === 'dimension' && dimension.phase === 'positioning') {
      tools.dimension.position(screenToWorld(point, camera, viewport), 20 / camera.zoom)
    }
  }

  const endPointer = (event: ReactPointerEvent<SVGSVGElement>, cancelled: boolean) => {
    const point = toScreenPoint(event)
    const wasMiddle = middlePointer.current === event.pointerId
    pointers.current.delete(event.pointerId)
    if (wasMiddle) middlePointer.current = null

    if (gesture.current || gestureConsumed.current) {
      const remainingTouches = [...pointers.current.values()].some((pointer) => pointer.pointerType === 'touch')
      if (!remainingTouches) {
        gesture.current = null
        gestureConsumed.current = false
      }
      return
    }

    if (!cancelled && !wasMiddle && event.button === 0) handleSinglePoint(point, event.pointerType, event.ctrlKey || event.metaKey || event.shiftKey)
  }

  const onWheel = (event: ReactWheelEvent<SVGSVGElement>) => {
    event.preventDefault()
    const bounds = svgRef.current!.getBoundingClientRect()
    const focus = { x: event.clientX - bounds.left, y: event.clientY - bounds.top }
    const factor = Math.exp(-event.deltaY * 0.0015)
    setCamera((current) => zoomCameraAt(current, focus, current.zoom * factor, viewport))
  }

  const handleContextMenu = (event: React.MouseEvent<SVGSVGElement>) => {
    if (mode !== 'edit') return
    event.preventDefault()
    const screenPoint = toScreenPoint(event)
    const worldPoint = screenToWorld(screenPoint, camera, viewport)
    const entity = selectionManager.findEntity(worldPoint, selectableEntities, camera.zoom, SELECTION_TOLERANCE_MOUSE_PX)
    if (!entity) { setContextMenu(null); return }
    tools.select.setSelection(selectionForContextTarget(selection.selectedIds, entity.id))
    setContextMenu({ x: Math.min(screenPoint.x, Math.max(6, viewport.width - 176)), y: Math.min(screenPoint.y, Math.max(6, viewport.height - 110)) })
  }

  const confirmLine = () => {
    const entity = tools.line.confirm(lineStyle)
    if (entity) store.addLine(entity, activeLayerId)
  }
  const confirmRectangle = () => {
    const entity = tools.rectangle.confirm(lineStyle)
    if (entity) store.addRectangle(entity, activeLayerId)
  }
  const confirmCircle = () => {
    const entity = tools.circle.confirm(lineStyle)
    if (entity) store.addCircle(entity, activeLayerId)
  }
  const lengthInputPosition = line.end
    ? positionLengthInput(worldToScreen(line.end, camera, viewport), viewport)
    : undefined
  const rectangleInputPosition = rectangle.pointer
    ? positionLengthInput(worldToScreen(rectangle.pointer, camera, viewport), viewport, { width: 280, height: 148 })
    : undefined
  const circleInputPosition = circle.edge
    ? positionLengthInput(worldToScreen(circle.edge, camera, viewport), viewport, { width: 252, height: 118 })
    : undefined

  return (
    <main className="drawing-stage">
      <div ref={containerRef} className="drawing-viewport" style={{ backgroundColor: projectSettings.backgroundColor }}>
        <svg
          ref={svgRef}
          className={`drawing-svg tool-${mode === 'view' ? 'view' : activeTool}`}
          viewBox={`0 0 ${viewport.width} ${viewport.height}`}
          role="application"
          aria-label={t('drawingArea')}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={(event) => endPointer(event, false)}
          onPointerCancel={(event) => endPointer(event, true)}
          onWheel={onWheel}
          onContextMenu={handleContextMenu}
        >
          {projectSettings.gridEnabled && (
            <>
              <GridRenderer camera={camera} viewport={viewport} spacing={projectSettings.gridSpacing} color={projectSettings.gridColor} />
              <rect width="100%" height="100%" fill="url(#drawing-grid)" pointerEvents="none" />
            </>
          )}
          <g aria-hidden="true">
            {visibleEntities.map((entity) => {
              if (entity.type === 'line') {
                return <LineRenderer key={entity.id} line={entity} camera={camera} viewport={viewport} selected={mode === 'edit' && selection.selectedIds.has(entity.id)} />
              }
              if (entity.type === 'rectangle') return <RectangleRenderer key={entity.id} rectangle={entity} camera={camera} viewport={viewport} selected={mode === 'edit' && selection.selectedIds.has(entity.id)} />
              if (entity.type === 'circle') return <CircleRenderer key={entity.id} circle={entity} camera={camera} viewport={viewport} selected={mode === 'edit' && selection.selectedIds.has(entity.id)} />
              if (entity.type === 'arc') return <ArcRenderer key={entity.id} arc={entity} camera={camera} viewport={viewport} selected={mode === 'edit' && selection.selectedIds.has(entity.id)} />
              const segment = resolveDimensionSegment(entity, visibleEntities)
              return segment
                ? <DimensionRenderer key={entity.id} dimension={entity} segment={segment} camera={camera} viewport={viewport} settings={projectSettings} selected={mode === 'edit' && selection.selectedIds.has(entity.id)} />
                : null
            })}
            {mode === 'edit' && activeTool === 'dimension' && dimension.segment && dimension.preview && (
              <DimensionRenderer dimension={dimension.preview} segment={dimension.segment} camera={camera} viewport={viewport} settings={projectSettings} preview />
            )}
            {mode === 'edit' && activeTool === 'dimension' && dimension.firstPoint && (
              <DimensionPointPreview start={dimension.firstPoint} end={dimension.secondPoint} camera={camera} viewport={viewport} />
            )}
            {mode === 'edit' && activeTool === 'dimension' && <SnapIndicatorRenderer snap={dimension.snap} camera={camera} viewport={viewport} />}
            {mode === 'edit' && activeTool === 'line' && (
              <>
                <PreviewRenderer
                  start={line.start}
                  end={line.end}
                  camera={camera}
                  viewport={viewport}
                  color={projectSettings.lineColor}
                  width={projectSettings.lineWidth}
                />
                <SnapIndicatorRenderer snap={line.snap} camera={camera} viewport={viewport} />
              </>
            )}
            {mode === 'edit' && activeTool === 'rectangle' && rectangle.preview && <RectangleRenderer rectangle={rectangle.preview} camera={camera} viewport={viewport} preview />}
            {mode === 'edit' && activeTool === 'circle' && circle.preview && <CircleRenderer circle={circle.preview} camera={camera} viewport={viewport} preview />}
            {mode === 'edit' && activeTool === 'arc' && arc.preview && <ArcRenderer arc={arc.preview} camera={camera} viewport={viewport} preview />}
            {mode === 'edit' && activeTool === 'rectangle' && <SnapIndicatorRenderer snap={rectangle.snap} camera={camera} viewport={viewport} />}
            {mode === 'edit' && activeTool === 'circle' && <SnapIndicatorRenderer snap={circle.snap} camera={camera} viewport={viewport} />}
            {mode === 'edit' && activeTool === 'arc' && <SnapIndicatorRenderer snap={arc.snap} camera={camera} viewport={viewport} />}
          </g>
        </svg>

        {mode === 'edit' && (activeTool === 'dimension' || activeTool === 'arc' || (activeTool === 'line' && line.phase === 'placing') || (activeTool === 'rectangle' && rectangle.phase === 'placing') || (activeTool === 'circle' && circle.phase === 'placing')) && (
          <button className="finish-tool-button" type="button" onClick={() => tools.finishActiveTool()}>{t('done')}</button>
        )}
        {mode === 'edit' && rectangle.phase === 'size' && (
          <RectangleInput width={rectangle.widthInput} height={rectangle.heightInput} canConfirm={rectangle.canConfirm} position={rectangleInputPosition}
            onChange={(width, height) => tools.rectangle.updateSize(width, height, lineStyle)}
            onBack={() => tools.rectangle.back()} onConfirm={confirmRectangle} />
        )}
        {mode === 'edit' && circle.phase === 'value' && (
          <CircleInput value={circle.valueInput} mode={circle.inputMode} canConfirm={circle.canConfirm} position={circleInputPosition}
            onChange={(value) => tools.circle.updateValue(value, lineStyle)}
            onModeChange={(inputMode) => tools.circle.setInputMode(inputMode, lineStyle)}
            onBack={() => tools.circle.back()} onConfirm={confirmCircle} />
        )}
        {mode === 'edit' && line.phase === 'length' && (
          <LengthInput
            value={line.lengthInput}
            canConfirm={line.canConfirm}
            onChange={(value) => tools.line.updateLength(value)}
            onBack={() => tools.line.back()}
            onConfirm={confirmLine}
            position={lengthInputPosition}
          />
        )}
        {onEnterFullscreen && (
          <button className="fullscreen-control icon-button" type="button" onClick={onEnterFullscreen} aria-label={t('fullscreen')} title={t('fullscreen')}>
            <Icon name="expand" />
          </button>
        )}
        {mode === 'edit' && <SnapQuickControls />}
        {contextMenu && mode === 'edit' && (
          <DrawingContextMenu position={contextMenu} layers={targetLayers} onClose={() => setContextMenu(null)}
            onMove={(layerId) => { onMoveSelection(layerId); setContextMenu(null) }}
            onDelete={() => { onDeleteSelection(); setContextMenu(null) }} />
        )}
      </div>
    </main>
  )
}

function midpoint(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
}

function DimensionPointPreview({ start, end, camera, viewport }: { start: Point; end: Point | null; camera: Camera; viewport: ViewportSize }) {
  const a = worldToScreen(start, camera, viewport)
  const b = end ? worldToScreen(end, camera, viewport) : null
  return (
    <g className="dimension-point-preview">
      {b && <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} />}
      <circle cx={a.x} cy={a.y} r="4" />
      {b && <circle cx={b.x} cy={b.y} r="4" />}
    </g>
  )
}
