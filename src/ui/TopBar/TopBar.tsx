import { useState } from 'react'
import { useEscapeKey } from '../../hooks/useEscapeKey.ts'
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

export function TopBar(props: TopBarProps) {
  const { t } = useI18n()
  const { settings } = useSettings()
  const [openGroup, setOpenGroup] = useState<string | null>(null)
  const [mobileMenu, setMobileMenu] = useState<'account' | 'more' | null>(null)
  useEscapeKey(() => { setOpenGroup(null); setMobileMenu(null) }, openGroup !== null || mobileMenu !== null)
  const desktopShortcuts = new Set<ToolId>(settings.desktopToolbarShortcuts.filter((item): item is Exclude<ToolbarShortcut, 'undo' | 'redo'> => item !== 'undo' && item !== 'redo'))
  const disabled = (tool: ToolId | ToolbarShortcut) => ['move', 'copy', 'repeat', 'rotate', 'mirror'].includes(tool) && !props.canTransform
  const closeMobileMenus = () => setMobileMenu(null)

  return <header className="top-bar editor-header">
    <DesktopPrimaryBar {...props} />
    <div className="mobile-primary-bar">
      <div className="mobile-primary-left">
        <button className="mobile-project-button" type="button" onClick={props.onOpenProjects} title={projectFileName(props.projectName)} aria-label={t('projects')}><KiviLogo compact /><i className={`save-indicator is-${props.saveStatus}`} /></button>
      </div>
      <HistoryControls store={props.store} canUndo={props.canUndo} canRedo={props.canRedo} className="mobile-primary-center" />
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
            <button type="button" onClick={() => { props.onOpenShare(); closeMobileMenus() }}><Icon name="share" />{t('share')}</button>
            <button type="button" onClick={() => { props.onOpenLayers(); closeMobileMenus() }}><Icon name="layers" />{t('layers')}</button>
            <a href="#/help" target="_blank" rel="noreferrer" onClick={closeMobileMenus}><Icon name="help" />{t('help')}</a>
          </div>
        </div>
      </div>
    </div>
    <div className="editor-tool-bar" role="toolbar" aria-label={t('tools')}>
      {editorToolGroups.map((group) => {
        const activeInGroup = group.tools.find((tool) => tool.id === props.activeTool)
        return <div className={`editor-tool-group${activeInGroup ? ' has-active-tool' : ''}`} key={group.id}>
          <span className="editor-tool-group-label">{t(group.id)}</span>
          <button className="tool-group-trigger" type="button" onClick={() => setOpenGroup(openGroup === group.id ? null : group.id)} aria-expanded={openGroup === group.id}><span>{t(group.id)}{activeInGroup ? ` · ${t(activeInGroup.id)}` : ''}</span><Icon name="chevronDown" /></button>
          <div className={`editor-tool-items tool-group-items${openGroup === group.id ? ' is-open' : ''}`}>{[...group.tools].sort((a, b) => Number(desktopShortcuts.has(b.id)) - Number(desktopShortcuts.has(a.id))).map((tool) => <button key={tool.id} className={`editor-tool-button${props.activeTool === tool.id ? ' is-active' : ''}${desktopShortcuts.has(tool.id) ? ' is-shortcut' : ''}`} type="button" disabled={disabled(tool.id)} onClick={() => { props.tools.activate(tool.id); setOpenGroup(null) }} title={t(tool.id)} aria-label={t(tool.id)}><Icon name={tool.icon} /><span>{t(tool.id)}</span></button>)}</div>
        </div>
      })}
    </div>
  </header>
}

function DesktopPrimaryBar(props: TopBarProps) {
  const { t } = useI18n()
  return <div className="desktop-primary-bar">
    <div className="desktop-primary-left"><button className="project-name-button" type="button" onClick={props.onOpenProjects} title={projectFileName(props.projectName)}><KiviLogo compact /><span className="project-name-text">{projectFileName(props.projectName)}</span><i className={`save-indicator is-${props.saveStatus}`} /></button></div>
    <HistoryControls store={props.store} canUndo={props.canUndo} canRedo={props.canRedo} className="desktop-primary-center" />
    <div className="desktop-primary-right"><button className="global-action is-compact" type="button" onClick={props.onOpenShare} title={t('share')} aria-label={t('share')}><Icon name="share" /><span>{t('share')}</span></button><button className="global-action is-compact" type="button" onClick={props.onOpenLayers} title={t('layers')} aria-label={t('layers')}><Icon name="layers" /><span>{t('layers')}</span></button><GlobalActions compact onOpenSettings={props.onOpenSettings} /></div>
  </div>
}

function HistoryControls({ store, canUndo, canRedo, className }: { store: DrawingStore; canUndo: boolean; canRedo: boolean; className: string }) {
  const { t } = useI18n()
  return <div className={`${className} history-controls`} role="toolbar" aria-label={t('history')}><button className="icon-button compact" type="button" disabled={!canUndo} onClick={() => store.undo()} aria-label={t('undo')} title={t('undo')}><Icon name="undo" /></button><button className="icon-button compact" type="button" disabled={!canRedo} onClick={() => store.redo()} aria-label={t('redo')} title={t('redo')}><Icon name="redo" /></button></div>
}
