import { useI18n } from '../../i18n/I18nContext.ts'
import { useSettings } from '../../settings/useSettings.ts'
import { Icon } from '../Icon/Icon.tsx'
import { snapQuickControlItems, toggledSnapSetting } from './snapQuickControls.ts'

export function SnapQuickControls() {
  const { t } = useI18n()
  const { settings, updateSettings } = useSettings()

  return (
    <div className="snap-quick-controls" role="group" aria-label={t('snap')}>
      {snapQuickControlItems.map((item) => {
        const active = settings[item.key]
        const label = t(item.labelKey)
        return (
          <button key={item.key} className={`icon-button${active ? ' is-active' : ''}`} type="button"
            aria-label={label} title={label} aria-pressed={active}
            onClick={() => updateSettings(toggledSnapSetting(settings, item.key))}>
            <Icon name={item.icon} />
          </button>
        )
      })}
    </div>
  )
}
