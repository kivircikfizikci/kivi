import { Icon } from '../Icon/Icon'
import { useI18n } from '../../i18n/I18nContext'

export function FullscreenExit({ onExit }: { onExit: () => void }) {
  const { t } = useI18n()
  return (
    <button className="fullscreen-control fullscreen-exit icon-button" type="button" onClick={onExit} aria-label={t('exitFullscreen')} title={t('exitFullscreen')}>
      <Icon name="collapse" />
    </button>
  )
}
