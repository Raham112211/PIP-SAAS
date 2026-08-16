import { Settings, Clock } from 'lucide-react';
import s from '../styles/page.module.css';

export function SettingsPage() {
  return (
    <div
      className={s.page}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 'calc(100vh - 120px)',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          padding: '40px 20px',
        }}
      >
        <div
          className={s.emptyStateBadge}
          style={{
            width: 72,
            height: 72,
            borderRadius: 20,
            marginBottom: 18,
          }}
        >
          <Settings size={36} color="var(--color-accent)" />
        </div>

        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 14px',
            background: 'var(--color-accent-soft)',
            border: '1px solid var(--color-accent-border)',
            borderRadius: 999,
            color: 'var(--color-accent-dark)',
            fontSize: 12,
            fontWeight: 700,
            marginBottom: 12,
          }}
        >
          <Clock size={14} /> Coming Soon
        </div>

        <h2
          style={{
            margin: '0 0 6px',
            fontSize: '1.5rem',
            fontWeight: 700,
            color: '#0f172a',
          }}
        >
          Settings
        </h2>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-muted)' }}>
          Coming Soon
        </p>
      </div>
    </div>
  );
}
