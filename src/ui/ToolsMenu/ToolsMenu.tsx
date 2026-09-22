import { useState } from 'react'
import { useEscapeKey } from '../../hooks/useEscapeKey'
import { useI18n } from '../../i18n/I18nContext'
import type { ToolManager } from '../../tools/ToolManager.ts'
import type { ToolId } from '../../tools/Tool.ts'
import { Icon } from '../Icon/Icon'
import { activateToolFromMenu } from './toolMenuActions.ts'

export function ToolsMenu({ tools, activeTool }: { tools: ToolManager; activeTool: ToolId }) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  useEscapeKey(() => setOpen(false), open)
  const items = [
    ['select', 'cursor', 'select'],
    ['line', 'line', 'line'],
    ['dimension', 'dimension', 'dimension'],
  ] as const

  return (
    <div className="menu-anchor tools-menu-anchor">
      <button className="tools-menu-button" type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
        <Icon name="tools" />
        <span>{t('tools')}: {t(activeTool === 'dimension' ? 'dimension' : activeTool)}</span>
        <Icon name="chevronDown" />
      </button>
      {open && <button className="popover-dismiss" type="button" onClick={() => setOpen(false)} aria-label={t('close')} />}
      <div className={`compact-popover tools-popover${open ? ' is-open' : ''}`} aria-hidden={!open}>
        {items.map(([tool, icon, label]) => (
          <button className={activeTool === tool ? 'is-active' : ''} type="button" key={tool} onClick={() => activateToolFromMenu(tools, tool, () => setOpen(false))}>
            <Icon name={icon} /><span>{t(label)}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
