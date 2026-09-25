import { Icon } from '../Icon/Icon'
import { useI18n } from '../../i18n/I18nContext'
import type { AutosaveStatus } from '../../project/AutosaveManager.ts'
import type { DrawingStore } from '../../project/DrawingStore.ts'
import type { ToolManager } from '../../tools/ToolManager.ts'
import type { ToolId } from '../../tools/Tool.ts'
import { MainMenu } from '../MainMenu/MainMenu.tsx'
import { ToolsMenu } from '../ToolsMenu/ToolsMenu.tsx'
import { Link } from 'react-router-dom'

interface TopBarProps {
  onOpenSettings: () => void
  onOpenShare: () => void
  onOpenLayers: () => void
  saveStatus: AutosaveStatus
  store: DrawingStore
  tools: ToolManager
  activeTool: ToolId
  canUndo: boolean
  canRedo: boolean
}

export function TopBar({ onOpenSettings, onOpenShare, onOpenLayers, saveStatus, store, tools, activeTool, canUndo, canRedo }: TopBarProps) {
  const { t } = useI18n()
  return (
    <header className="top-bar">
      <div className="toolbar-group toolbar-left">
        <MainMenu onOpenSettings={onOpenSettings} onOpenLayers={onOpenLayers} />
        <span className="brand-status">
          <span className="brand-mark" aria-label={t('appName')}>K</span>
          <span className={`save-indicator is-${saveStatus}`} role="status" aria-label={t(saveStatus === 'error' ? 'saveError' : saveStatus)} title={t(saveStatus === 'error' ? 'saveError' : saveStatus)} />
        </span>
      </div>
      <div className="toolbar-group toolbar-center">
        <ToolsMenu tools={tools} activeTool={activeTool} />
        <button className="icon-button compact" type="button" disabled={!canUndo} onClick={() => store.undo()} aria-label={t('undo')}><Icon name="undo" /></button>
        <button className="icon-button compact" type="button" disabled={!canRedo} onClick={() => store.redo()} aria-label={t('redo')}><Icon name="redo" /></button>
      </div>
      <div className="toolbar-group toolbar-right">
        <Link className="share-button projects-button" to="/projects" aria-label={t('projects')} title={t('projects')}>
          <Icon name="folder" /><span>{t('projects')}</span>
        </Link>
        <button className="share-button" type="button" onClick={onOpenShare} aria-label={t('share')} title={t('share')}>
          <Icon name="share" /><span>{t('share')}</span>
        </button>
      </div>
    </header>
  )
}
