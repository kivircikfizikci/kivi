export function KiviLogo({ compact = false }: { compact?: boolean }) {
  return (
    <span className={`kivi-logo${compact ? ' is-compact' : ''}`} aria-label="Kivi">
      {compact ? (
        <img className="kivi-logo-icon" src={`${import.meta.env.BASE_URL}icons/icon.svg`} alt="" aria-hidden="true" />
      ) : (
        <>
          <img className="kivi-logo-wordmark kivi-logo-wordmark-dark" src={`${import.meta.env.BASE_URL}brand/kivi-logo-dark.png`} alt="" aria-hidden="true" />
          <img className="kivi-logo-wordmark kivi-logo-wordmark-light" src={`${import.meta.env.BASE_URL}brand/kivi-logo-light.png`} alt="" aria-hidden="true" />
        </>
      )}
    </span>
  )
}
