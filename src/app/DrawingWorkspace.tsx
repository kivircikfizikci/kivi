import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import { DrawingViewport } from '../drawing/DrawingViewport/DrawingViewport'
import { useFullscreenMode } from '../hooks/useFullscreenMode'
import { BottomDrawer } from '../ui/BottomDrawer/BottomDrawer'
import { FullscreenExit } from '../ui/Fullscreen/FullscreenExit'
import { SettingsPanel } from '../ui/Settings/SettingsPanel'
import { TopBar } from '../ui/TopBar/TopBar'
import { ToolManager } from '../tools/ToolManager.ts'
import type { Project } from '../types/project.ts'
import { ProjectSession } from '../project/ProjectSession.ts'
import { projectService } from '../project/ProjectService.ts'

export function DrawingWorkspace({ project }: { project: Project }) {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [session] = useState(() => new ProjectSession(project, (updated) => projectService.updateProject(updated)))
  const [tools] = useState(() => new ToolManager())
  const projectSnapshot = useSyncExternalStore(session.subscribe, session.getSnapshot)
  const store = session.store
  const drawing = useSyncExternalStore(store.subscribe, store.getSnapshot)
  const activeTool = useSyncExternalStore(tools.subscribe, tools.getSnapshot)
  const selectedId = useSyncExternalStore(tools.select.subscribe, tools.select.getSnapshot)
  const fullscreen = useFullscreenMode()
  const persistCamera = useCallback((camera: Parameters<ProjectSession['updateCamera']>[0]) => {
    session.updateCamera(camera)
  }, [session])

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
        else if (drawerOpen) setDrawerOpen(false)
        else if (activeTool !== 'select') tools.finishActiveTool()
        return
      }

      if (isEditing) return
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
  }, [activeTool, drawerOpen, selectedId, settingsOpen, store, tools])

  return (
    <div ref={fullscreen.containerRef} className={`app-shell${fullscreen.active ? ' is-fullscreen' : ''}`}>
      {!fullscreen.active && (
        <TopBar
          onOpenSettings={() => setSettingsOpen(true)}
          onEnterFullscreen={() => void fullscreen.enter()}
          saveStatus={projectSnapshot.saveStatus}
        />
      )}
      <DrawingViewport
        store={store}
        tools={tools}
        projectSettings={projectSnapshot.project.projectSettings}
        initialCamera={projectSnapshot.project.view?.camera}
        onCameraSettled={persistCamera}
      />
      {fullscreen.active ? (
        <FullscreenExit onExit={() => void fullscreen.exit()} />
      ) : (
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
        </>
      )}
    </div>
  )
}
