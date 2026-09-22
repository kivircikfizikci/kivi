import { Icon } from '../Icon/Icon'
import { useI18n } from '../../i18n/I18nContext'
import type { AutosaveStatus } from '../../project/AutosaveManager.ts'
import type { DrawingStore } from '../../project/DrawingStore.ts'
import type { ToolManager } from '../../tools/ToolManager.ts'
import type { ToolId } from '../../tools/Tool.ts'
import { MainMenu } from '../MainMenu/MainMenu.tsx'
import { ToolsMenu } from '../ToolsMenu/ToolsMenu.tsx'

interface TopBarProps {
  onOpenSettings: () => void
  onOpenShare: () => void
  saveStatus: AutosaveStatus
  store: DrawingStore
  tools: ToolManager
  activeTool: ToolId
  canUndo: boolean
  canRedo: boolean
}

export function TopBar({ onOpenSettings, onOpenShare, saveStatus, store, tools, activeTool, canUndo, canRedo }: TopBarProps) {
  const { t } = useI18n()
  return (
    <header className="top-bar">
      <div className="top-bar-left">
        <MainMenu onOpenSettings={onOpenSettings} />
        <span className="brand-status">
          <span className="brand-mark" aria-label={t('appName')}>K</span>
          <span className={`save-indicator is-${saveStatus}`} role="status" aria-label={t(saveStatus === 'error' ? 'saveError' : saveStatus)} title={t(saveStatus === 'error' ? 'saveError' : saveStatus)} />
        </span>
      </div>
      <div className="desktop-top-actions">
        <ToolsMenu tools={tools} activeTool={activeTool} />
        <button className="icon-button compact" type="button" disabled={!canUndo} onClick={() => store.undo()} aria-label={t('undo')}><Icon name="undo" /></button>
        <button className="icon-button compact" type="button" disabled={!canRedo} onClick={() => store.redo()} aria-label={t('redo')}><Icon name="redo" /></button>
      </div>
      <button className="share-button" type="button" onClick={onOpenShare} aria-label={t('share')} title={t('share')}>
        <Icon name="share" />
        <span>{t('share')}</span>
      </button>
    </header>
  )
}
