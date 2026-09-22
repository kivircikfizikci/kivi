import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { DrawingWorkspace } from '../app/DrawingWorkspace.tsx'
import { useI18n } from '../i18n/I18nContext.ts'
import { useSettings } from '../settings/useSettings.ts'
import type { Project } from '../types/project.ts'
import { projectService } from './ProjectService.ts'

let pendingHomeResolution: Promise<Project> | null = null

export function HomeProjectRoute() {
  const navigate = useNavigate()
  const { t } = useI18n()
  const { settings, ready, updateSettings } = useSettings()

  useEffect(() => {
    if (!ready) return
    let active = true
    pendingHomeResolution ??= resolveHomeProject(settings.lastOpenProjectId, settings, t('untitled'))
    void pendingHomeResolution
      .then((project) => {
        if (!active) return
        updateSettings({ lastOpenProjectId: project.id })
        navigate(`/p/${project.id}`, { replace: true })
      })
      .finally(() => {
        pendingHomeResolution = null
      })
    return () => {
      active = false
    }
  }, [navigate, ready, settings, t, updateSettings])

  return <LoadingProject label={t('loading')} />
}

export function ProjectRoute() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const { t } = useI18n()
  const { ready, updateSettings } = useSettings()
  const [project, setProject] = useState<Project | null>(null)

  useEffect(() => {
    let active = true
    if (!ready) return
    if (!projectId) {
      navigate('/', { replace: true })
      return
    }
    void projectService.getProject(projectId)
      .then((loaded) => {
        if (!active) return
        if (!loaded) {
          navigate('/', { replace: true })
          return
        }
        updateSettings({ lastOpenProjectId: loaded.id })
        setProject(loaded)
      })
      .catch(() => {
        if (active) navigate('/projects', { replace: true })
      })
    return () => {
      active = false
    }
  }, [navigate, projectId, ready, updateSettings])

  return project
    ? <DrawingWorkspace key={project.id} project={project} />
    : <LoadingProject label={t('loading')} />
}

async function resolveHomeProject(lastProjectId: string | null, settings: Parameters<typeof projectService.createProject>[0], untitled: string) {
  if (lastProjectId) {
    const existing = await projectService.getProject(lastProjectId)
    if (existing) return existing
  }
  return projectService.createProject(settings, untitled)
}

function LoadingProject({ label }: { label: string }) {
  return <div className="app-loading" role="status" aria-label={label}><span /></div>
}
