import { useEffect, useRef, type CSSProperties } from 'react'
import { useI18n } from '../../i18n/I18nContext'
import type { Point } from '../geometry/Point.ts'

interface LengthInputProps {
  value: string
  canConfirm: boolean
  onChange: (value: string) => void
  onBack: () => void
  onConfirm: () => void
  position?: Point
}

export function LengthInput({ value, canConfirm, onChange, onBack, onConfirm, position }: LengthInputProps) {
  const { t } = useI18n()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus({ preventScroll: true })
    inputRef.current?.select()
  }, [])

  return (
    <form
      className="length-input"
      style={position ? { '--length-input-x': `${position.x}px`, '--length-input-y': `${position.y}px` } as CSSProperties : undefined}
      onSubmit={(event) => { event.preventDefault(); if (canConfirm) onConfirm() }}
    >
      <label htmlFor="line-length">{t('length')}</label>
      <div className="length-field">
        <input
          ref={inputRef}
          id="line-length"
          type="text"
          inputMode="decimal"
          enterKeyHint="done"
          autoComplete="off"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        <span>{t('centimeters')}</span>
      </div>
      <div className="length-actions">
        <button type="button" className="secondary-button" onClick={onBack}>{t('back')}</button>
        <button type="submit" className="primary-button" disabled={!canConfirm}>{t('confirm')}</button>
      </div>
    </form>
  )
}
