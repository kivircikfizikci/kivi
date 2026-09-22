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
import type { ProjectSettings } from '../../types/project.ts'
import { Icon } from '../../ui/Icon/Icon.tsx'

interface DrawingViewportProps {
  store: DrawingStore
  tools: ToolManager
  projectSettings: ProjectSettings
  initialCamera?: Camera
  onCameraSettled: (camera: Camera) => void
  mode?: WorkspaceMode
  onEnterFullscreen?: () => void
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

export function DrawingViewport({ store, tools, projectSettings, initialCamera, onCameraSettled, mode = 'edit', onEnterFullscreen }: DrawingViewportProps) {
  const { t } = useI18n()
  const { settings } = useSettings()
  const drawing = useSyncExternalStore(store.subscribe, store.getSnapshot)
  const activeTool = useSyncExternalStore(tools.subscribe, tools.getSnapshot)
  const line = useSyncExternalStore(tools.line.subscribe, tools.line.getSnapshot)
  const dimension = useSyncExternalStore(tools.dimension.subscribe, tools.dimension.getSnapshot)
  const selectedId = useSyncExternalStore(tools.select.subscribe, tools.select.getSnapshot)
  const [camera, setCamera] = useState(initialCamera ?? DEFAULT_CAMERA)
  const [viewport, setViewport] = useState<ViewportSize>({ width: 1, height: 1 })
  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const pointers = useRef(new Map<number, TrackedPointer>())
  const middlePointer = useRef<number | null>(null)
  const gesture = useRef<GestureStart | null>(null)
  const gestureConsumed = useRef(false)
  const snapManager = useMemo(() => new SnapManager(), [])
  const selectionManager = useMemo(() => new SelectionManager(), [])

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

  const toScreenPoint = useCallback((event: ReactPointerEvent<SVGSVGElement>): Point => {
    const bounds = svgRef.current!.getBoundingClientRect()
    return { x: event.clientX - bounds.left, y: event.clientY - bounds.top }
  }, [])

  const resolveSnap = useCallback((screenPoint: Point, pointerType: string) => {
    const worldPoint = screenToWorld(screenPoint, camera, viewport)
    const tolerance = pointerType === 'touch' ? SELECTION_TOLERANCE_TOUCH_PX : 10
    return snapManager.resolve({
      pointer: worldPoint,
      entities: drawing.state.entities,
      zoom: camera.zoom,
      angleOrigin: line.start ?? undefined,
      settings: {
        endpoint: settings.endpointSnapEnabled,
        midpoint: settings.midpointSnapEnabled,
        grid: settings.gridSnapEnabled,
        angle: settings.angleSnapEnabled,
        gridSpacing: projectSettings.gridSpacing,
        pixelTolerance: tolerance,
      },
    })
  }, [camera, drawing.state.entities, line.start, projectSettings.gridSpacing, settings, snapManager, viewport])

  const handleSinglePoint = useCallback((screenPoint: Point, pointerType: string) => {
    if (mode === 'view') return
    const worldPoint = screenToWorld(screenPoint, camera, viewport)
    if (activeTool === 'line') {
      const resolved = resolveSnap(screenPoint, pointerType)
      tools.line.placePoint(resolved.point, resolved.snap)
      return
    }

    if (activeTool === 'dimension') {
      if (!tools.dimension.getSnapshot().target) {
        const tolerance = pointerType === 'touch' ? SELECTION_TOLERANCE_TOUCH_PX : SELECTION_TOLERANCE_MOUSE_PX
        const target = selectionManager.findLine(worldPoint, drawing.state.entities, camera.zoom, tolerance)
        if (target) {
          tools.dimension.chooseTarget(target)
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
    const entity = selectionManager.findEntity(worldPoint, drawing.state.entities, camera.zoom, tolerance)
    tools.select.select(entity?.id ?? null)
  }, [activeTool, camera, drawing.state.entities, mode, resolveSnap, selectionManager, store, tools, viewport])

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
    } else if (activeTool === 'dimension' && dimension.target) {
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

    if (!cancelled && !wasMiddle && event.button === 0) handleSinglePoint(point, event.pointerType)
  }

  const onWheel = (event: ReactWheelEvent<SVGSVGElement>) => {
    event.preventDefault()
    const bounds = svgRef.current!.getBoundingClientRect()
    const focus = { x: event.clientX - bounds.left, y: event.clientY - bounds.top }
    const factor = Math.exp(-event.deltaY * 0.0015)
    setCamera((current) => zoomCameraAt(current, focus, current.zoom * factor, viewport))
  }

  const confirmLine = () => {
    const entity = tools.line.confirm({ color: settings.defaultLineColor, width: settings.defaultLineWidth })
    if (entity) store.addLine(entity)
  }

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
          onContextMenu={(event) => event.preventDefault()}
        >
          {projectSettings.gridEnabled && (
            <>
              <GridRenderer camera={camera} viewport={viewport} spacing={projectSettings.gridSpacing} color={projectSettings.gridColor} />
              <rect width="100%" height="100%" fill="url(#drawing-grid)" pointerEvents="none" />
            </>
          )}
          <g aria-hidden="true">
            {drawing.state.entities.map((entity) => {
              if (entity.type === 'line') {
                return <LineRenderer key={entity.id} line={entity} camera={camera} viewport={viewport} selected={mode === 'edit' && entity.id === selectedId} />
              }
              const target = drawing.state.entities.find((candidate) => candidate.type === 'line' && candidate.id === entity.targetEntityId)
              return target?.type === 'line'
                ? <DimensionRenderer key={entity.id} dimension={entity} target={target} camera={camera} viewport={viewport} settings={projectSettings} selected={mode === 'edit' && entity.id === selectedId} />
                : null
            })}
            {mode === 'edit' && activeTool === 'dimension' && dimension.target && dimension.preview && (
              <DimensionRenderer dimension={dimension.preview} target={dimension.target} camera={camera} viewport={viewport} settings={projectSettings} preview />
            )}
            {mode === 'edit' && activeTool === 'line' && (
              <>
                <PreviewRenderer
                  start={line.start}
                  end={line.end}
                  camera={camera}
                  viewport={viewport}
                  color={settings.defaultLineColor}
                  width={settings.defaultLineWidth}
                />
                <SnapIndicatorRenderer snap={line.snap} camera={camera} viewport={viewport} />
              </>
            )}
          </g>
        </svg>

        {mode === 'edit' && (activeTool === 'dimension' || (activeTool === 'line' && line.phase === 'placing')) && (
          <button className="finish-tool-button" type="button" onClick={() => tools.finishActiveTool()}>{t('done')}</button>
        )}
        {mode === 'edit' && line.phase === 'length' && (
          <LengthInput
            value={line.lengthInput}
            canConfirm={line.canConfirm}
            onChange={(value) => tools.line.updateLength(value)}
            onBack={() => tools.line.back()}
            onConfirm={confirmLine}
          />
        )}
        {onEnterFullscreen && (
          <button className="fullscreen-control icon-button" type="button" onClick={onEnterFullscreen} aria-label={t('fullscreen')} title={t('fullscreen')}>
            <Icon name="expand" />
          </button>
        )}
      </div>
    </main>
  )
}

function midpoint(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
}
