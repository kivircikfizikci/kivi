import { useEffect, useRef } from 'react'
import { useI18n } from '../../i18n/I18nContext.ts'
import { MAX_REPEAT_COPIES } from '../geometry/entityTransforms.ts'

export function DistanceInput({ value, valid, onChange, onBack, onConfirm }: { value: string; valid: boolean; onChange: (value: string) => void; onBack: () => void; onConfirm: () => void }) {
  const { t } = useI18n(); const ref = useRef<HTMLInputElement>(null)
  useEffect(() => { ref.current?.focus(); ref.current?.select() }, [])
  return <form className="length-input transform-input" onSubmit={(event) => { event.preventDefault(); if (valid) onConfirm() }}>
    <label htmlFor="transform-distance">{t('distance')}</label>
    <div className="length-field"><input ref={ref} id="transform-distance" inputMode="decimal" value={value} onChange={(event) => onChange(event.target.value)} /><span>{t('centimeters')}</span></div>
    <div className="length-actions"><button type="button" className="secondary-button" onClick={onBack}>{t('back')}</button><button type="submit" className="primary-button" disabled={!valid}>{t('confirm')}</button></div>
  </form>
}

export function RepeatInput({ spacing, copies, valid, onChange, onConfirm }: { spacing: string; copies: string; valid: boolean; onChange: (spacing: string, copies: string) => void; onConfirm: () => void }) {
  const { t } = useI18n(); const ref = useRef<HTMLInputElement>(null)
  useEffect(() => { ref.current?.focus(); ref.current?.select() }, [])
  return <form className="length-input geometry-input repeat-input" onSubmit={(event) => { event.preventDefault(); if (valid) onConfirm() }}>
    <label>{t('repeat')}</label><div className="geometry-fields">
      <label><span>{t('spacing')}</span><input ref={ref} inputMode="decimal" value={spacing} onChange={(event) => onChange(event.target.value, copies)} /></label>
      <label><span>{t('copies')}</span><input type="number" min="1" max={MAX_REPEAT_COPIES} step="1" value={copies} aria-invalid={!valid || undefined} onChange={(event) => onChange(spacing, event.target.value)} /></label>
    </div><div className="repeat-limit">{t('maximumCopies')}: {MAX_REPEAT_COPIES}</div>
    <div className="length-actions"><button type="submit" className="primary-button" disabled={!valid}>{t('confirm')}</button></div>
  </form>
}
