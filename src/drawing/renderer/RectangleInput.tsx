import { useEffect, useRef, type CSSProperties } from 'react'
import { useI18n } from '../../i18n/I18nContext.ts'
import type { Point } from '../geometry/Point.ts'

export function RectangleInput({ width, height, canConfirm, position, onChange, onBack, onConfirm }: {
  width: string; height: string; canConfirm: boolean; position?: Point
  onChange: (width: string, height: string) => void; onBack: () => void; onConfirm: () => void
}) {
  const { t } = useI18n()
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => { inputRef.current?.focus({ preventScroll: true }); inputRef.current?.select() }, [])
  const style = position ? { '--length-input-x': `${position.x}px`, '--length-input-y': `${position.y}px` } as CSSProperties : undefined
  return (
    <form className="length-input geometry-input rectangle-input" style={style} onSubmit={(event) => { event.preventDefault(); if (canConfirm) onConfirm() }}>
      <label htmlFor="rectangle-width">{t('rectangle')}</label>
      <div className="geometry-fields">
        <label><span>{t('width')}</span><input ref={inputRef} id="rectangle-width" inputMode="decimal" value={width} onChange={(event) => onChange(event.target.value, height)} /></label>
        <label><span>{t('height')}</span><input inputMode="decimal" value={height} onChange={(event) => onChange(width, event.target.value)} /></label>
      </div>
      <div className="length-actions">
        <button type="button" className="secondary-button" onClick={onBack}>{t('back')}</button>
        <button type="submit" className="primary-button" disabled={!canConfirm}>{t('confirm')}</button>
      </div>
    </form>
  )
}
