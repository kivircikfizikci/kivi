import { useState } from 'react'
import { useI18n } from '../../i18n/I18nContext'

export function CommandBar({ onCommand }: { onCommand: (command: string) => boolean }) {
  const { t } = useI18n()
  const [value, setValue] = useState('')
  return (
    <form className="command-bar" onSubmit={(event) => {
      event.preventDefault()
      if (onCommand(value.trim().toLowerCase())) setValue('')
    }}>
      <span aria-hidden="true">›</span>
      <input value={value} onChange={(event) => setValue(event.target.value)} aria-label={t('command')} placeholder={t('command')} autoComplete="off" spellCheck="false" />
    </form>
  )
}
