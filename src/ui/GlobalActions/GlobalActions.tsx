import { useState } from 'react'
import { useEscapeKey } from '../../hooks/useEscapeKey.ts'
import { useI18n } from '../../i18n/I18nContext.ts'
import { Icon } from '../Icon/Icon.tsx'

const helpItems = [
  ['help', '/help'],
  ['whatsNew', '/help/release-notes'],
  ['about', '/help/about'],
  ['provideFeedback', '/help/feedback'],
  ['social', '/help/social'],
  ['contactSupport', '/help/support'],
] as const

export function GlobalActions({ onOpenSettings, compact = false }: { onOpenSettings: () => void; compact?: boolean }) {
  const { t } = useI18n()
  const [menu, setMenu] = useState<'help' | 'account' | null>(null)
  useEscapeKey(() => setMenu(null), menu !== null)
  const openClass = compact ? ' global-action is-compact' : ' global-action'

  return (
    <nav className="global-actions" aria-label={t('globalNavigation')}>
      <button className={openClass} type="button" onClick={onOpenSettings} title={t('settings')} aria-label={t('settings')}>
        <Icon name="settings" /><span>{t('settings')}</span>
      </button>
      <div className="menu-anchor">
        <button className={openClass} type="button" onClick={() => setMenu(menu === 'help' ? null : 'help')} aria-expanded={menu === 'help'} title={t('help')} aria-label={t('help')}>
          <Icon name="help" /><span>{t('help')}</span>
        </button>
        {menu === 'help' && <MenuDismiss onDismiss={() => setMenu(null)} label={t('close')} />}
        <div className={`compact-popover global-popover${menu === 'help' ? ' is-open' : ''}`}>
          {helpItems.map(([label, route]) => <a key={route} href={`#${route}`} target="_blank" rel="noreferrer" onClick={() => setMenu(null)}>{t(label)}</a>)}
        </div>
      </div>
      <div className="menu-anchor">
        <button className={`${openClass} avatar-button`} type="button" onClick={() => setMenu(menu === 'account' ? null : 'account')} aria-expanded={menu === 'account'} title={t('account')} aria-label={t('account')}>
          <Icon name="account" /><span>{t('account')}</span>
        </button>
        {menu === 'account' && <MenuDismiss onDismiss={() => setMenu(null)} label={t('close')} />}
        <div className={`compact-popover global-popover${menu === 'account' ? ' is-open' : ''}`}>
          <button type="button" disabled>{t('signInGoogle')}</button>
          <button type="button" disabled>{t('account')}</button>
          <small>{t('accountComingSoon')}</small>
        </div>
      </div>
    </nav>
  )
}

function MenuDismiss({ onDismiss, label }: { onDismiss: () => void; label: string }) {
  return <button className="popover-dismiss" type="button" onClick={onDismiss} aria-label={label} />
}
