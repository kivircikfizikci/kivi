import { useState } from 'react'
import { useI18n } from '../../i18n/I18nContext.ts'
import type { AutosaveStatus } from '../../project/AutosaveManager.ts'
import type { DrawingStore } from '../../project/DrawingStore.ts'
import { projectFileName } from '../../project/projectPresentation.ts'
import { useSettings } from '../../settings/useSettings.ts'
import type { ToolId } from '../../tools/Tool.ts'
import type { ToolManager } from '../../tools/ToolManager.ts'
import type { ToolbarShortcut } from '../../types/settings.ts'
import { KiviLogo } from '../Brand/KiviLogo.tsx'
import { GlobalActions } from '../GlobalActions/GlobalActions.tsx'
import { Icon } from '../Icon/Icon.tsx'
import { editorToolGroups } from './editorLayout.ts'

interface TopBarProps { projectName: string; onOpenSettings: () => void; onOpenShare: () => void; onOpenLayers: () => void; onOpenProjects: () => void; saveStatus: AutosaveStatus; store: DrawingStore; tools: ToolManager; activeTool: ToolId; canUndo: boolean; canRedo: boolean; canTransform: boolean }

export function TopBar({ projectName, onOpenSettings, onOpenShare, onOpenLayers, onOpenProjects, saveStatus, store, tools, activeTool, canUndo, canRedo, canTransform }: TopBarProps) {
  const { t } = useI18n()
  const { settings } = useSettings()
  const [openGroup, setOpenGroup] = useState<string | null>(null)
  const disabled = (tool: ToolId | ToolbarShortcut) => ['move', 'copy', 'repeat', 'rotate', 'mirror'].includes(tool) && !canTransform
  const runShortcut = (shortcut: ToolbarShortcut) => { if (shortcut === 'undo') store.undo(); else if (shortcut === 'redo') store.redo(); else tools.activate(shortcut) }

  return <header className="top-bar editor-header">
    <div className="editor-primary-row">
      <button className="project-name-button" type="button" onClick={onOpenProjects} title={t('projects')}><KiviLogo compact /><span>{projectFileName(projectName)}</span><i className={`save-indicator is-${saveStatus}`} /></button>
      <div className="history-controls" role="toolbar" aria-label={t('history')}><button className="icon-button compact" type="button" disabled={!canUndo} onClick={() => store.undo()} aria-label={t('undo')} title={t('undo')}><Icon name="undo" /></button><button className="icon-button compact" type="button" disabled={!canRedo} onClick={() => store.redo()} aria-label={t('redo')} title={t('redo')}><Icon name="redo" /></button></div>
      <div className="editor-global-actions">
        <button className="global-action is-compact" type="button" onClick={onOpenShare} title={t('share')} aria-label={t('share')}><Icon name="share" /><span>{t('share')}</span></button>
        <button className="global-action is-compact" type="button" onClick={onOpenLayers} title={t('layers')} aria-label={t('layers')}><Icon name="layers" /><span>{t('layers')}</span></button>
        <GlobalActions compact onOpenSettings={onOpenSettings} />
      </div>
    </div>
    <div className="editor-tools-row" role="toolbar" aria-label={t('tools')}>
      {editorToolGroups.map((group) => <div className="editor-tool-group" key={group.id}>
        <button className="tool-group-trigger" type="button" onClick={() => setOpenGroup(openGroup === group.id ? null : group.id)} aria-expanded={openGroup === group.id}><span>{t(group.id)}</span><Icon name="chevronDown" /></button>
        <div className={`tool-group-items${openGroup === group.id ? ' is-open' : ''}`}>{group.tools.map((tool) => <button key={tool.id} className={`editor-tool-button${activeTool === tool.id ? ' is-active' : ''}`} type="button" disabled={disabled(tool.id)} onClick={() => { tools.activate(tool.id); setOpenGroup(null) }} title={t(tool.id)} aria-label={t(tool.id)}><Icon name={tool.icon} /><span>{t(tool.id)}</span></button>)}</div>
      </div>)}
      <div className="configured-shortcuts">{(innerWidth < 700 ? settings.mobileToolbarShortcuts : settings.desktopToolbarShortcuts).filter((item) => item !== 'undo' && item !== 'redo').map((shortcut) => <button key={shortcut} className={`editor-tool-button${activeTool === shortcut ? ' is-active' : ''}`} type="button" disabled={disabled(shortcut)} onClick={() => runShortcut(shortcut)} aria-label={t(shortcut)} title={t(shortcut)}><Icon name={shortcut === 'select' ? 'cursor' : shortcut} /></button>)}</div>
    </div>
  </header>
}
