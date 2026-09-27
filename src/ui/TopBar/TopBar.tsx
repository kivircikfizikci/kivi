import { Icon } from '../Icon/Icon'
import { useI18n } from '../../i18n/I18nContext'
import type { AutosaveStatus } from '../../project/AutosaveManager.ts'
import type { DrawingStore } from '../../project/DrawingStore.ts'
import type { ToolManager } from '../../tools/ToolManager.ts'
import type { ToolId } from '../../tools/Tool.ts'
import { MainMenu } from '../MainMenu/MainMenu.tsx'
import { ToolsMenu } from '../ToolsMenu/ToolsMenu.tsx'
import { useSettings } from '../../settings/useSettings.ts'
import type { ToolbarShortcut } from '../../types/settings.ts'

interface TopBarProps {
  onOpenSettings: () => void
  onOpenShare: () => void
  onOpenLayers: () => void
  onOpenProjects: () => void
  saveStatus: AutosaveStatus
  store: DrawingStore
  tools: ToolManager
  activeTool: ToolId
  canUndo: boolean
  canRedo: boolean
  canTransform: boolean
}

export function TopBar({ onOpenSettings, onOpenShare, onOpenLayers, onOpenProjects, saveStatus, store, tools, activeTool, canUndo, canRedo, canTransform }: TopBarProps) {
  const { t } = useI18n()
  const { settings } = useSettings()

  const shortcutDisabled = (shortcut: ToolbarShortcut) => {
    if (shortcut === 'move' || shortcut === 'copy') return !canTransform
    if (shortcut === 'undo') return !canUndo
    if (shortcut === 'redo') return !canRedo
    return false
  }

  const runShortcut = (shortcut: ToolbarShortcut) => {
    if (shortcut === 'undo') store.undo()
    else if (shortcut === 'redo') store.redo()
    else tools.activate(shortcut)
  }

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
        <ToolsMenu tools={tools} activeTool={activeTool} canTransform={canTransform} />
        {settings.desktopToolbarShortcuts.map((shortcut) => (
          <button
            key={shortcut}
            className={`icon-button compact${shortcut === activeTool ? ' is-active' : ''}`}
            type="button"
            disabled={shortcutDisabled(shortcut)}
            onClick={() => runShortcut(shortcut)}
            aria-label={t(shortcut)}
            title={t(shortcut)}
          >
            <Icon name={shortcut === 'select' ? 'cursor' : shortcut} />
          </button>
        ))}
      </div>
      <div className="mobile-toolbar-shortcuts" role="toolbar" aria-label={t('mobileShortcuts')}>
        {settings.mobileToolbarShortcuts.map((shortcut) => (
          <button
            key={shortcut}
            className={`icon-button mobile-shortcut-button${shortcut === activeTool ? ' is-active' : ''}`}
            type="button"
            disabled={shortcutDisabled(shortcut)}
            onClick={() => runShortcut(shortcut)}
            aria-label={t(shortcut)}
            title={t(shortcut)}
          >
            <Icon name={shortcut === 'select' ? 'cursor' : shortcut} />
          </button>
        ))}
      </div>
      <div className="toolbar-group toolbar-right">
        <button className="share-button projects-button" type="button" onClick={onOpenProjects} aria-label={t('projects')} title={t('projects')}>
          <Icon name="folder" /><span>{t('projects')}</span>
        </button>
        <button className="share-button" type="button" onClick={onOpenShare} aria-label={t('share')} title={t('share')}>
          <Icon name="share" /><span>{t('share')}</span>
        </button>
      </div>
    </header>
  )
}
