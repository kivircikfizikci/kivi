import { useEffect, useRef, useState } from 'react'
import type { Layer } from '../../types/project.ts'
import { useI18n } from '../../i18n/I18nContext.ts'
import { useEscapeKey } from '../../hooks/useEscapeKey.ts'
import { transformContextActions } from './contextActions.ts'

export interface ContextMenuPosition { x: number; y: number }

export function DrawingContextMenu({ position, layers, onOffset, canOffset, onMove, onCopy, onRepeat, onMoveToLayer, onDelete, disabled = false, onClose }: {
  position: ContextMenuPosition
  layers: readonly Layer[]
  onMove: () => void
  onCopy: () => void
  onRepeat: () => void
  onOffset: () => void
  canOffset: boolean
  onMoveToLayer: (layerId: string) => void
  onDelete: () => void
  onClose: () => void
  disabled?: boolean
}) {
  const { t } = useI18n()
  const ref = useRef<HTMLDivElement>(null)
  const [submenu, setSubmenu] = useState(false)
  const transformCallbacks = { move: onMove, copy: onCopy, repeat: onRepeat }
  useEscapeKey(onClose, true)

  useEffect(() => {
    ref.current?.querySelector<HTMLButtonElement>('button')?.focus({ preventScroll: true })
  }, [])

  useEffect(() => {
    const close = (event: PointerEvent) => { if (!ref.current?.contains(event.target as Node)) onClose() }
    window.addEventListener('pointerdown', close)
    return () => window.removeEventListener('pointerdown', close)
  }, [onClose])

  return (
    <div ref={ref} className="drawing-context-menu" style={{ left: position.x, top: position.y }} role="menu" onKeyDown={(event) => { if (event.key === 'Escape') onClose() }}>
      {canOffset && <button type="button" role="menuitem" onClick={onOffset}>{t('offset')}</button>}
      {transformContextActions.map((action) => <button key={action} type="button" role="menuitem" disabled={disabled} title={disabled ? t('locked') : undefined} onClick={transformCallbacks[action]}>{t(action)}</button>)}
      <button type="button" role="menuitem" disabled={disabled} title={disabled ? t('locked') : undefined} onClick={() => setSubmenu((value) => !value)} aria-expanded={submenu}>{t('moveToLayer')} <span>›</span></button>
      {submenu && <div className="context-submenu" role="menu">
        {layers.map((layer) => <button key={layer.id} type="button" role="menuitem" onClick={() => onMoveToLayer(layer.id)}>{layer.name}</button>)}
      </div>}
      <button type="button" role="menuitem" disabled={disabled} onClick={onDelete}>{t('delete')}</button>
    </div>
  )
}
