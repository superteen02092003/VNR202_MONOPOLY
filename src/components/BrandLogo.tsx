interface BrandLogoProps {
  compact?: boolean
}

export function BrandLogo({ compact = false }: BrandLogoProps) {
  return (
    <div className={`brand-logo ${compact ? 'brand-logo--compact' : ''}`}>
      <div className="brand-logo__mark" aria-hidden="true">
        <span className="brand-logo__orbit brand-logo__orbit--one" />
        <span className="brand-logo__orbit brand-logo__orbit--two" />
        <svg fill="none" viewBox="0 0 48 48">
          <path
            d="m24 8.5 3.9 8 8.8 1.3-6.4 6.2 1.5 8.8-7.8-4.1-7.8 4.1 1.5-8.8-6.4-6.2 8.8-1.3Z"
            fill="currentColor"
          />
        </svg>
      </div>
      <div className="brand-logo__copy">
        <span className="brand-logo__eyebrow">VNR202</span>
        <strong className="brand-logo__title">BUSINESS VOYAGE</strong>
      </div>
    </div>
  )
}
