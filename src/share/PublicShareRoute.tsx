import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { DrawingWorkspace } from '../app/DrawingWorkspace.tsx'
import { useI18n } from '../i18n/I18nContext.ts'
import type { PublicShare } from './ShareService.ts'
import { shareService } from './ShareService.ts'

export function PublicShareRoute() {
  const { shareId } = useParams()
  const { t } = useI18n()
  const [share, setShare] = useState<PublicShare | null>(null)
  const [unavailable, setUnavailable] = useState(false)

  useEffect(() => {
    let active = true
    if (!shareId) {
      setUnavailable(true)
      return
    }
    void shareService.getPublicShare(shareId)
      .then((value) => {
        if (!active) return
        if (value) setShare(value)
        else setUnavailable(true)
      })
      .catch(() => {
        if (active) setUnavailable(true)
      })
    return () => { active = false }
  }, [shareId])

  if (share) return <DrawingWorkspace project={share.project} mode="view" />
  return (
    <main className="public-share-state" role="status">
      <strong>{t('viewOnly')}</strong>
      <span>{unavailable ? t('cloudRequired') : t('loading')}</span>
    </main>
  )
}
