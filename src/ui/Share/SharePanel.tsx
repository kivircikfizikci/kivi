import { useState } from 'react'
import { useEscapeKey } from '../../hooks/useEscapeKey'
import { useI18n } from '../../i18n/I18nContext'
import { CloudBackupRequiredError } from '../../share/ShareService.ts'
import { runShareAction, type ShareAction } from '../../share/runShareAction.ts'
import type { Project } from '../../types/project.ts'
import { Icon } from '../Icon/Icon'

export function SharePanel({ open, onClose, project }: { open: boolean; onClose: () => void; project: Project }) {
  const { t } = useI18n()
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  useEscapeKey(onClose, open)

  const perform = async (action: ShareAction) => {
    setBusy(true)
    setMessage(null)
    try {
      await runShareAction(action, project)
      if (action !== 'link') onClose()
    } catch (error) {
      setMessage(error instanceof CloudBackupRequiredError ? t('cloudRequired') : t('exportError'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className={`share-backdrop${open ? ' is-visible' : ''}`} onClick={onClose} aria-hidden="true" />
      <section className={`share-panel${open ? ' is-open' : ''}`} aria-hidden={!open} aria-label={t('share')}>
        <header className="share-heading">
          <h2>{t('share')}</h2>
          <button className="icon-button small" type="button" onClick={onClose} aria-label={t('close')}><Icon name="close" /></button>
        </header>
        <div className="share-actions">
          <button type="button" disabled={busy} onClick={() => void perform('png')}><Icon name="image" /><span>PNG</span></button>
          <button type="button" disabled={busy} onClick={() => void perform('pdf')}><Icon name="file" /><span>PDF</span></button>
          <button type="button" disabled={busy} onClick={() => void perform('link')}><Icon name="link" /><span>{t('link')}</span></button>
        </div>
        {message && <p className="share-message" role="status">{message}</p>}
      </section>
    </>
  )
}
