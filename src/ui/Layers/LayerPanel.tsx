import { useState } from 'react'
import type { Layer } from '../../types/project.ts'
import { useI18n } from '../../i18n/I18nContext.ts'
import { useEscapeKey } from '../../hooks/useEscapeKey.ts'
import { Icon } from '../Icon/Icon.tsx'

interface LayerPanelProps {
  open: boolean
  layers: readonly Layer[]
  activeLayerId: string
  onClose: () => void
  onCreate: (name: string) => void
  onRename: (id: string, name: string) => void
  onUpdate: (id: string, updates: Partial<Pick<Layer, 'visible' | 'locked'>>) => void
  onSetActive: (id: string) => void
  onDelete: (id: string) => void
}

export function LayerPanel({ open, layers, activeLayerId, onClose, onCreate, onRename, onUpdate, onSetActive, onDelete }: LayerPanelProps) {
  const { t } = useI18n()
  const [name, setName] = useState('')
  useEscapeKey(onClose, open)

  return (
    <>
      <button className={`layer-backdrop${open ? ' is-visible' : ''}`} type="button" onClick={onClose} aria-label={t('close')} />
      <aside className={`layer-panel${open ? ' is-open' : ''}`} aria-hidden={!open} aria-label={t('layers')}>
        <header className="panel-heading">
          <h2>{t('layers')}</h2>
          <button className="icon-button small" type="button" onClick={onClose} aria-label={t('close')}><Icon name="close" /></button>
        </header>
        <div className="layer-list">
          {layers.map((layer) => (
            <div className={`layer-row${layer.id === activeLayerId ? ' is-active' : ''}`} key={layer.id}>
              <button className="layer-name" type="button" disabled={!layer.visible || layer.locked || layer.id === 'dimensions'} onClick={() => onSetActive(layer.id)} title={t('activeLayer')}>
                <span className="layer-dot" />{layer.name}
              </button>
              <button className="layer-state" type="button" onClick={() => onUpdate(layer.id, { visible: !layer.visible })} aria-label={t(layer.visible ? 'hideLayer' : 'showLayer')}><Icon name={layer.visible ? 'eye' : 'eyeOff'} /></button>
              <button className="layer-state" type="button" onClick={() => onUpdate(layer.id, { locked: !layer.locked })} aria-label={t(layer.locked ? 'unlockLayer' : 'lockLayer')}><Icon name={layer.locked ? 'lock' : 'unlock'} /></button>
              {!layer.builtIn && (
                <>
                  <button className="layer-state" type="button" onClick={() => { const next = window.prompt(t('layerName'), layer.name); if (next) onRename(layer.id, next) }} aria-label={t('rename')}><Icon name="edit" /></button>
                  <button className="layer-state" type="button" onClick={() => { if (window.confirm(t('deleteLayerConfirm'))) onDelete(layer.id) }} aria-label={t('delete')}><Icon name="trash" /></button>
                </>
              )}
            </div>
          ))}
        </div>
        <form className="new-layer-form" onSubmit={(event) => { event.preventDefault(); if (name.trim()) { onCreate(name); setName('') } }}>
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder={t('layerName')} aria-label={t('layerName')} />
          <button className="text-button" type="submit"><Icon name="plus" />{t('newLayer')}</button>
        </form>
      </aside>
    </>
  )
}
