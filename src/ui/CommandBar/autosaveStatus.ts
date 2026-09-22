import type { TranslationKey } from '../../i18n/types.ts'
import type { AutosaveStatus } from '../../project/AutosaveManager.ts'

export function displayedAutosaveStatus(status: AutosaveStatus, dirty: boolean): AutosaveStatus {
  return status === 'saved' && dirty ? 'saving' : status
}

export function autosaveStatusKey(status: AutosaveStatus, dirty = false): TranslationKey {
  const displayed = displayedAutosaveStatus(status, dirty)
  if (displayed === 'saving') return 'savingStatus'
  if (displayed === 'error') return 'saveIssue'
  return 'savedStatus'
}
