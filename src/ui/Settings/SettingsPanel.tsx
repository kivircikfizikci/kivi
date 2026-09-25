import { Icon } from '../Icon/Icon'
import { useI18n } from '../../i18n/I18nContext'
import { useSettings } from '../../settings/useSettings'
import { useEscapeKey } from '../../hooks/useEscapeKey'
import type { Locale } from '../../i18n/types'
import { defaultSettings, type AppTheme } from '../../types/settings'
import type { ProjectSettings } from '../../types/project.ts'
import { defaultProjectSettings } from '../../project/projectMigrations.ts'

interface SettingsPanelProps {
  open: boolean
  onClose: () => void
  projectSettings: ProjectSettings
  onProjectSettingsChange: (updates: Partial<ProjectSettings>) => void
  onSave: () => void
}

export function SettingsPanel({ open, onClose, projectSettings, onProjectSettingsChange, onSave }: SettingsPanelProps) {
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

          <label className="setting-row">
            <span>{t('theme')}</span>
            <select value={settings.theme} onChange={(event) => updateSettings({ theme: event.target.value as AppTheme })}>
              <option value="light">{t('light')}</option>
              <option value="dark">{t('dark')}</option>
            </select>
          </label>

          <div className="settings-section-label settings-row-label">{t('canvas')}</div>
          <label className="setting-row color-row">
            <span>{t('background')}</span>
            <span className="color-control">
              <code>{projectSettings.backgroundColor}</code>
              <input type="color" value={projectSettings.backgroundColor} onChange={(event) => onProjectSettingsChange({ backgroundColor: event.target.value })} />
            </span>
          </label>

          <label className="setting-row">
            <span>{t('grid')}</span>
            <span className="switch-control">
              <span>{t(projectSettings.gridEnabled ? 'on' : 'off')}</span>
              <input type="checkbox" checked={projectSettings.gridEnabled} onChange={(event) => onProjectSettingsChange({ gridEnabled: event.target.checked })} />
            </span>
          </label>

          <label className="setting-row color-row">
            <span>{t('gridColor')}</span>
            <span className="color-control">
              <code>{projectSettings.gridColor}</code>
              <input type="color" value={projectSettings.gridColor} onChange={(event) => onProjectSettingsChange({ gridColor: event.target.value })} />
            </span>
          </label>

          <label className="setting-row compact-input-row">
            <span>{t('gridSpacing')}</span>
            <span className="number-control">
              <input type="number" min="0.1" step="0.1" inputMode="decimal" value={projectSettings.gridSpacing}
                onChange={(event) => { const value = Number(event.target.value); if (value > 0) onProjectSettingsChange({ gridSpacing: value }) }} />
              <span>{t('centimeters')}</span>
            </span>
          </label>

          <div className="settings-section-label settings-row-label">{t('line')}</div>
          <label className="setting-row color-row">
            <span>{t('lineColor')}</span>
            <span className="color-control">
              <input
                key={projectSettings.lineColor}
                className="hex-color-input"
                aria-label={t('lineColor')}
                defaultValue={projectSettings.lineColor.toUpperCase()}
                onBlur={(event) => {
                  const value = event.target.value.trim()
                  if (/^#[\da-f]{6}$/i.test(value)) onProjectSettingsChange({ lineColor: value.toLowerCase() })
                  else event.target.value = projectSettings.lineColor.toUpperCase()
                }}
              />
              <input type="color" value={projectSettings.lineColor} onChange={(event) => onProjectSettingsChange({ lineColor: event.target.value })} />
            </span>
          </label>

          <label className="setting-row compact-input-row">
            <span>{t('lineWidth')}</span>
            <span className="number-control">
              <input type="number" min="0.5" max="12" step="0.5" value={projectSettings.lineWidth}
                onChange={(event) => { const value = Number(event.target.value); if (value > 0) onProjectSettingsChange({ lineWidth: value }) }} />
              <span>px</span>
            </span>
          </label>

          <div className="settings-section-label settings-row-label">{t('dimension')}</div>
          <label className="setting-row color-row">
            <span>{t('dimensionColor')}</span>
            <span className="color-control">
              <code>{projectSettings.dimensionColor}</code>
              <input type="color" value={projectSettings.dimensionColor} onChange={(event) => onProjectSettingsChange({ dimensionColor: event.target.value })} />
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

          <label className="setting-row compact-input-row">
            <span>{t('angleInterval')}</span>
            <span className="number-control">
              <input type="number" min="1" max="90" step="1" value={settings.angleSnapIncrement}
                onChange={(event) => { const value = Number(event.target.value); if (value >= 1 && value <= 90) updateSettings({ angleSnapIncrement: value }) }} />
              <span>°</span>
            </span>
          </label>

          <div className="settings-actions">
            <button className="secondary-button" type="button" onClick={() => {
              onProjectSettingsChange(defaultProjectSettings())
              updateSettings({
                theme: defaultSettings.theme,
                defaultBackground: defaultSettings.defaultBackground,
                defaultGridColor: defaultSettings.defaultGridColor,
                gridEnabled: defaultSettings.gridEnabled,
                gridSpacing: defaultSettings.gridSpacing,
                defaultLineColor: defaultSettings.defaultLineColor,
                defaultLineWidth: defaultSettings.defaultLineWidth,
                defaultDimensionColor: defaultSettings.defaultDimensionColor,
                endpointSnapEnabled: defaultSettings.endpointSnapEnabled,
                midpointSnapEnabled: defaultSettings.midpointSnapEnabled,
                gridSnapEnabled: defaultSettings.gridSnapEnabled,
                angleSnapEnabled: defaultSettings.angleSnapEnabled,
                angleSnapIncrement: defaultSettings.angleSnapIncrement,
              })
            }}>{t('resetSettings')}</button>
            <button className="primary-button" type="button" onClick={onSave}>{t('saveSettings')}</button>
          </div>
        </div>
      </aside>
    </>
  )
}
