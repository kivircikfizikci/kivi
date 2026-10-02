import { useEffect, useRef, type CSSProperties } from 'react'
import { useI18n } from '../../i18n/I18nContext.ts'
import { MAX_POLYGON_SIDES, MIN_POLYGON_SIDES } from '../../tools/PolygonTool.ts'
import type { Point } from '../geometry/Point.ts'

export function PolygonInput({ sides, radius, canConfirm, position, onChange, onBack, onConfirm }: { sides: string; radius: string; canConfirm: boolean; position?: Point; onChange: (sides: string, radius: string) => void; onBack: () => void; onConfirm: () => void }) {
  const { t } = useI18n()
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => { inputRef.current?.focus({ preventScroll: true }); inputRef.current?.select() }, [])
  const style = position ? { '--length-input-x': `${position.x}px`, '--length-input-y': `${position.y}px` } as CSSProperties : undefined
  return <form className="length-input geometry-input polygon-input" style={style} onSubmit={(event) => { event.preventDefault(); if (canConfirm) onConfirm() }}>
    <label>{t('polygon')}</label>
    <div className="geometry-fields">
      <label><span>{t('sides')}</span><input ref={inputRef} type="number" inputMode="numeric" min={MIN_POLYGON_SIDES} max={MAX_POLYGON_SIDES} step="1" value={sides} onChange={(event) => onChange(event.target.value, radius)} /></label>
      <label><span>{t('radius')}</span><input inputMode="decimal" value={radius} onChange={(event) => onChange(sides, event.target.value)} /></label>
    </div>
    <div className="length-actions"><button type="button" className="secondary-button" onClick={onBack}>{t('back')}</button><button type="submit" className="primary-button" disabled={!canConfirm}>{t('confirm')}</button></div>
  </form>
}
