import { useEffect, useRef, type CSSProperties } from 'react'
import { useI18n } from '../../i18n/I18nContext.ts'
import type { CircleInputMode } from '../../tools/CircleTool.ts'
import type { Point } from '../geometry/Point.ts'

export function CircleInput({ value, mode, canConfirm, position, onChange, onModeChange, onBack, onConfirm }: {
  value: string; mode: CircleInputMode; canConfirm: boolean; position?: Point
  onChange: (value: string) => void; onModeChange: (mode: CircleInputMode) => void; onBack: () => void; onConfirm: () => void
}) {
  const { t } = useI18n()
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => { inputRef.current?.focus({ preventScroll: true }); inputRef.current?.select() }, [])
  const style = position ? { '--length-input-x': `${position.x}px`, '--length-input-y': `${position.y}px` } as CSSProperties : undefined
  return (
    <form className="length-input geometry-input circle-input" style={style} onSubmit={(event) => { event.preventDefault(); if (canConfirm) onConfirm() }}>
      <div className="geometry-input-heading">
        <label htmlFor="circle-value">{t(mode)}</label>
        <span className="segmented-control" role="group" aria-label={t('circleMeasurement')}>
          <button type="button" className={mode === 'radius' ? 'is-active' : ''} onClick={() => onModeChange('radius')}>R</button>
          <button type="button" className={mode === 'diameter' ? 'is-active' : ''} onClick={() => onModeChange('diameter')}>D</button>
        </span>
      </div>
      <div className="length-field"><input ref={inputRef} id="circle-value" inputMode="decimal" value={value} onChange={(event) => onChange(event.target.value)} /><span>{t('centimeters')}</span></div>
      <div className="length-actions">
        <button type="button" className="secondary-button" onClick={onBack}>{t('back')}</button>
        <button type="submit" className="primary-button" disabled={!canConfirm}>{t('confirm')}</button>
      </div>
    </form>
  )
}
