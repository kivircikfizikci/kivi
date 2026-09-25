import type { TranslationKey } from '../../i18n/types.ts'
import type { AppSettings } from '../../types/settings.ts'
import type { IconName } from '../Icon/Icon.tsx'

export type SnapSettingKey = 'endpointSnapEnabled' | 'midpointSnapEnabled' | 'gridSnapEnabled' | 'angleSnapEnabled'

export const snapQuickControlItems: readonly { key: SnapSettingKey; labelKey: TranslationKey; icon: IconName }[] = [
  { key: 'endpointSnapEnabled', labelKey: 'endpoint', icon: 'endpoint' },
  { key: 'midpointSnapEnabled', labelKey: 'midpoint', icon: 'midpoint' },
  { key: 'gridSnapEnabled', labelKey: 'gridSnap', icon: 'gridSnap' },
  { key: 'angleSnapEnabled', labelKey: 'angle', icon: 'angleSnap' },
]

export function toggledSnapSetting(settings: AppSettings, key: SnapSettingKey): Pick<AppSettings, SnapSettingKey> {
  return { [key]: !settings[key] } as Pick<AppSettings, SnapSettingKey>
}
