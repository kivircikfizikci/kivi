import { Icon } from '../Icon/Icon'
import { useI18n } from '../../i18n/I18nContext'
import { useEscapeKey } from '../../hooks/useEscapeKey'
import type { DrawingStore } from '../../project/DrawingStore.ts'
import type { ToolManager } from '../../tools/ToolManager.ts'
import type { ToolId } from '../../tools/Tool.ts'
import { toggleDrawer } from './drawerActions.ts'
import type { SelectToolSnapshot } from '../../tools/SelectTool.ts'

interface BottomDrawerProps {
  open: boolean
  onOpen: () => void
  onClose: () => void
  store: DrawingStore
  tools: ToolManager
  activeTool: ToolId
  selection: SelectToolSnapshot
  canUndo: boolean
  canRedo: boolean
}

export function BottomDrawer({ open, onOpen, onClose, store, tools, activeTool, selection, canUndo, canRedo }: BottomDrawerProps) {
  const { t } = useI18n()
  useEscapeKey(onClose, open)

  const activate = (tool: ToolId) => {
    tools.activate(tool)
    onClose()
  }

  const removeSelected = () => {
    if (!store.deleteEntities(selection.selectedIds)) return
    tools.select.clearSelection()
    onClose()
  }

  const toggleMultiSelection = () => {
    if (activeTool !== 'select') tools.activate('select')
    tools.select.toggleMultiMode()
  }

  return (
    <>
      <button className={`drawer-toggle${open ? ' is-open' : ''}`} type="button" onClick={() => toggleDrawer(open, onOpen, onClose)} aria-label={t(open ? 'closeTools' : 'openTools')} aria-expanded={open}>
        <Icon name={open ? 'chevronDown' : 'chevronUp'} />
      </button>
      <div className={`sheet-backdrop${open ? ' is-visible' : ''}`} onClick={onClose} aria-hidden="true" />
      <section className={`bottom-sheet${open ? ' is-open' : ''}`} aria-hidden={!open} aria-label={t('tools')}>
        <div className="sheet-heading">
          <span className="sheet-grabber" />
          <h2>{t('tools')}</h2>
          <button className="icon-button small" type="button" onClick={onClose} aria-label={t('close')}>
            <Icon name="close" />
          </button>
        </div>
        <div className="sheet-actions">
          <button className={`tool-tile${activeTool === 'line' ? ' is-active' : ''}`} type="button" onClick={() => activate('line')}>
            <Icon name="line" />
            <span>{t('line')}</span>
          </button>
          {(['rectangle', 'circle', 'arc'] as const).map((tool) => (
            <button key={tool} className={`tool-tile${activeTool === tool ? ' is-active' : ''}`} type="button" onClick={() => activate(tool)}>
              <Icon name={tool} /><span>{t(tool)}</span>
            </button>
          ))}
          <button className={`tool-tile${activeTool === 'dimension' ? ' is-active' : ''}`} type="button" onClick={() => activate('dimension')}>
            <Icon name="dimension" />
            <span>{t('dimension')}</span>
          </button>
          <button className={`tool-tile${activeTool === 'select' ? ' is-active' : ''}`} type="button" onClick={() => activate('select')}>
            <Icon name="cursor" />
            <span>{t('select')}</span>
          </button>
          <button className="tool-tile" type="button" disabled={!canUndo} onClick={() => store.undo()}>
            <Icon name="undo" />
            <span>{t('undo')}</span>
          </button>
          <button className="tool-tile" type="button" disabled={!canRedo} onClick={() => store.redo()}>
            <Icon name="redo" />
            <span>{t('redo')}</span>
          </button>
          <button className={`tool-tile${selection.multiMode ? ' is-active' : ''}`} type="button" onClick={toggleMultiSelection}>
            <Icon name="multi" /><span>{t('multi')}</span>
          </button>
          <button className="tool-tile" type="button" disabled={selection.selectedIds.size === 0} onClick={removeSelected}>
            <Icon name="trash" />
            <span>{t('delete')}</span>
          </button>
        </div>
      </section>
    </>
  )
}
