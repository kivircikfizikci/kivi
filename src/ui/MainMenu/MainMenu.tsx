import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useEscapeKey } from '../../hooks/useEscapeKey'
import { useI18n } from '../../i18n/I18nContext'
import { Icon } from '../Icon/Icon'

export function MainMenu({ onOpenSettings }: { onOpenSettings: () => void }) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  useEscapeKey(() => setOpen(false), open)

  return (
    <div className="menu-anchor">
      <button className="icon-button" type="button" onClick={() => setOpen((value) => !value)} aria-label={t('menu')} aria-expanded={open}>
        <Icon name="menu" />
      </button>
      {open && <button className="popover-dismiss" type="button" onClick={() => setOpen(false)} aria-label={t('close')} />}
      <div className={`compact-popover main-menu${open ? ' is-open' : ''}`} aria-hidden={!open}>
        <Link to="/projects" onClick={() => setOpen(false)}><Icon name="folder" /><span>{t('projects')}</span></Link>
        <button type="button" onClick={() => { setOpen(false); onOpenSettings() }}><Icon name="settings" /><span>{t('settings')}</span></button>
      </div>
    </div>
  )
}
