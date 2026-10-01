export function KiviLogo({ compact = false }: { compact?: boolean }) {
  return (
    <span className={`kivi-logo${compact ? ' is-compact' : ''}`} aria-label="Kivi">
      <svg viewBox="0 0 36 36" role="img" aria-hidden="true">
        <rect x="2" y="2" width="32" height="32" rx="8" />
        <path d="M11 8v20M12 19 25 8M12 19l13 9" />
        <path className="kivi-logo-measure" d="M21 7v4M24 6v3M21 27v3M24 27v3" />
        <circle cx="27" cy="18" r="1.25" />
      </svg>
      {!compact && <strong>KIVI</strong>}
    </span>
  )
}
