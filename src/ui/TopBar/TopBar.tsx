import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useEscapeKey } from '../../hooks/useEscapeKey.ts'
import { useI18n } from '../../i18n/I18nContext.ts'
import type { DrawingStore } from '../../project/DrawingStore.ts'
import { projectFileName } from '../../project/projectPresentation.ts'
import { useSettings } from '../../settings/useSettings.ts'
import type { ToolId } from '../../tools/Tool.ts'
import type { ToolManager } from '../../tools/ToolManager.ts'
import type { ToolbarShortcut } from '../../types/settings.ts'
import { KiviLogo } from '../Brand/KiviLogo.tsx'
import { GlobalActions } from '../GlobalActions/GlobalActions.tsx'
import { Icon } from '../Icon/Icon.tsx'
import { editorModifyActions, editorToolGroups, editorToolIcon } from './editorLayout.ts'

interface TopBarProps { projectName: string; onOpenSettings: () => void; onOpenShare: () => void; onOpenLayers: () => void; onOpenProjects: () => void; onDeleteSelection: () => void; store: DrawingStore; tools: ToolManager; activeTool: ToolId; canUndo: boolean; canRedo: boolean; canTransform: boolean; canDelete: boolean }

export function TopBar(props: TopBarProps) {
  const { t } = useI18n()
  const { settings } = useSettings()
  const [openGroup, setOpenGroup] = useState<string | null>(null)
  const [mobileMenu, setMobileMenu] = useState<'account' | 'more' | null>(null)
  useEscapeKey(() => { setOpenGroup(null); setMobileMenu(null) }, openGroup !== null || mobileMenu !== null)
  const disabled = (tool: ToolId) => ['move', 'copy', 'repeat', 'rotate', 'mirror', 'scale'].includes(tool) && !props.canTransform
  const runShortcut = (shortcut: ToolbarShortcut) => props.tools.activate(shortcut)
  const closeMobileMenus = () => setMobileMenu(null)

  return <header className="top-bar editor-header">
    <DesktopPrimaryBar {...props} shortcuts={settings.desktopToolbarShortcuts} disabled={disabled} onRunShortcut={runShortcut} />
    <div className="mobile-primary-bar">
      <div className="mobile-primary-left">
        <Link className="editor-home-link" to="/" aria-label={t('appName')} title={t('appName')}><KiviLogo compact /></Link>
      </div>
      <div className="mobile-primary-center header-center-actions">
        <HistoryControls store={props.store} canUndo={props.canUndo} canRedo={props.canRedo} onDelete={props.onDeleteSelection} canDelete={props.canDelete} />
        <ShortcutButtons shortcuts={settings.mobileToolbarShortcuts} activeTool={props.activeTool} disabled={disabled} onRun={runShortcut} />
      </div>
      <div className="mobile-primary-right">
        <button className="global-action is-compact" type="button" onClick={props.onOpenSettings} aria-label={t('settings')} title={t('settings')}><Icon name="settings" /></button>
        <div className="menu-anchor">
          <button className="global-action is-compact" type="button" onClick={() => setMobileMenu(mobileMenu === 'account' ? null : 'account')} aria-expanded={mobileMenu === 'account'} aria-label={t('account')} title={t('account')}><Icon name="account" /></button>
          {mobileMenu === 'account' && <button className="popover-dismiss" type="button" onClick={closeMobileMenus} aria-label={t('close')} />}
          <div className={`compact-popover mobile-global-popover${mobileMenu === 'account' ? ' is-open' : ''}`}><button type="button" disabled>{t('signInGoogle')}</button><button type="button" disabled>{t('account')}</button><small>{t('accountComingSoon')}</small></div>
        </div>
        <div className="menu-anchor">
          <button className="global-action is-compact" type="button" onClick={() => setMobileMenu(mobileMenu === 'more' ? null : 'more')} aria-expanded={mobileMenu === 'more'} aria-label={t('more')} title={t('more')}><Icon name="more" /></button>
          {mobileMenu === 'more' && <button className="popover-dismiss" type="button" onClick={closeMobileMenus} aria-label={t('close')} />}
          <div className={`compact-popover mobile-global-popover${mobileMenu === 'more' ? ' is-open' : ''}`}>
            <button type="button" onClick={() => { props.onOpenProjects(); closeMobileMenus() }}><Icon name="folder" />{t('projects')}</button>
            <button type="button" onClick={() => { props.onOpenShare(); closeMobileMenus() }}><Icon name="share" />{t('share')}</button>
            <button type="button" onClick={() => { props.onOpenLayers(); closeMobileMenus() }}><Icon name="layers" />{t('layers')}</button>
            <a href="#/help" target="_blank" rel="noreferrer" onClick={closeMobileMenus}><Icon name="help" />{t('help')}</a>
          </div>
        </div>
      </div>
    </div>
    <div className="editor-tool-bar" role="toolbar" aria-label={t('tools')}>
      <div className="editor-tool-groups">
        {editorToolGroups.map((group) => {
          const activeInGroup = group.tools.find((tool) => tool.id === props.activeTool)
          return <div className={`editor-tool-group${activeInGroup ? ' has-active-tool' : ''}`} key={group.id}>
            <span className="editor-tool-group-label">{t(group.id)}</span>
            <button className="tool-group-trigger" type="button" onClick={() => setOpenGroup(openGroup === group.id ? null : group.id)} aria-expanded={openGroup === group.id}><span>{t(group.id)}{activeInGroup ? ` · ${t(activeInGroup.id)}` : ''}</span><Icon name="chevronDown" /></button>
            <div className={`editor-tool-items tool-group-items${openGroup === group.id ? ' is-open' : ''}`}>
              {group.tools.map((tool) => <button key={tool.id} className={`editor-tool-button${props.activeTool === tool.id ? ' is-active' : ''}`} type="button" disabled={disabled(tool.id)} onClick={() => { props.tools.activate(tool.id); setOpenGroup(null) }} title={t(tool.id)} aria-label={t(tool.id)}><Icon name={tool.icon} /><span>{t(tool.id)}</span></button>)}
              {group.id === 'modify' && editorModifyActions.map((action) => <button key={action.id} className="editor-tool-button modify-action-button" type="button" disabled={!props.canDelete} onClick={() => { props.onDeleteSelection(); setOpenGroup(null) }} title={t(action.id)} aria-label={t(action.id)}><Icon name={action.icon} /><span>{t(action.id)}</span></button>)}
            </div>
          </div>
        })}
      </div>
    </div>
  </header>
}

function ShortcutButtons({ shortcuts, activeTool, disabled, onRun }: { shortcuts: readonly ToolbarShortcut[]; activeTool: ToolId; disabled: (shortcut: ToolbarShortcut) => boolean; onRun: (shortcut: ToolbarShortcut) => void }) {
  const { t } = useI18n()
  return <div className="configured-shortcuts" aria-label={t('shortcuts')}>{shortcuts.map((shortcut) => <button key={shortcut} className={`editor-tool-button shortcut-button${activeTool === shortcut ? ' is-active' : ''}`} type="button" disabled={disabled(shortcut)} onClick={() => onRun(shortcut)} aria-label={t(shortcut)} title={t(shortcut)}><Icon name={editorToolIcon[shortcut]} /></button>)}</div>
}

function DesktopPrimaryBar(props: TopBarProps & { shortcuts: readonly ToolbarShortcut[]; disabled: (shortcut: ToolbarShortcut) => boolean; onRunShortcut: (shortcut: ToolbarShortcut) => void }) {
  const { t } = useI18n()
  return <div className="desktop-primary-bar">
    <div className="desktop-primary-left"><Link className="editor-home-link" to="/" aria-label={t('appName')} title={t('appName')}><KiviLogo compact /></Link><button className="project-name-button" type="button" onClick={props.onOpenProjects} title={projectFileName(props.projectName)}><span className="project-name-text">{projectFileName(props.projectName)}</span></button></div>
    <div className="desktop-primary-center header-center-actions"><HistoryControls store={props.store} canUndo={props.canUndo} canRedo={props.canRedo} /><ShortcutButtons shortcuts={props.shortcuts} activeTool={props.activeTool} disabled={props.disabled} onRun={props.onRunShortcut} /></div>
    <div className="desktop-primary-right"><button className="global-action is-compact" type="button" onClick={props.onOpenShare} title={t('share')} aria-label={t('share')}><Icon name="share" /><span>{t('share')}</span></button><button className="global-action is-compact" type="button" onClick={props.onOpenLayers} title={t('layers')} aria-label={t('layers')}><Icon name="layers" /><span>{t('layers')}</span></button><GlobalActions compact onOpenSettings={props.onOpenSettings} /></div>
  </div>
}

function HistoryControls({ store, canUndo, canRedo, onDelete, canDelete = false }: { store: DrawingStore; canUndo: boolean; canRedo: boolean; onDelete?: () => void; canDelete?: boolean }) {
  const { t } = useI18n()
  return <div className="history-controls" role="toolbar" aria-label={t('history')}><button className="icon-button compact" type="button" disabled={!canUndo} onClick={() => store.undo()} aria-label={t('undo')} title={t('undo')}><Icon name="undo" /></button><button className="icon-button compact" type="button" disabled={!canRedo} onClick={() => store.redo()} aria-label={t('redo')} title={t('redo')}><Icon name="redo" /></button>{onDelete && <button className="icon-button compact mobile-delete-action" type="button" disabled={!canDelete} onClick={onDelete} aria-label={t('delete')} title={t('delete')}><Icon name="trash" /></button>}</div>
}
