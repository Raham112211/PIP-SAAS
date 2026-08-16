export function Logo({ iconSize = 42, showText = true, className = '', style = {} }) {
  return (
    <div
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 12,
        userSelect: 'none',
        background: 'transparent',
        ...style,
      }}
    >
      {/* High-Resolution Extracted 3D PIP Emblem */}
      <img
        src="/pip-logo.png"
        alt="PIP"
        style={{
          height: iconSize,
          width: 'auto',
          maxHeight: iconSize,
          objectFit: 'contain',
          display: 'block',
          filter: 'drop-shadow(0 2px 8px rgba(8, 182, 232, 0.25))',
        }}
        onError={(e) => {
          e.currentTarget.onerror = null;
          e.currentTarget.src = '/Logo-cropped.png';
        }}
      />

      {/* Clean Typography */}
      {showText && (
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15, justifyContent: 'center' }}>
          <span
            style={{
              fontSize: 13.5,
              fontWeight: 800,
              color: '#0f172a',
              letterSpacing: '-0.01em',
              fontFamily: 'var(--font-heading)',
              whiteSpace: 'nowrap',
            }}
          >
            POWER INTELLIGENCE
          </span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: 'var(--color-accent)',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              fontFamily: 'var(--font-sans)',
              marginTop: 1,
            }}
          >
            SaaS Platform
          </span>
        </div>
      )}
    </div>
  );
}
