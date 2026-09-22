import { Icon } from '../Icon/Icon'
import { useI18n } from '../../i18n/I18nContext'
import { useSettings } from '../../settings/useSettings'
import { useEscapeKey } from '../../hooks/useEscapeKey'
import type { Locale } from '../../i18n/types'
import type { ProjectSettings } from '../../types/project.ts'

interface SettingsPanelProps {
  open: boolean
  onClose: () => void
  projectSettings: ProjectSettings
  onProjectSettingsChange: (updates: Partial<ProjectSettings>) => void
}

export function SettingsPanel({ open, onClose, projectSettings, onProjectSettingsChange }: SettingsPanelProps) {
  const { t } = useI18n()
  const { settings, updateSettings } = useSettings()
  useEscapeKey(onClose, open)

  return (
    <>
      <div className={`panel-backdrop${open ? ' is-visible' : ''}`} onClick={onClose} aria-hidden="true" />
      <aside className={`settings-panel${open ? ' is-open' : ''}`} aria-hidden={!open} aria-label={t('settings')}>
        <header className="panel-heading">
          <h2>{t('settings')}</h2>
          <button className="icon-button small" type="button" onClick={onClose} aria-label={t('close')}>
            <Icon name="close" />
          </button>
        </header>

        <div className="settings-list">
          <label className="setting-row">
            <span>{t('language')}</span>
            <select value={settings.language} onChange={(event) => updateSettings({ language: event.target.value as Locale })}>
              <option value="en">{t('english')}</option>
              <option value="tr">{t('turkish')}</option>
            </select>
          </label>

          <label className="setting-row color-row">
            <span>{t('background')}</span>
            <span className="color-control">
              <code>{projectSettings.backgroundColor}</code>
              <input type="color" value={projectSettings.backgroundColor} onChange={(event) => onProjectSettingsChange({ backgroundColor: event.target.value })} />
            </span>
          </label>

          <label className="setting-row color-row">
            <span>{t('gridColor')}</span>
            <span className="color-control">
              <code>{projectSettings.gridColor}</code>
              <input type="color" value={projectSettings.gridColor} onChange={(event) => onProjectSettingsChange({ gridColor: event.target.value })} />
            </span>
          </label>

          <label className="setting-row">
            <span>{t('grid')}</span>
            <span className="switch-control">
              <span>{t(projectSettings.gridEnabled ? 'on' : 'off')}</span>
              <input type="checkbox" checked={projectSettings.gridEnabled} onChange={(event) => onProjectSettingsChange({ gridEnabled: event.target.checked })} />
            </span>
          </label>

          <label className="setting-row compact-input-row">
            <span>{t('gridSpacing')}</span>
            <span className="number-control">
              <input
                type="number"
                min="0.1"
                step="0.1"
                inputMode="decimal"
                value={projectSettings.gridSpacing}
                onChange={(event) => {
                  const value = Number(event.target.value)
                  if (value > 0) onProjectSettingsChange({ gridSpacing: value })
                }}
              />
              <span>{t('centimeters')}</span>
            </span>
          </label>

          <label className="setting-row">
            <span>{t('displayUnit')}</span>
            <select value={projectSettings.dimensionDisplayUnit} onChange={(event) => onProjectSettingsChange({ dimensionDisplayUnit: event.target.value as 'cm' | 'mm' })}>
              <option value="cm">cm</option>
              <option value="mm">mm</option>
            </select>
          </label>

          <label className="setting-row">
            <span>{t('showUnit')}</span>
            <span className="switch-control">
              <span>{t(projectSettings.showDimensionUnit ? 'on' : 'off')}</span>
              <input type="checkbox" checked={projectSettings.showDimensionUnit} onChange={(event) => onProjectSettingsChange({ showDimensionUnit: event.target.checked })} />
            </span>
          </label>

          <div className="setting-row defaults-action-row">
            <button
              className="text-button"
              type="button"
              onClick={() => updateSettings({
                defaultBackground: projectSettings.backgroundColor,
                defaultGridColor: projectSettings.gridColor,
                gridEnabled: projectSettings.gridEnabled,
                gridSpacing: projectSettings.gridSpacing,
              })}
            >
              {t('useAsDefaults')}
            </button>
          </div>

          <div className="snap-settings" role="group" aria-label={t('snap')}>
            <span className="settings-section-label">{t('snap')}</span>
            {([
              ['angleSnapEnabled', 'angle'],
              ['endpointSnapEnabled', 'endpoint'],
              ['midpointSnapEnabled', 'midpoint'],
              ['gridSnapEnabled', 'gridSnap'],
            ] as const).map(([key, label]) => (
              <label key={key} className="snap-chip">
                <input type="checkbox" checked={settings[key]} onChange={(event) => updateSettings({ [key]: event.target.checked })} />
                <span>{t(label)}</span>
              </label>
            ))}
          </div>
        </div>
      </aside>
    </>
  )
}
