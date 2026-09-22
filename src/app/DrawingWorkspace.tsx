import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
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

export function DrawingWorkspace({ project, mode = 'edit' }: { project: Project; mode?: WorkspaceMode }) {
  const { t } = useI18n()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [session] = useState(() => new ProjectSession(project, (updated) => projectService.updateProject(updated), 400, mode))
  const [tools] = useState(() => new ToolManager())
  const navigate = useNavigate()
  const projectSnapshot = useSyncExternalStore(session.subscribe, session.getSnapshot)
  const store = session.store
  const drawing = useSyncExternalStore(store.subscribe, store.getSnapshot)
  const activeTool = useSyncExternalStore(tools.subscribe, tools.getSnapshot)
  const selectedId = useSyncExternalStore(tools.select.subscribe, tools.select.getSnapshot)
  const fullscreen = useFullscreenMode()
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
      } else if ((event.key === 'Delete' || event.key === 'Backspace') && selectedId) {
        event.preventDefault()
        if (store.deleteEntity(selectedId)) tools.select.select(null)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [activeTool, drawerOpen, mode, selectedId, settingsOpen, shareOpen, store, tools])

  const runCommand = useCallback((command: string) => {
    if (mode === 'view') return false
    if (command === 'line' || command === 'l') tools.activate('line')
    else if (command === 'dim' || command === 'dimension') tools.activate('dimension')
    else if (command === 'select') tools.activate('select')
    else if (command === 'delete') {
      if (selectedId && store.deleteEntity(selectedId)) tools.select.select(null)
    } else if (command === 'undo') store.undo()
    else if (command === 'redo') store.redo()
    else if (command === 'projects') navigate('/projects')
    else if (command === 'settings') setSettingsOpen(true)
    else if (command === 'fullscreen') void fullscreen.enter()
    else if (command === 'share') setShareOpen(true)
    else return false
    return true
  }, [fullscreen, mode, navigate, selectedId, store, tools])

  return (
    <div ref={fullscreen.containerRef} className={`app-shell${fullscreen.active ? ' is-fullscreen' : ''}`}>
      {!fullscreen.active && mode === 'edit' && (
        <TopBar
          onOpenSettings={() => setSettingsOpen(true)}
          onOpenShare={() => setShareOpen(true)}
          onCommand={runCommand}
          saveStatus={projectSnapshot.saveStatus}
          store={store}
          tools={tools}
          activeTool={activeTool}
          canUndo={drawing.canUndo}
          canRedo={drawing.canRedo}
        />
      )}
      {!fullscreen.active && mode === 'view' && <div className="view-mode-badge">{t('viewOnly')}</div>}
      <DrawingViewport
        store={store}
        tools={tools}
        projectSettings={projectSnapshot.project.projectSettings}
        initialCamera={projectSnapshot.project.view?.camera}
        onCameraSettled={persistCamera}
        mode={mode}
        onEnterFullscreen={fullscreen.active ? undefined : () => void fullscreen.enter()}
      />
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
            selectedId={selectedId}
            canUndo={drawing.canUndo}
            canRedo={drawing.canRedo}
          />
          <SettingsPanel
            open={settingsOpen}
            onClose={() => setSettingsOpen(false)}
            projectSettings={projectSnapshot.project.projectSettings}
            onProjectSettingsChange={(updates) => session.updateProjectSettings(updates)}
          />
          <SharePanel open={shareOpen} onClose={() => setShareOpen(false)} project={projectSnapshot.project} />
        </>
      ) : null}
    </div>
  )
}
