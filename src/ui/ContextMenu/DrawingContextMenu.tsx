import { useEffect, useRef, useState } from 'react'
import type { Layer } from '../../types/project.ts'
import { useI18n } from '../../i18n/I18nContext.ts'
import { useEscapeKey } from '../../hooks/useEscapeKey.ts'

export interface ContextMenuPosition { x: number; y: number }

export function DrawingContextMenu({ position, layers, onMove, onDelete, onClose }: {
  position: ContextMenuPosition
  layers: readonly Layer[]
  onMove: (layerId: string) => void
  onDelete: () => void
  onClose: () => void
}) {
  const { t } = useI18n()
  const ref = useRef<HTMLDivElement>(null)
  const [submenu, setSubmenu] = useState(false)
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
      <button type="button" role="menuitem" onClick={() => setSubmenu((value) => !value)} aria-expanded={submenu}>{t('moveToLayer')} <span>›</span></button>
      {submenu && <div className="context-submenu" role="menu">
        {layers.map((layer) => <button key={layer.id} type="button" role="menuitem" onClick={() => onMove(layer.id)}>{layer.name}</button>)}
      </div>}
      <button type="button" role="menuitem" onClick={onDelete}>{t('delete')}</button>
    </div>
  )
}
