export const settingsTabs = ['preferences', 'language', 'theme', 'shortcuts', 'canvas', 'dimensions', 'snap'] as const
export type SettingsTab = (typeof settingsTabs)[number]
export function settingsPresentationForWidth(width: number) { return width < 700 ? 'fullscreen' : 'modal' }
