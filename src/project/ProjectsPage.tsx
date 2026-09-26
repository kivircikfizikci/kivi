import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Icon } from '../ui/Icon/Icon'
import { useI18n } from '../i18n/I18nContext'
import { useSettings } from '../settings/useSettings.ts'
import type { Project } from '../types/project.ts'
import { projectService } from './ProjectService.ts'
import { useEscapeKey } from '../hooks/useEscapeKey.ts'

export function ProjectsPage() {
  return <ProjectsBrowser variant="page" open />
}

export function ProjectsPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useI18n()
  useEscapeKey(onClose, open)

  return (
    <>
      <div className={`projects-backdrop${open ? ' is-visible' : ''}`} onClick={onClose} aria-hidden="true" />
      <aside className={`projects-panel${open ? ' is-open' : ''}`} aria-hidden={!open} aria-label={t('projects')}>
        <ProjectsBrowser variant="panel" open={open} onClose={onClose} />
      </aside>
    </>
  )
}

function ProjectsBrowser({ variant, open, onClose }: { variant: 'page' | 'panel'; open: boolean; onClose?: () => void }) {
  const { t } = useI18n()
  const { settings, updateSettings } = useSettings()
  const navigate = useNavigate()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat(settings.language, { dateStyle: 'medium', timeStyle: 'short' }),
    [settings.language],
  )

  useEffect(() => {
    if (!open) return
    let active = true
    setLoading(true)
    void projectService.listProjects()
      .then((items) => {
        if (active) setProjects(items)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [open])

  const createProject = async () => {
    const project = await projectService.createProject(settings, t('untitled'))
    updateSettings({ lastOpenProjectId: project.id })
    onClose?.()
    navigate(`/p/${project.id}`)
  }

  const startRename = (project: Project) => {
    setEditingId(project.id)
    setEditingName(project.name)
  }

  const finishRename = async (project: Project) => {
    if (editingId !== project.id) return
    const updated = await projectService.renameProject(project, editingName)
    setProjects((current) => current.map((item) => item.id === updated.id ? updated : item))
    setEditingId(null)
  }

  const deleteProject = async (project: Project) => {
    if (!window.confirm(t('deleteProjectConfirm'))) return
    await projectService.deleteProject(project.id)
    setProjects((current) => current.filter((item) => item.id !== project.id))
    if (settings.lastOpenProjectId === project.id) updateSettings({ lastOpenProjectId: null })
  }

  const content = (
    <>
      <header className="projects-header">
        {variant === 'page' && (
          <Link className="icon-button" to="/" aria-label={t('backToDrawing')}>
            <Icon name="chevronLeft" />
          </Link>
        )}
        {variant === 'page' ? <h1>{t('projects')}</h1> : <h2>{t('projects')}</h2>}
        <button className="new-project-button" type="button" onClick={() => void createProject()}>
          <Icon name="plus" />
          <span>{t('newProject')}</span>
        </button>
        {variant === 'panel' && (
          <button className="icon-button small" type="button" onClick={onClose} aria-label={t('close')}><Icon name="close" /></button>
        )}
      </header>

      {!loading && projects.length === 0 ? (
        <div className="empty-state">
          <Icon name="folder" />
          <p>{t('noProjects')}</p>
        </div>
      ) : (
        <div className="project-list" aria-busy={loading}>
          {projects.map((project) => (
            <article className="project-row" key={project.id}>
              <div className="project-main">
                {editingId === project.id ? (
                  <form onSubmit={(event) => { event.preventDefault(); void finishRename(project) }}>
                    <input
                      autoFocus
                      value={editingName}
                      aria-label={t('rename')}
                      onChange={(event) => setEditingName(event.target.value)}
                      onBlur={() => void finishRename(project)}
                    />
                  </form>
                ) : (
                  <Link to={`/p/${project.id}`} onClick={() => { updateSettings({ lastOpenProjectId: project.id }); onClose?.() }}>
                    <strong>{project.name}</strong>
                    <span>{dateFormatter.format(new Date(project.updatedAt))}</span>
                  </Link>
                )}
              </div>
              <span className="local-status" title={t('local')} aria-label={t('local')} />
              <button className="icon-button small" type="button" onClick={() => startRename(project)} aria-label={t('rename')}>
                <Icon name="edit" />
              </button>
              <button className="icon-button small danger" type="button" onClick={() => void deleteProject(project)} aria-label={t('deleteProject')}>
                <Icon name="trash" />
              </button>
            </article>
          ))}
        </div>
      )}
    </>
  )

  return variant === 'page'
    ? <main className="projects-page">{content}</main>
    : <div className="projects-panel-content">{content}</div>
}
