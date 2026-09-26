import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { useNavigate } from 'react-router-dom'
import { DrawingViewport } from '../drawing/DrawingViewport/DrawingViewport'
import { useFullscreenMode } from '../hooks/useFullscreenMode'
import { BottomDrawer } from '../ui/BottomDrawer/BottomDrawer'
import { FullscreenExit } from '../ui/Fullscreen/FullscreenExit'
import { SettingsPanel } from '../ui/Settings/SettingsPanel'
import { TopBar } from '../ui/TopBar/TopBar'
import { SharePanel } from '../ui/Share/SharePanel.tsx'
import { ToolManager } from '../tools/ToolManager.ts'
import type { Project } from '../types/project.ts'
import { ProjectSession, type WorkspaceMode } from '../project/ProjectSession.ts'
import { projectService } from '../project/ProjectService.ts'
import { useI18n } from '../i18n/I18nContext.ts'
import { CommandBar } from '../ui/CommandBar/CommandBar.tsx'
import type { CommandContext } from '../commands/commandRegistry.ts'
import { LayerPanel } from '../ui/Layers/LayerPanel.tsx'
import { parseCoordinate } from '../commands/coordinateParser.ts'
import { canTransformSelection } from '../tools/transformEligibility.ts'

export function DrawingWorkspace({ project, mode = 'edit' }: { project: Project; mode?: WorkspaceMode }) {
  const { t } = useI18n()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [layersOpen, setLayersOpen] = useState(false)
  const [session] = useState(() => new ProjectSession(project, (updated) => projectService.updateProject(updated), 400, mode))
  const [tools] = useState(() => new ToolManager())
  const navigate = useNavigate()
  const projectSnapshot = useSyncExternalStore(session.subscribe, session.getSnapshot)
  const store = session.store
  const drawing = useSyncExternalStore(store.subscribe, store.getSnapshot)
  const activeTool = useSyncExternalStore(tools.subscribe, tools.getSnapshot)
  const line = useSyncExternalStore(tools.line.subscribe, tools.line.getSnapshot)
  const selection = useSyncExternalStore(tools.select.subscribe, tools.select.getSnapshot)
  const fullscreen = useFullscreenMode()
  const canTransform = useMemo(() => canTransformSelection(selection.selectedIds, drawing.state.entities, projectSnapshot.project.layers), [drawing.state.entities, projectSnapshot.project.layers, selection.selectedIds])
  const persistCamera = useCallback((camera: Parameters<ProjectSession['updateCamera']>[0]) => {
    if (mode === 'edit') session.updateCamera(camera)
  }, [mode, session])

  useEffect(() => {
    document.title = `${projectSnapshot.project.name} · Kivi`
  }, [projectSnapshot.project.name])

  useEffect(() => {
    const flush = () => void session.flush()
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') flush()
    }
    window.addEventListener('pagehide', flush)
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      window.removeEventListener('pagehide', flush)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      flush()
    }
  }, [session])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const isEditing = target?.tagName === 'INPUT' || target?.tagName === 'SELECT' || target?.isContentEditable

      if (event.key === 'Escape') {
        if (settingsOpen) setSettingsOpen(false)
        else if (layersOpen) setLayersOpen(false)
        else if (shareOpen) setShareOpen(false)
        else if (drawerOpen) setDrawerOpen(false)
        else if (mode === 'edit' && activeTool !== 'select') tools.finishActiveTool()
        return
      }

      if (isEditing || mode === 'view') return
      const modifier = event.ctrlKey || event.metaKey
      if (modifier && event.key.toLowerCase() === 'z') {
        event.preventDefault()
        if (event.shiftKey) store.redo()
        else store.undo()
      } else if (modifier && event.key.toLowerCase() === 'y') {
        event.preventDefault()
        store.redo()
      } else if ((event.key === 'Delete' || event.key === 'Backspace') && selection.selectedIds.size > 0) {
        event.preventDefault()
        if (store.deleteEntities(selection.selectedIds)) tools.select.clearSelection()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [activeTool, drawerOpen, layersOpen, mode, selection.selectedIds, settingsOpen, shareOpen, store, tools])

  const deleteSelection = useCallback(() => {
    if (store.deleteEntities(selection.selectedIds)) tools.select.clearSelection()
  }, [selection.selectedIds, store, tools.select])

  const moveSelectionToLayer = useCallback((layerId: string) => {
    if (store.moveEntitiesToLayer(selection.selectedIds, layerId)) tools.select.clearSelection()
  }, [selection.selectedIds, store, tools.select])

  const commandContext = useMemo<CommandContext>(() => ({
    activateTool: (tool) => {
      if ((tool === 'move' || tool === 'copy' || tool === 'repeat') && !canTransform) return
      tools.activate(tool)
    },
    deleteSelection,
    undo: () => { store.undo() },
    redo: () => { store.redo() },
    openProjects: () => navigate('/projects'),
    openSettings: () => setSettingsOpen(true),
    openLayers: () => setLayersOpen(true),
    enterFullscreen: () => { void fullscreen.enter() },
    openShare: () => setShareOpen(true),
  }), [canTransform, deleteSelection, fullscreen, navigate, store, tools])
  const commandPrompt = useMemo(() => activeTool === 'line' && line.phase === 'placing' && !line.start ? {
    placeholder: t('startCoordinate'),
    submit: (value: string) => {
      const point = parseCoordinate(value)
      if (!point) return false
      tools.line.placePoint(point, null)
      return true
    },
    cancel: () => tools.finishActiveTool(),
  } : null, [activeTool, line.phase, line.start, t, tools])

  return (
    <div ref={fullscreen.containerRef} className={`app-shell${fullscreen.active ? ' is-fullscreen' : ''}`}>
      {!fullscreen.active && mode === 'edit' && (
        <TopBar
          onOpenSettings={() => setSettingsOpen(true)}
          onOpenShare={() => setShareOpen(true)}
          onOpenLayers={() => setLayersOpen(true)}
          saveStatus={projectSnapshot.saveStatus}
          store={store}
          tools={tools}
          activeTool={activeTool}
          canUndo={drawing.canUndo}
          canRedo={drawing.canRedo}
          canTransform={canTransform}
        />
      )}
      {!fullscreen.active && mode === 'view' && <div className="view-mode-badge">{t('viewOnly')}</div>}
      <DrawingViewport
        store={store}
        tools={tools}
        projectSettings={projectSnapshot.project.projectSettings}
        layers={projectSnapshot.project.layers}
        activeLayerId={projectSnapshot.project.activeLayerId}
        initialCamera={projectSnapshot.project.view?.camera}
        onCameraSettled={persistCamera}
        mode={mode}
        onEnterFullscreen={fullscreen.active ? undefined : () => void fullscreen.enter()}
        onMoveSelection={moveSelectionToLayer}
        onDeleteSelection={deleteSelection}
      />
      {!fullscreen.active && mode === 'edit' && (
        <CommandBar context={commandContext} saveStatus={projectSnapshot.saveStatus} dirty={projectSnapshot.dirty} prompt={commandPrompt} />
      )}
      {fullscreen.active ? (
        <FullscreenExit onExit={() => void fullscreen.exit()} />
      ) : mode === 'edit' ? (
        <>
          <BottomDrawer
            open={drawerOpen}
            onOpen={() => setDrawerOpen(true)}
            onClose={() => setDrawerOpen(false)}
            store={store}
            tools={tools}
            activeTool={activeTool}
            selection={selection}
            canUndo={drawing.canUndo}
            canRedo={drawing.canRedo}
            canTransform={canTransform}
          />
          <SettingsPanel
            open={settingsOpen}
            onClose={() => setSettingsOpen(false)}
            projectSettings={projectSnapshot.project.projectSettings}
            onProjectSettingsChange={(updates) => session.updateProjectSettings(updates)}
            onSave={() => { void session.flush(); setSettingsOpen(false) }}
          />
          <LayerPanel open={layersOpen} layers={projectSnapshot.project.layers} activeLayerId={projectSnapshot.project.activeLayerId}
            onClose={() => setLayersOpen(false)} onCreate={(name) => { session.createLayer(name) }}
            onRename={(id, name) => { session.renameLayer(id, name) }} onUpdate={(id, updates) => { session.updateLayer(id, updates) }}
            onSetActive={(id) => { session.setActiveLayer(id) }} onDelete={(id) => { session.deleteLayer(id) }} />
          <SharePanel open={shareOpen} onClose={() => setShareOpen(false)} project={projectSnapshot.project} />
        </>
      ) : null}
    </div>
  )
}
