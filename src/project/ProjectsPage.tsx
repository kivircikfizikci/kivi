import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useEscapeKey } from '../hooks/useEscapeKey.ts'
import { useI18n } from '../i18n/I18nContext.ts'
import { useSettings } from '../settings/useSettings.ts'
import type { Project } from '../types/project.ts'
import { KiviLogo } from '../ui/Brand/KiviLogo.tsx'
import { GlobalActions } from '../ui/GlobalActions/GlobalActions.tsx'
import { Icon } from '../ui/Icon/Icon.tsx'
import { SettingsPanel } from '../ui/Settings/SettingsPanel.tsx'
import { projectService } from './ProjectService.ts'
import { defaultProjectName, formatProjectSize, projectFileName, projectSize, recentProjects } from './projectPresentation.ts'

export function ProjectsPage() {
  const { t } = useI18n()
  const { settings, updateSettings } = useSettings()
  const navigate = useNavigate()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const sorted = useMemo(() => recentProjects(projects, Number.POSITIVE_INFINITY), [projects])
  const recent = sorted.slice(0, 5)

  useEffect(() => {
    let active = true
    void projectService.listProjects().then((items) => { if (active) setProjects(items) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const createProject = async () => {
    const project = await projectService.createProject(settings, defaultProjectName(settings.language))
    updateSettings({ lastOpenProjectId: project.id })
    navigate(`/p/${project.id}`)
  }

  return (
    <main className="project-hub">
      <header className="hub-header"><KiviLogo /><GlobalActions onOpenSettings={() => setSettingsOpen(true)} /></header>
      <aside className="hub-sidebar">
        <div className="hub-create-actions">
          <button className="hub-new-drawing" type="button" onClick={() => void createProject()}><Icon name="plus" />{t('newDrawing')}</button>
          <button className="hub-upload" type="button" disabled title={t('uploadComingSoon')}><Icon name="upload" />{t('upload')}</button>
        </div>
        <section className="hub-recents" aria-labelledby="recents-title">
          <h2 id="recents-title">{t('recents')}</h2>
          {recent.map((project) => <ProjectLink key={project.id} project={project} onOpen={() => updateSettings({ lastOpenProjectId: project.id })} />)}
          {!loading && recent.length === 0 && <small>{t('noRecentProjects')}</small>}
        </section>
        <a className="hub-projects-link" href="#project-list"><Icon name="folder" />{t('projects')}</a>
      </aside>
      <section className="hub-content" id="project-list" aria-labelledby="recent-heading">
        <div className="hub-content-heading"><div><span>{t('projects')}</span><h1 id="recent-heading">{t('recent')}</h1></div><button className="secondary-button" type="button" onClick={() => void createProject()}><Icon name="plus" />{t('newDrawing')}</button></div>
        {!loading && sorted.length === 0 ? <ProjectEmptyState /> : <ProjectTable projects={sorted} onChange={setProjects} />}
      </section>
      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </main>
  )
}

export function ProjectsPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useI18n()
  const { settings, updateSettings } = useSettings()
  const navigate = useNavigate()
  const [projects, setProjects] = useState<Project[]>([])
  useEscapeKey(onClose, open)
  useEffect(() => { if (open) void projectService.listProjects().then((items) => setProjects(recentProjects(items, 8))) }, [open])
  const create = async () => {
    const project = await projectService.createProject(settings, defaultProjectName(settings.language))
    updateSettings({ lastOpenProjectId: project.id }); onClose(); navigate(`/p/${project.id}`)
  }
  return <>
    <div className={`projects-backdrop${open ? ' is-visible' : ''}`} onClick={onClose} aria-hidden="true" />
    <aside className={`projects-panel${open ? ' is-open' : ''}`} aria-hidden={!open} aria-label={t('projects')}>
      <div className="projects-panel-content">
        <header className="projects-header"><h2>{t('projects')}</h2><button className="new-project-button" type="button" onClick={() => void create()}><Icon name="plus" />{t('newDrawing')}</button><button className="icon-button small" type="button" onClick={onClose} aria-label={t('close')}><Icon name="close" /></button></header>
        <div className="project-list">{projects.map((project) => <ProjectLink key={project.id} project={project} onOpen={() => { updateSettings({ lastOpenProjectId: project.id }); onClose() }} />)}{projects.length === 0 && <p className="compact-empty">{t('noProjects')}</p>}</div>
        <Link className="panel-all-projects" to="/" onClick={onClose}>{t('viewAllProjects')}</Link>
      </div>
    </aside>
  </>
}

function ProjectLink({ project, onOpen }: { project: Project; onOpen: () => void }) {
  return <Link className="project-link" to={`/p/${project.id}`} onClick={onOpen}><span className="kivi-file-dot" />{projectFileName(project.name)}</Link>
}

function ProjectTable({ projects, onChange }: { projects: Project[]; onChange: (projects: Project[]) => void }) {
  const { t } = useI18n()
  const { settings, updateSettings } = useSettings()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const formatter = useMemo(() => new Intl.DateTimeFormat(settings.language, { dateStyle: 'medium', timeStyle: 'short' }), [settings.language])
  const finishRename = async (project: Project) => {
    if (editingId !== project.id) return
    const updated = await projectService.renameProject(project, projectFileName(editingName))
    onChange(projects.map((item) => item.id === updated.id ? updated : item)); setEditingId(null)
  }
  const remove = async (project: Project) => {
    if (!window.confirm(t('deleteProjectConfirm'))) return
    await projectService.deleteProject(project.id); onChange(projects.filter((item) => item.id !== project.id))
    if (settings.lastOpenProjectId === project.id) updateSettings({ lastOpenProjectId: null })
  }
  return <div className="hub-project-table" role="table" aria-label={t('recent')}>
    <div className="hub-project-columns" role="row"><span>{t('fileType')}</span><span>{t('name')}</span><span>{t('lastOpened')}</span><span>{t('size')}</span><span /></div>
    {projects.map((project) => <div className="hub-project-row" role="row" key={project.id}>
      <Link className="project-thumbnail" to={`/p/${project.id}`} onClick={() => updateSettings({ lastOpenProjectId: project.id })} aria-label={`${t('open')} ${projectFileName(project.name)}`}><svg viewBox="0 0 48 34"><path d="M6 26 17 8l8 18 8-12 9 12M9 29h32" /><circle cx="17" cy="8" r="2" /></svg><b>.kivi</b></Link>
      {editingId === project.id ? <form onSubmit={(event) => { event.preventDefault(); void finishRename(project) }}><input autoFocus value={editingName} onChange={(event) => setEditingName(event.target.value)} onBlur={() => void finishRename(project)} aria-label={t('rename')} /></form> : <Link className="hub-project-name" to={`/p/${project.id}`} onClick={() => updateSettings({ lastOpenProjectId: project.id })}><strong>{projectFileName(project.name)}</strong></Link>}
      <time>{formatter.format(new Date(project.updatedAt))}</time><span>{formatProjectSize(projectSize(project))}</span><span className="hub-row-actions"><button className="icon-button small" type="button" onClick={() => { setEditingId(project.id); setEditingName(project.name) }} aria-label={t('rename')}><Icon name="edit" /></button><button className="icon-button small danger" type="button" onClick={() => void remove(project)} aria-label={t('deleteProject')}><Icon name="trash" /></button></span>
    </div>)}
  </div>
}

function ProjectEmptyState() {
  const { t } = useI18n()
  return <div className="hub-empty-state" data-testid="project-empty-state">
    <svg className="architect-illustration kiwi-mascot" viewBox="0 0 260 190" role="img" aria-label={t('emptyIllustration')}>
      <path className="empty-ground" d="M35 171h190" />
      <path className="kiwi-leg" d="M108 150v16m42-16v16" /><path className="kiwi-foot" d="M96 168c7-5 14-5 20 0m26 0c7-5 14-5 20 0" />
      <path className="kiwi-leaf" d="M128 31c-5-15 5-24 22-22-1 16-9 24-22 22Z" /><path className="kiwi-stem" d="M128 32c2-10 7-17 16-21" />
      <ellipse className="kiwi-body" cx="130" cy="96" rx="53" ry="67" />
      <ellipse className="kiwi-belly" cx="130" cy="99" rx="39" ry="49" />
      <circle className="kiwi-eye" cx="116" cy="80" r="3" /><circle className="kiwi-eye" cx="144" cy="80" r="3" />
      <path className="kiwi-smile" d="M120 91c6 7 14 7 20 0" />
      <g className="kiwi-seeds"><circle cx="111" cy="104" r="2" /><circle cx="122" cy="111" r="2" /><circle cx="138" cy="111" r="2" /><circle cx="149" cy="104" r="2" /><circle cx="116" cy="121" r="2" /><circle cx="144" cy="121" r="2" /></g>
      <path className="kiwi-arm" d="M82 98c-15 5-21 14-22 27m118-27c15 5 21 14 22 27" />
      <rect className="empty-paper" x="65" y="119" width="130" height="45" rx="4" />
      <path className="empty-line" d="M76 130h48m-48 10h31m50-11 25 24m0-24-25 24" />
    </svg><h2>{t('nothingHere')}</h2><p>{t('emptyProjectsHint')}</p>
  </div>
}
