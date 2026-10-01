import { useState } from 'react'
import { useEscapeKey } from '../../hooks/useEscapeKey.ts'
import { useI18n } from '../../i18n/I18nContext.ts'
import type { Locale } from '../../i18n/types.ts'
import { projectSettingsFromDefaults } from '../../project/ProjectService.ts'
import { defaultProjectSettings } from '../../project/projectMigrations.ts'
import { useSettings } from '../../settings/useSettings.ts'
import type { ProjectSettings } from '../../types/project.ts'
import { defaultSettings, MAX_DESKTOP_TOOLBAR_SHORTCUTS, MAX_MOBILE_TOOLBAR_SHORTCUTS, toolbarShortcutIds, toggleToolbarShortcut, type AppTheme } from '../../types/settings.ts'
import { Icon } from '../Icon/Icon.tsx'
import { settingsTabs, type SettingsTab } from './settingsLayout.ts'

interface SettingsPanelProps { open: boolean; onClose: () => void; projectSettings?: ProjectSettings; onProjectSettingsChange?: (updates: Partial<ProjectSettings>) => void; onDone?: () => void }

export function SettingsPanel({ open, onClose, projectSettings, onProjectSettingsChange, onDone }: SettingsPanelProps) {
  const { t } = useI18n()
  const { settings, updateSettings } = useSettings()
  const [tab, setTab] = useState<SettingsTab>('preferences')
  const currentProject = projectSettings ?? projectSettingsFromDefaults(settings)
  useEscapeKey(onClose, open)
  const projectChange = (updates: Partial<ProjectSettings>) => {
    onProjectSettingsChange?.(updates)
    if (!projectSettings) updateSettings({
      ...(updates.backgroundColor ? { defaultBackground: updates.backgroundColor } : {}),
      ...(updates.gridColor ? { defaultGridColor: updates.gridColor } : {}),
      ...(updates.gridEnabled !== undefined ? { gridEnabled: updates.gridEnabled } : {}),
      ...(updates.gridSpacing ? { gridSpacing: updates.gridSpacing } : {}),
      ...(updates.lineColor ? { defaultLineColor: updates.lineColor } : {}),
      ...(updates.lineWidth ? { defaultLineWidth: updates.lineWidth } : {}),
      ...(updates.dimensionColor ? { defaultDimensionColor: updates.dimensionColor } : {}),
      ...(updates.dimensionDisplayUnit ? { defaultDimensionDisplayUnit: updates.dimensionDisplayUnit } : {}),
      ...(updates.showDimensionUnit !== undefined ? { defaultShowDimensionUnit: updates.showDimensionUnit } : {}),
    })
  }
  const done = () => { onDone?.(); onClose() }
  const reset = () => {
    if (projectSettings) onProjectSettingsChange?.(defaultProjectSettings())
    const { id, updatedAt, ...defaults } = defaultSettings
    void id
    void updatedAt
    updateSettings(defaults)
  }

  return <>
    <div className={`panel-backdrop settings-backdrop${open ? ' is-visible' : ''}`} onClick={onClose} aria-hidden="true" />
    <section className={`settings-panel settings-dialog${open ? ' is-open' : ''}`} role="dialog" aria-modal="true" aria-hidden={!open} aria-label={t('settings')}>
      <header className="panel-heading"><div><span>{t('appName')}</span><h2>{t('settings')}</h2></div><button className="icon-button small" type="button" onClick={onClose} aria-label={t('close')}><Icon name="close" /></button></header>
      <div className="settings-layout">
        <nav className="settings-tabs" aria-label={t('settingsSections')}>{settingsTabs.map((item) => <button key={item} type="button" className={tab === item ? 'is-active' : ''} onClick={() => setTab(item)}>{t(item)}</button>)}</nav>
        <div className="settings-content">
          <h3>{t(tab)}</h3>
          {tab === 'preferences' && <><SettingNote title={t('autosaveSettings')} body={t('autosaveSettingsHint')} /><SettingNote title={t('localFirst')} body={t('localFirstHint')} /></>}
          {tab === 'language' && <label className="setting-row"><span>{t('language')}</span><select value={settings.language} onChange={(event) => updateSettings({ language: event.target.value as Locale })}><option value="en">{t('english')}</option><option value="tr">{t('turkish')}</option></select></label>}
          {tab === 'theme' && <label className="setting-row"><span>{t('theme')}</span><select value={settings.theme} onChange={(event) => updateSettings({ theme: event.target.value as AppTheme })}><option value="light">{t('light')}</option><option value="dark">{t('dark')}</option></select></label>}
          {tab === 'shortcuts' && <><ShortcutSetting title={t('mobileShortcuts')} hint={t('mobileShortcutsHint')} selected={settings.mobileToolbarShortcuts} limit={MAX_MOBILE_TOOLBAR_SHORTCUTS} onChange={(value) => updateSettings({ mobileToolbarShortcuts: value })} /><ShortcutSetting title={t('desktopShortcuts')} hint={t('desktopShortcutsHint')} selected={settings.desktopToolbarShortcuts} limit={MAX_DESKTOP_TOOLBAR_SHORTCUTS} onChange={(value) => updateSettings({ desktopToolbarShortcuts: value })} /></>}
          {tab === 'canvas' && <><ColorSetting label={t('background')} value={currentProject.backgroundColor} onChange={(backgroundColor) => projectChange({ backgroundColor })} /><ToggleSetting label={t('grid')} checked={currentProject.gridEnabled} onChange={(gridEnabled) => projectChange({ gridEnabled })} /><ColorSetting label={t('gridColor')} value={currentProject.gridColor} onChange={(gridColor) => projectChange({ gridColor })} /><NumberSetting label={t('gridSpacing')} value={currentProject.gridSpacing} min={0.1} step={0.1} suffix="cm" onChange={(gridSpacing) => projectChange({ gridSpacing })} /><ColorSetting label={t('lineColor')} value={currentProject.lineColor} onChange={(lineColor) => projectChange({ lineColor })} /><NumberSetting label={t('lineWidth')} value={currentProject.lineWidth} min={0.5} step={0.5} suffix="px" onChange={(lineWidth) => projectChange({ lineWidth })} /></>}
          {tab === 'dimensions' && <><ColorSetting label={t('dimensionColor')} value={currentProject.dimensionColor} onChange={(dimensionColor) => projectChange({ dimensionColor })} /><label className="setting-row"><span>{t('displayUnit')}</span><select value={currentProject.dimensionDisplayUnit} onChange={(event) => projectChange({ dimensionDisplayUnit: event.target.value as 'cm' | 'mm' })}><option>cm</option><option>mm</option></select></label><ToggleSetting label={t('showUnit')} checked={currentProject.showDimensionUnit} onChange={(showDimensionUnit) => projectChange({ showDimensionUnit })} /></>}
          {tab === 'snap' && <><ToggleSetting label={t('endpoint')} checked={settings.endpointSnapEnabled} onChange={(endpointSnapEnabled) => updateSettings({ endpointSnapEnabled })} /><ToggleSetting label={t('midpoint')} checked={settings.midpointSnapEnabled} onChange={(midpointSnapEnabled) => updateSettings({ midpointSnapEnabled })} /><ToggleSetting label={t('gridSnap')} checked={settings.gridSnapEnabled} onChange={(gridSnapEnabled) => updateSettings({ gridSnapEnabled })} /><ToggleSetting label={t('angle')} checked={settings.angleSnapEnabled} onChange={(angleSnapEnabled) => updateSettings({ angleSnapEnabled })} /><NumberSetting label={t('angleInterval')} value={settings.angleSnapIncrement} min={1} max={90} step={1} suffix="°" onChange={(angleSnapIncrement) => updateSettings({ angleSnapIncrement })} /></>}
        </div>
      </div>
      <footer className="settings-actions"><span>{t('changesSavedAutomatically')}</span><button className="secondary-button" type="button" onClick={reset}>{t('resetSettings')}</button><button className="primary-button" type="button" onClick={done}>{t('done')}</button></footer>
    </section>
  </>
}

function SettingNote({ title, body }: { title: string; body: string }) { return <div className="setting-note"><strong>{title}</strong><p>{body}</p></div> }
function ToggleSetting({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) { const { t } = useI18n(); return <label className="setting-row"><span>{label}</span><span className="switch-control"><span>{t(checked ? 'on' : 'off')}</span><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} /></span></label> }
function ColorSetting({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="setting-row color-row"><span>{label}</span><span className="color-control"><code>{value}</code><input type="color" value={value} onChange={(event) => onChange(event.target.value)} /></span></label> }
function NumberSetting({ label, value, min, max, step, suffix, onChange }: { label: string; value: number; min: number; max?: number; step: number; suffix: string; onChange: (value: number) => void }) { return <label className="setting-row"><span>{label}</span><span className="number-control"><input type="number" value={value} min={min} max={max} step={step} onChange={(event) => { const next = Number(event.target.value); if (next >= min && (!max || next <= max)) onChange(next) }} /><span>{suffix}</span></span></label> }
function ShortcutSetting({ title, hint, selected, limit, onChange }: { title: string; hint: string; selected: readonly (typeof toolbarShortcutIds)[number][]; limit: number; onChange: (value: (typeof toolbarShortcutIds)[number][]) => void }) { const { t } = useI18n(); return <div className="toolbar-shortcut-setting"><span className="setting-description"><strong>{title}</strong><small>{hint}</small></span><span className="toolbar-shortcut-options">{toolbarShortcutIds.map((shortcut) => { const active = selected.includes(shortcut); return <label key={shortcut} className={`shortcut-option${active ? ' is-selected' : ''}`}><input type="checkbox" checked={active} disabled={!active && selected.length >= limit} onChange={() => onChange(toggleToolbarShortcut(selected, shortcut, limit))} /><Icon name={shortcut === 'select' ? 'cursor' : shortcut} /><span>{t(shortcut)}</span></label> })}</span></div> }
