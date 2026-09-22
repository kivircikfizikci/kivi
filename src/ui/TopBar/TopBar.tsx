import { Icon } from '../Icon/Icon'
import { useI18n } from '../../i18n/I18nContext'
import type { AutosaveStatus } from '../../project/AutosaveManager.ts'

interface TopBarProps {
  onOpenSettings: () => void
  onEnterFullscreen: () => void
  saveStatus: AutosaveStatus
}

export function TopBar({ onOpenSettings, onEnterFullscreen, saveStatus }: TopBarProps) {
  const { t } = useI18n()
  return (
    <header className="top-bar">
      <button className="icon-button" type="button" onClick={onOpenSettings} aria-label={t('settings')} title={t('settings')}>
        <Icon name="settings" />
      </button>
      <span className="brand-status">
        <span className="brand-mark" aria-label={t('appName')}>K</span>
        <span className={`save-indicator is-${saveStatus}`} role="status" aria-label={t(saveStatus === 'error' ? 'saveError' : saveStatus)} title={t(saveStatus === 'error' ? 'saveError' : saveStatus)} />
      </span>
      <button className="icon-button" type="button" onClick={onEnterFullscreen} aria-label={t('fullscreen')} title={t('fullscreen')}>
        <Icon name="expand" />
      </button>
    </header>
  )
}
