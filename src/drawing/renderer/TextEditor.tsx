import { useEffect, useRef, useState, type CSSProperties } from 'react'
import type { TextEntity } from '../entities/TextEntity.ts'
import type { Point } from '../geometry/Point.ts'
import { useI18n } from '../../i18n/I18nContext.ts'
import type { TextDraftUpdate } from '../../tools/TextTool.ts'

const fonts = ['Arial', 'Inter', 'Roboto', 'Verdana', 'Georgia', 'Times New Roman', 'Courier New']

export function TextEditor({ draft, position, onChange, onCancel, onConfirm }: { draft: TextEntity; position?: Point; onChange: (updates: TextDraftUpdate) => void; onCancel: () => void; onConfirm: () => void }) {
  const { t } = useI18n(); const ref = useRef<HTMLTextAreaElement>(null)
  const [hex, setHex] = useState(draft.style.color)
  useEffect(() => { ref.current?.focus() }, [])
  const panelStyle = position ? { '--length-input-x': `${position.x}px`, '--length-input-y': `${position.y}px` } as CSSProperties : undefined
  const toggle = (key: 'italic' | 'underline' | 'strikeThrough') => onChange({ style: { [key]: !draft.style[key] } })
  return <form className="length-input text-editor" style={panelStyle} onSubmit={(event) => { event.preventDefault(); onConfirm() }}>
    <label className="text-editor-content" htmlFor="text-content"><span>{t('textContent')}</span><textarea ref={ref} id="text-content" rows={3} value={draft.text} onChange={(event) => onChange({ text: event.target.value })} /></label>
    <div className="text-editor-grid">
      <label><span>{t('fontFamily')}</span><select value={draft.style.fontFamily} onChange={(event) => onChange({ style: { fontFamily: event.target.value } })}>{fonts.map((font) => <option key={font}>{font}</option>)}</select></label>
      <label><span>{t('fontSize')}</span><input type="number" min="4" max="500" value={draft.style.fontSize} onChange={(event) => onChange({ style: { fontSize: Math.max(4, Number(event.target.value) || 4) } })} /></label>
      <label><span>{t('textColor')}</span><span className="text-color-input"><input aria-label={t('textColor')} type="color" value={draft.style.color} onChange={(event) => { setHex(event.target.value); onChange({ style: { color: event.target.value } }) }} /><input aria-label="HEX" value={hex} pattern="#[0-9a-fA-F]{6}" onChange={(event) => setHex(event.target.value)} onBlur={() => { if (/^#[0-9a-fA-F]{6}$/.test(hex)) onChange({ style: { color: hex } }); else setHex(draft.style.color) }} /></span></label>
    </div>
    <div className="text-format-controls" role="toolbar" aria-label={t('text')}>
      <button type="button" aria-label={t('bold')} aria-pressed={draft.style.fontWeight >= 600} className={draft.style.fontWeight >= 600 ? 'is-active' : ''} onClick={() => onChange({ style: { fontWeight: draft.style.fontWeight >= 600 ? 400 : 700 } })} title={t('bold')}><strong>B</strong></button>
      <button type="button" aria-label={t('italic')} aria-pressed={draft.style.italic} className={draft.style.italic ? 'is-active' : ''} onClick={() => toggle('italic')} title={t('italic')}><em>I</em></button>
      <button type="button" aria-label={t('underline')} aria-pressed={draft.style.underline} className={draft.style.underline ? 'is-active' : ''} onClick={() => toggle('underline')} title={t('underline')}><u>U</u></button>
      <button type="button" aria-label={t('strikeThrough')} aria-pressed={draft.style.strikeThrough} className={draft.style.strikeThrough ? 'is-active' : ''} onClick={() => toggle('strikeThrough')} title={t('strikeThrough')}><s>S</s></button>
      {(['left', 'center', 'right'] as const).map((align) => { const label = t(align === 'left' ? 'alignLeft' : align === 'center' ? 'alignCenter' : 'alignRight'); return <button key={align} type="button" aria-label={label} aria-pressed={draft.style.textAlign === align} className={draft.style.textAlign === align ? 'is-active' : ''} onClick={() => onChange({ style: { textAlign: align } })} title={label}><AlignmentIcon align={align} /></button> })}
    </div>
    <div className="length-actions"><button type="button" className="secondary-button" onClick={onCancel}>{t('cancel')}</button><button type="submit" className="primary-button" disabled={!draft.text.trim()}>{t('confirm')}</button></div>
  </form>
}

function AlignmentIcon({ align }: { align: 'left' | 'center' | 'right' }) {
  return <span className={`text-align-icon is-${align}`} aria-hidden="true"><i /><i /><i /></span>
}
